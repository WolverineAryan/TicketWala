import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import {
  loadScripts,
  claimHoldFcfs,
  confirmHold,
  releaseHold,
  generateHoldToken,
} from "../../src/lua/index.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

describe("TicketWala Concurrency & Race Hazard Eliminator", () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
    try {
      await redis.ping();
      await loadScripts(redis);
    } catch (err: any) {
      console.warn("Skipping live Redis tests if Redis is not currently running locally:", err.message);
    }
  });

  afterAll(async () => {
    if (redis) redis.disconnect();
  });

  it("Single-Unit Extreme Contention: 50 simultaneous requests competing for 1 seat", async () => {
    if (!redis || redis.status !== "ready") {
      console.log("Redis not connected, skipping live integration test");
      return;
    }

    const testEventId = `evt-race-${Date.now()}`;
    const queueKey = `ticketwala:event:${testEventId}:available_queue`;

    // Seed exactly 1 unit
    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-race-01");
    await redis.hmset("ticketwala:unit:unit-race-01", { status: "AVAILABLE", version: "1" });

    // Launch 50 concurrent requests simultaneously
    const numRequests = 50;
    const promises = Array.from({ length: numRequests }).map((_, i) => {
      const resId = uuidv4();
      const token = generateHoldToken();
      return claimHoldFcfs(redis, {
        eventId: testEventId,
        idempotencyScopeKey: `client-${i}:${uuidv4()}`,
        requestFingerprint: `fp-${i}`,
        reservationId: resId,
        rawHoldToken: token,
        ttlSeconds: 60,
      });
    });

    const results = await Promise.all(promises);

    const successfulHolds = results.filter((r) => r.status === "HELD");
    const soldOutRejections = results.filter((r) => r.error === "SOLD_OUT" && r.code === 409);

    // INVARIANT CHECK: Exactly 1 holder, 49 rejected
    expect(successfulHolds.length).toBe(1);
    expect(soldOutRejections.length).toBe(49);
    expect(successfulHolds[0].unitId).toBe("unit-race-01");
  });

  it("Deterministic Idempotency: Repeating request with identical key returns cached response", async () => {
    if (!redis || redis.status !== "ready") return;

    const testEventId = `evt-idemp-${Date.now()}`;
    const queueKey = `ticketwala:event:${testEventId}:available_queue`;

    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-idemp-01");
    await redis.hmset("ticketwala:unit:unit-idemp-01", { status: "AVAILABLE", version: "1" });

    const idempKey = `test-idemp-${uuidv4()}`;
    const resId = uuidv4();
    const token = generateHoldToken();

    // Call 1: First attempt
    const res1 = await claimHoldFcfs(redis, {
      eventId: testEventId,
      idempotencyScopeKey: idempKey,
      requestFingerprint: "fingerprint-alpha",
      reservationId: resId,
      rawHoldToken: token,
      ttlSeconds: 60,
    });
    expect(res1.status).toBe("HELD");

    // Call 2: Duplicate retry with exact same idempotency key and fingerprint
    const res2 = await claimHoldFcfs(redis, {
      eventId: testEventId,
      idempotencyScopeKey: idempKey,
      requestFingerprint: "fingerprint-alpha",
      reservationId: uuidv4(), // Different candidate ID, but same key
      rawHoldToken: generateHoldToken(),
      ttlSeconds: 60,
    });

    // Must return identical original reservation ID and unit
    expect(res2.reservationId).toBe(res1.reservationId);
    expect(res2.unitId).toBe(res1.unitId);

    // Call 3: Reuse key with altered parameters (Conflict)
    const res3 = await claimHoldFcfs(redis, {
      eventId: testEventId,
      idempotencyScopeKey: idempKey,
      requestFingerprint: "altered-payload-fingerprint",
      reservationId: uuidv4(),
      rawHoldToken: generateHoldToken(),
      ttlSeconds: 60,
    });
    expect(res3.error).toBe("IDEMPOTENCY_CONFLICT");
    expect(res3.code).toBe(422);
  });

  it("Stale Expiry Defense: Old hold expiry does not revoke newly reassigned seat", async () => {
    if (!redis || redis.status !== "ready") return;

    const testEventId = `evt-stale-${Date.now()}`;
    const queueKey = `ticketwala:event:${testEventId}:available_queue`;

    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-stale-01");
    await redis.hmset("ticketwala:unit:unit-stale-01", { status: "AVAILABLE", version: "1" });

    // 1. User A claims unit
    const resA = uuidv4();
    const tokenA = generateHoldToken();
    const claimA = await claimHoldFcfs(redis, {
      eventId: testEventId,
      idempotencyScopeKey: `userA:${uuidv4()}`,
      requestFingerprint: "fpA",
      reservationId: resA,
      rawHoldToken: tokenA,
      ttlSeconds: 1,
    });
    expect(claimA.status).toBe("HELD");

    // 2. User A explicitly releases or times out
    await releaseHold(redis, {
      eventId: testEventId,
      reservationId: resA,
      rawHoldToken: tokenA,
      isTimeoutJob: false,
    });

    // 3. User B claims the re-queued unit
    const resB = uuidv4();
    const tokenB = generateHoldToken();
    const claimB = await claimHoldFcfs(redis, {
      eventId: testEventId,
      idempotencyScopeKey: `userB:${uuidv4()}`,
      requestFingerprint: "fpB",
      reservationId: resB,
      rawHoldToken: tokenB,
      ttlSeconds: 60,
    });
    expect(claimB.status).toBe("HELD");
    expect(claimB.reservationId).toBe(resB);

    // 4. Delayed worker fires stale timeout for User A
    const staleAttempt = await releaseHold(redis, {
      eventId: testEventId,
      reservationId: resA,
      isTimeoutJob: true,
    });

    // Invariant: Stale attempt is safely ignored
    expect(staleAttempt.status).toBe("IGNORED_STALE_RELEASE");

    // Unit remains safely held by User B
    const unitState = await redis.hgetall("ticketwala:unit:unit-stale-01");
    expect(unitState.reservation_id).toBe(resB);
    expect(unitState.status).toBe("HELD");
  });
});
