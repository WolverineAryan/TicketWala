import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import {
  loadScripts,
  claimHoldFcfs,
  confirmHold,
  releaseHold,
  generateHoldToken,
  getUnitRedisKey,
} from "../../src/lua/index.js";

import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const rawRedisUrl = (process.env.REDIS_URL || "redis://localhost:6379").trim().replace(/^["']|["']$/g, "");
const isPlaceholderRedis =
  rawRedisUrl.includes("[TOKEN]") ||
  rawRedisUrl.includes("[ENDPOINT]") ||
  rawRedisUrl.includes("YOUR_");
const REDIS_URL = isPlaceholderRedis ? "redis://localhost:6379" : rawRedisUrl;

describe("TicketWala Concurrency & Race Hazard Eliminator", () => {
  let redis: Redis;
  let testKeys: string[] = [];
  let testStreamKey = "";

  const useTestStream = () => {
    testStreamKey = `ticketwala:test:${uuidv4()}:events`;
    testKeys.push(testStreamKey);
    return testStreamKey;
  };

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

  afterEach(async () => {
    if (redis?.status === "ready" && testKeys.length) {
      await redis.del(...testKeys);
    }
    testKeys = [];
    testStreamKey = "";
  });

  it("Single-Unit Extreme Contention: 50 simultaneous requests competing for 1 seat", async () => {
    if (!redis || redis.status !== "ready") {
      console.log("Redis not connected, skipping live integration test");
      return;
    }

    const testEventId = `evt-race-${Date.now()}`;
    const queueKey = `ticketwala:event:${testEventId}:available_queue`;
    const streamKey = useTestStream();
    testKeys.push(queueKey);

    // Seed exactly 1 unit
    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-race-01");
    const unitKey = getUnitRedisKey(testEventId, "unit-race-01");
    testKeys.push(unitKey);
    await redis.hmset(unitKey, {
      status: "AVAILABLE",
      version: "1",
      event_id: testEventId,
    });

    // Launch 50 concurrent requests simultaneously
    const numRequests = 50;
    const promises = Array.from({ length: numRequests }).map((_, i) => {
      const resId = uuidv4();
      testKeys.push(`ticketwala:reservation:${resId}`);
      const token = generateHoldToken();
      const idempotencyScopeKey = `client-${i}:${uuidv4()}`;
      testKeys.push(`ticketwala:idempotency:${idempotencyScopeKey}`);
      return claimHoldFcfs(redis, {
        eventId: testEventId,
        streamKey,
        idempotencyScopeKey,
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
    const streamKey = useTestStream();
    testKeys.push(queueKey);

    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-idemp-01");
    const unitKey = getUnitRedisKey(testEventId, "unit-idemp-01");
    testKeys.push(unitKey);
    await redis.hmset(unitKey, {
      status: "AVAILABLE",
      version: "1",
      event_id: testEventId,
    });

    const idempKey = `test-idemp-${uuidv4()}`;
    testKeys.push(`ticketwala:idempotency:${idempKey}`);
    const resId = uuidv4();
    testKeys.push(`ticketwala:reservation:${resId}`);
    const token = generateHoldToken();

    // Call 1: First attempt
    const res1 = await claimHoldFcfs(redis, {
      eventId: testEventId,
      streamKey,
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
      streamKey,
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
    const streamKey = useTestStream();
    testKeys.push(queueKey);

    await redis.del(queueKey);
    await redis.lpush(queueKey, "unit-stale-01");
    const unitKey = getUnitRedisKey(testEventId, "unit-stale-01");
    testKeys.push(unitKey);
    await redis.hmset(unitKey, {
      status: "AVAILABLE",
      version: "1",
      event_id: testEventId,
    });

    // 1. User A claims unit
    const resA = uuidv4();
    testKeys.push(`ticketwala:reservation:${resA}`);
    const tokenA = generateHoldToken();
    const idempotencyScopeA = `userA:${uuidv4()}`;
    testKeys.push(`ticketwala:idempotency:${idempotencyScopeA}`);
    const claimA = await claimHoldFcfs(redis, {
      eventId: testEventId,
      streamKey,
      idempotencyScopeKey: idempotencyScopeA,
      requestFingerprint: "fpA",
      reservationId: resA,
      rawHoldToken: tokenA,
      ttlSeconds: 1,
    });
    expect(claimA.status).toBe("HELD");

    // 2. User A explicitly releases or times out
    await releaseHold(redis, {
      reservationId: resA,
      rawHoldToken: tokenA,
      isTimeoutJob: false,
      streamKey,
    });

    // 3. User B claims the re-queued unit
    const resB = uuidv4();
    testKeys.push(`ticketwala:reservation:${resB}`);
    const tokenB = generateHoldToken();
    const idempotencyScopeB = `userB:${uuidv4()}`;
    testKeys.push(`ticketwala:idempotency:${idempotencyScopeB}`);
    const claimB = await claimHoldFcfs(redis, {
      eventId: testEventId,
      streamKey,
      idempotencyScopeKey: idempotencyScopeB,
      requestFingerprint: "fpB",
      reservationId: resB,
      rawHoldToken: tokenB,
      ttlSeconds: 60,
    });
    expect(claimB.status).toBe("HELD");
    expect(claimB.reservationId).toBe(resB);

    // 4. Delayed worker fires stale timeout for User A
    const staleAttempt = await releaseHold(redis, {
      reservationId: resA,
      isTimeoutJob: true,
      streamKey,
    });

    // Invariant: Stale attempt is safely ignored
    expect(staleAttempt.status).toBe("IGNORED_STALE_RELEASE");

    // Unit remains safely held by User B
    const unitState = await redis.hgetall(getUnitRedisKey(testEventId, "unit-stale-01"));
    expect(unitState.reservation_id).toBe(resB);
    expect(unitState.status).toBe("HELD");
  });

  it("isolates identical unit IDs across events and persists each catalog event ID", async () => {
    if (!redis || redis.status !== "ready") return;

    const eventIds = [`evt-isolation-a-${Date.now()}`, `evt-isolation-b-${Date.now()}`];
    const streamKey = useTestStream();
    const reservationIds = [uuidv4(), uuidv4()];
    testKeys.push(...reservationIds.map((id) => `ticketwala:reservation:${id}`));
    const holdTokens = [generateHoldToken(), generateHoldToken()];

    for (const eventId of eventIds) {
      const queueKey = `ticketwala:event:${eventId}:available_queue`;
      const unitKey = getUnitRedisKey(eventId, "unit-001");
      testKeys.push(queueKey, unitKey);
      await redis.del(queueKey);
      await redis.lpush(queueKey, "unit-001");
      await redis.hmset(unitKey, {
        status: "AVAILABLE",
        version: "1",
        event_id: eventId,
      });
    }

    const idempotencyScopeKeys = eventIds.map(() => `isolation-${uuidv4()}`);
    testKeys.push(...idempotencyScopeKeys.map((key) => `ticketwala:idempotency:${key}`));
    const holds = await Promise.all(eventIds.map((eventId, index) =>
      claimHoldFcfs(redis, {
        eventId,
        streamKey,
        idempotencyScopeKey: idempotencyScopeKeys[index],
        requestFingerprint: `fingerprint-${index}`,
        reservationId: reservationIds[index],
        rawHoldToken: holdTokens[index],
        ttlSeconds: 60,
      })
    ));

    expect(holds.map((hold) => hold.status)).toEqual(["HELD", "HELD"]);
    expect(await redis.hget(getUnitRedisKey(eventIds[0], "unit-001"), "reservation_id")).toBe(reservationIds[0]);
    expect(await redis.hget(getUnitRedisKey(eventIds[1], "unit-001"), "reservation_id")).toBe(reservationIds[1]);

    for (let i = 0; i < eventIds.length; i++) {
      const result = await confirmHold(redis, {
        reservationId: reservationIds[i],
        rawHoldToken: holdTokens[i],
        streamKey,
      });
      expect(result.status).toBe("CONFIRMED");
      expect(result.eventId).toBe(eventIds[i]);
    }
  });
});
