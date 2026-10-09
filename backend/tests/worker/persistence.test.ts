import { afterEach, describe, expect, it, vi } from "vitest";
import type Redis from "ioredis";
import type { Pool } from "pg";
import { persistReservationEvent, type WorkerCounters } from "../../src/worker/persistence.js";

const options = {
  streamKey: "ticketwala:events",
  groupName: "ticketwala_workers",
  deadLetterStreamKey: "ticketwala:events:dead-letter",
  maxProcessingAttempts: 5,
};

const fields = {
  event_type: "HOLD_CREATED",
  event_id_ref: "evt-test",
  reservation_id: "reservation-test",
  unit_id: "unit-001",
  version: "1",
  occurred_at: "1710000000",
  expires_at: "1710000120",
};

function createHarness(configuration?: {
  eventRowCount?: number;
  failLedgerInsert?: boolean;
  attempts?: number;
  failAck?: boolean;
  pending?: boolean;
}) {
  const order: string[] = [];
  const query = vi.fn(async (sql: string, _params?: unknown[]) => {
    order.push(sql.trim().split(/\s+/).slice(0, 3).join(" "));
    if (configuration?.failLedgerInsert && sql.includes("INSERT INTO reservation_events")) {
      throw new Error("database unavailable");
    }
    if (sql.includes("INSERT INTO reservation_events")) {
      return { rowCount: configuration?.eventRowCount ?? 1, rows: [] };
    }
    return { rowCount: 1, rows: [] };
  });
  const client = { query, release: vi.fn() };
  const pool = { connect: vi.fn(async () => client) } as unknown as Pool;

  const redis = {
    incr: vi.fn(async () => configuration?.attempts ?? 1),
    expire: vi.fn(async () => 1),
    eval: vi.fn(async () => {
      order.push("DEAD_LETTER");
      return configuration?.pending === false ? 0 : 1;
    }),
    xack: vi.fn(async () => {
      order.push("XACK");
      if (configuration?.failAck) throw new Error("ack unavailable");
      return 1;
    }),
    del: vi.fn(async () => 1),
  } as unknown as Redis;
  const counters: WorkerCounters = { processed: 0, retried: 0, deadLettered: 0 };

  return { redis, pool, query, order, counters };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Redis stream persistence reliability", () => {
  it("persists catalog event identity and acknowledges only after commit", async () => {
    const harness = createHarness();
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    const eventInsert = harness.query.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO reservation_events")
    );
    expect(eventInsert?.[1]).toContain("evt-test");
    const reservationInsert = harness.query.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO reservations")
    );
    expect(reservationInsert?.[1]).toContain("evt-test");
    expect(harness.order.indexOf("COMMIT")).toBeLessThan(harness.order.indexOf("XACK"));
    expect(harness.counters.processed).toBe(1);
    expect(logError).not.toHaveBeenCalled();
  });

  it("treats duplicate ledger delivery as committed and acknowledges it", async () => {
    const harness = createHarness({ eventRowCount: 0 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    expect(harness.query).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO reservations"),
      expect.anything()
    );
    expect(harness.order.indexOf("COMMIT")).toBeLessThan(harness.order.indexOf("XACK"));
    expect(harness.counters.processed).toBe(1);
  });

  it("leaves a failed database event pending while attempts remain", async () => {
    const harness = createHarness({ failLedgerInsert: true, attempts: 2 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    expect(harness.redis.incr).toHaveBeenCalledWith("ticketwala:worker:attempts:1710000000000-0");
    expect(harness.redis.xack).not.toHaveBeenCalled();
    expect(harness.redis.eval).not.toHaveBeenCalled();
    expect(harness.counters.retried).toBe(1);
  });

  it("atomically dead-letters and acknowledges after the retry limit", async () => {
    const harness = createHarness({ failLedgerInsert: true, attempts: 5 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    expect(harness.redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("XPENDING"),
      3,
      options.streamKey,
      options.deadLetterStreamKey,
      "ticketwala:worker:attempts:1710000000000-0",
      options.groupName,
      "1710000000000-0",
      "5",
      "database unavailable",
      JSON.stringify(fields)
    );
    expect(harness.counters.deadLettered).toBe(1);
  });

  it("does not dead-letter an event that another worker already acknowledged", async () => {
    const harness = createHarness({ failLedgerInsert: true, attempts: 5, pending: false });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    expect(harness.redis.eval).toHaveBeenCalledOnce();
    expect(harness.counters.deadLettered).toBe(0);
    expect(harness.redis.xack).not.toHaveBeenCalled();
  });

  it("does not count an XACK failure as a database retry", async () => {
    const harness = createHarness({ failAck: true });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await persistReservationEvent(
      harness.redis,
      harness.pool,
      "1710000000000-0",
      fields,
      harness.counters,
      options
    );

    expect(harness.redis.incr).not.toHaveBeenCalled();
    expect(harness.redis.eval).not.toHaveBeenCalled();
    expect(harness.redis.del).not.toHaveBeenCalled();
    expect(harness.counters.processed).toBe(0);
  });
});
