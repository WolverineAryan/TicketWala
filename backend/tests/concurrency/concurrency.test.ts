import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import {
  claimHoldFcfs,
  confirmHold,
  eventKey,
  generateHoldToken,
  initializeInventory,
  queueKey,
  releaseHold,
  reservationPrefix,
  streamKey,
  unitPrefix,
} from "../../src/lua/index.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
let redisAvailable = false;

async function cleanup(eventId: string): Promise<void> {
  const keys = await redis.keys(`ticketwala:event:{${eventId}}:*`);
  if (keys.length > 0) await redis.del(...keys);
}

async function setup(eventId: string): Promise<void> {
  await cleanup(eventId);
  const result = await initializeInventory(redis, eventId);
  expect(result.status).toBe("INITIALIZED");
  expect(result.capacity).toBe(200);
}

async function setupSingleUnit(eventId: string): Promise<void> {
  await setup(eventId);
  const queue = queueKey(eventId);
  await redis.del(queue, eventKey(eventId, "available_units"));
  const unitId = "unit-001";
  await redis.rpush(queue, unitId);
  await redis.sadd(eventKey(eventId, "available_units"), unitId);
  await redis.hset(`${unitPrefix(eventId)}:${unitId}`, "status", "AVAILABLE", "version", "1");
}

async function hold(eventId: string, idempotencyKey = uuidv4(), fingerprint = uuidv4()) {
  const rawHoldToken = generateHoldToken();
  const reservationId = uuidv4();
  const result = await claimHoldFcfs(redis, {
    eventId,
    idempotencyScopeKey: idempotencyKey,
    requestFingerprint: fingerprint,
    reservationId,
    rawHoldToken,
  });
  return { result, rawHoldToken, reservationId, idempotencyKey, fingerprint };
}

describe("FlashLock Redis/Lua core", () => {
  beforeAll(async () => {
    try {
      await redis.connect();
      await redis.ping();
      redisAvailable = true;
    } catch (error) {
      console.warn(`Redis integration tests skipped: ${(error as Error).message}`);
      redis.disconnect();
    }
  });

  afterAll(async () => {
    if (redisAvailable) await redis.quit();
  });

  it("initializes exactly 200 unique units", async () => {
    if (!redisAvailable) return;
    const eventId = `test-init-${uuidv4()}`;
    try {
      await setup(eventId);
      const units = await redis.keys(`${unitPrefix(eventId)}:*`);
      const available = await redis.smembers(eventKey(eventId, "available_units"));
      expect(units).toHaveLength(200);
      expect(new Set(available).size).toBe(200);
      expect(await redis.llen(queueKey(eventId))).toBe(200);
    } finally {
      await cleanup(eventId);
    }
  });

  it("repeated initialization preserves live reservations and does not duplicate units", async () => {
    if (!redisAvailable) return;
    const eventId = `test-reinit-${uuidv4()}`;
    try {
      await setup(eventId);
      const first = await hold(eventId);
      expect(first.result.status).toBe("HELD");
      const second = await initializeInventory(redis, eventId);
      expect(second.capacity).toBe(200);
      expect(await redis.hget(`${unitPrefix(eventId)}:${first.result.unitId}`, "reservation_id")).toBe(first.reservationId);
      expect(await redis.llen(queueKey(eventId))).toBe(199);
      expect(new Set(await redis.lrange(queueKey(eventId), 0, -1)).size).toBe(199);
    } finally {
      await cleanup(eventId);
    }
  });

  it("keeps HELD and CONFIRMED units out of both available projections", async () => {
    if (!redisAvailable) return;
    const eventId = `test-occupied-init-${uuidv4()}`;
    try {
      await setup(eventId);
      const held = await hold(eventId);
      const confirmed = await hold(eventId);
      const confirmation = await confirmHold(redis, {
        eventId,
        reservationId: confirmed.reservationId,
        rawHoldToken: confirmed.rawHoldToken,
      });
      expect(confirmation.status).toBe("CONFIRMED");

      const result = await initializeInventory(redis, eventId);
      expect(result).toMatchObject({ status: "INITIALIZED", capacity: 200, available: 198 });

      const queue = await redis.lrange(queueKey(eventId), 0, -1);
      const members = await redis.smembers(eventKey(eventId, "available_units"));
      expect(new Set(queue)).toEqual(new Set(members));
      expect(queue).toHaveLength(198);
      expect(queue).not.toContain(held.result.unitId);
      expect(queue).not.toContain(confirmed.result.unitId);
      expect(members).not.toContain(held.result.unitId);
      expect(members).not.toContain(confirmed.result.unitId);
      expect(await redis.hget(`${unitPrefix(eventId)}:${held.result.unitId}`, "status")).toBe("HELD");
      expect(await redis.hget(`${unitPrefix(eventId)}:${confirmed.result.unitId}`, "status")).toBe("CONFIRMED");
    } finally {
      await cleanup(eventId);
    }
  });

  it("rejects ambiguous inventory without changing the queue or membership set", async () => {
    if (!redisAvailable) return;
    const eventId = `test-corrupt-init-${uuidv4()}`;
    try {
      await setup(eventId);
      const beforeQueue = await redis.lrange(queueKey(eventId), 0, -1);
      const beforeMembers = await redis.smembers(eventKey(eventId, "available_units"));
      await redis.hset(`${unitPrefix(eventId)}:unit-001`, "reservation_id", uuidv4());

      const result = await initializeInventory(redis, eventId);
      expect(result).toMatchObject({ error: "INVENTORY_CORRUPT", code: 409 });
      expect(await redis.lrange(queueKey(eventId), 0, -1)).toEqual(beforeQueue);
      expect(new Set(await redis.smembers(eventKey(eventId, "available_units")))).toEqual(new Set(beforeMembers));
    } finally {
      await cleanup(eventId);
    }
  });

  it("never allocates one unit to two active reservations and conserves capacity", async () => {
    if (!redisAvailable) return;
    const eventId = `test-contention-${uuidv4()}`;
    try {
      await setup(eventId);
      const results = await Promise.all(Array.from({ length: 260 }, () => hold(eventId)));
      const successful = results.filter(({ result }) => result.status === "HELD");
      expect(successful).toHaveLength(200);
      expect(new Set(successful.map(({ result }) => result.unitId)).size).toBe(200);
      expect(results.filter(({ result }) => result.error === "SOLD_OUT")).toHaveLength(60);
      expect(await redis.llen(queueKey(eventId))).toBe(0);
    } finally {
      await cleanup(eventId);
    }
  });

  it("returns deterministic idempotent results and rejects fingerprint conflicts", async () => {
    if (!redisAvailable) return;
    const eventId = `test-idempotency-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const first = await hold(eventId, "client-key", "same-fingerprint");
      const retry = await claimHoldFcfs(redis, {
        eventId,
        idempotencyScopeKey: "client-key",
        requestFingerprint: "same-fingerprint",
        reservationId: uuidv4(),
        rawHoldToken: generateHoldToken(),
      });
      expect(retry).toMatchObject({
        reservationId: first.result.reservationId,
        unitId: first.result.unitId,
        status: "HELD",
        idempotentReplay: true,
      });
      expect(retry).not.toHaveProperty("holdToken");
      const conflict = await claimHoldFcfs(redis, {
        eventId,
        idempotencyScopeKey: "client-key",
        requestFingerprint: "different-fingerprint",
        reservationId: uuidv4(),
        rawHoldToken: generateHoldToken(),
      });
      expect(conflict).toMatchObject({ error: "IDEMPOTENCY_CONFLICT", code: 422 });
    } finally {
      await cleanup(eventId);
    }
  });

  it("confirms valid holds, is idempotent on repeat, and rejects invalid or expired holds", async () => {
    if (!redisAvailable) return;
    const eventId = `test-confirm-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const valid = await hold(eventId);
      const confirmed = await confirmHold(redis, {
        eventId,
        reservationId: valid.reservationId,
        rawHoldToken: valid.rawHoldToken,
      });
      expect(confirmed).toMatchObject({ status: "CONFIRMED", version: 3 });
      const repeated = await confirmHold(redis, {
        eventId,
        reservationId: valid.reservationId,
        rawHoldToken: valid.rawHoldToken,
      });
      expect(repeated).toMatchObject({ status: "CONFIRMED", version: 3 });

      await setupSingleUnit(eventId);
      const invalid = await hold(eventId);
      const badToken = await confirmHold(redis, {
        eventId,
        reservationId: invalid.reservationId,
        rawHoldToken: "wrong-token",
      });
      expect(badToken.error).toBe("INVALID_HOLD_TOKEN");
      await redis.hset(`${reservationPrefix(eventId)}:${invalid.reservationId}`, "expires_at", "1");
      const expiredResult = await confirmHold(redis, {
        eventId,
        reservationId: invalid.reservationId,
        rawHoldToken: invalid.rawHoldToken,
      });
      expect(expiredResult.error).toBe("HOLD_EXPIRED");
    } finally {
      await cleanup(eventId);
    }
  });

  it("enforces release ownership and makes repeated release safe", async () => {
    if (!redisAvailable) return;
    const eventId = `test-release-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const valid = await hold(eventId);
      const invalid = await releaseHold(redis, {
        eventId,
        reservationId: valid.reservationId,
        rawHoldToken: "wrong-token",
      });
      expect(invalid.error).toBe("INVALID_HOLD_TOKEN");
      const released = await releaseHold(redis, {
        eventId,
        reservationId: valid.reservationId,
        rawHoldToken: valid.rawHoldToken,
      });
      expect(released).toMatchObject({ status: "RELEASED", version: 3 });
      const repeated = await releaseHold(redis, {
        eventId,
        reservationId: valid.reservationId,
        rawHoldToken: valid.rawHoldToken,
      });
      expect(repeated).toMatchObject({ status: "RELEASED", version: 3 });
    } finally {
      await cleanup(eventId);
    }
  });

  it("cannot let a stale expiry job free a newer reservation", async () => {
    if (!redisAvailable) return;
    const eventId = `test-expiry-fence-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const first = await hold(eventId);
      const released = await releaseHold(redis, {
        eventId,
        reservationId: first.reservationId,
        rawHoldToken: first.rawHoldToken,
      });
      expect(released.status).toBe("RELEASED");
      const second = await hold(eventId);
      const stale = await releaseHold(redis, {
        eventId,
        reservationId: first.reservationId,
        isTimeoutJob: true,
        expectedVersion: first.result.version,
      });
      expect(stale.status).toBe("RELEASED");
      expect(await redis.hget(`${unitPrefix(eventId)}:${second.result.unitId}`, "reservation_id")).toBe(second.reservationId);
    } finally {
      await cleanup(eventId);
    }
  });

  it("emits versioned stream events atomically with state transitions", async () => {
    if (!redisAvailable) return;
    const eventId = `test-events-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const created = await hold(eventId);
      const confirmed = await confirmHold(redis, {
        eventId,
        reservationId: created.reservationId,
        rawHoldToken: created.rawHoldToken,
      });
      const eventStream = streamKey(eventId);
      const messages = (await redis.xrange(eventStream, "-", "+")) as Array<[string, string[]]>;
      const relevant = messages.filter(([, fields]) => fields.includes(created.reservationId));
      expect(relevant).toHaveLength(2);
      const types = relevant.map(([, fields]) => fields[fields.indexOf("event_type") + 1]);
      const versions = relevant.map(([, fields]) => Number(fields[fields.indexOf("version") + 1]));
      expect(types).toEqual(["HOLD_CREATED", "RESERVATION_CONFIRMED"]);
      expect(versions).toEqual([2, confirmed.version]);
      expect(relevant[0][1]).toContain("event_id_ref");
      expect(relevant[0][1]).toContain("payload");
    } finally {
      const streamEntries = await redis.xrange(streamKey(eventId), "-", "+");
      const ids = streamEntries
        .filter(([, fields]) => fields.includes(eventId))
        .map(([id]) => id);
      if (ids.length > 0) await redis.xdel(streamKey(eventId), ...ids);
      await cleanup(eventId);
    }
  });

  it("does not partially mutate state for invalid release or confirmation", async () => {
    if (!redisAvailable) return;
    const eventId = `test-no-partial-${uuidv4()}`;
    try {
      await setupSingleUnit(eventId);
      const created = await hold(eventId);
      const unitKey = `${unitPrefix(eventId)}:${created.result.unitId}`;
      const before = await redis.hgetall(unitKey);
      await confirmHold(redis, {
        eventId,
        reservationId: created.reservationId,
        rawHoldToken: "invalid",
      });
      await releaseHold(redis, {
        eventId,
        reservationId: created.reservationId,
        rawHoldToken: "invalid",
      });
      expect(await redis.hgetall(unitKey)).toEqual(before);
      expect(await redis.llen(queueKey(eventId))).toBe(0);
    } finally {
      await cleanup(eventId);
    }
  });
});
