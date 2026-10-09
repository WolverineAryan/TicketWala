import Redis from "ioredis";
import { Pool, PoolClient } from "pg";

export interface WorkerCounters {
  processed: number;
  retried: number;
  deadLettered: number;
  databaseAttempts: number;
  databaseTimeMs: number;
  lastDatabaseDurationMs: number;
  lastDatabaseAt: number;
}

export interface PersistenceOptions {
  streamKey: string;
  groupName: string;
  deadLetterStreamKey: string;
  maxProcessingAttempts: number;
}

const DEAD_LETTER_PENDING_EVENT_LUA = `
local pending = redis.call('XPENDING', KEYS[1], ARGV[1], ARGV[2], ARGV[2], 1)
if #pending == 0 then
    redis.call('DEL', KEYS[3])
    return 0
end

redis.call('XADD', KEYS[2], '*',
    'source_stream_id', ARGV[2],
    'attempts', ARGV[3],
    'error', ARGV[4],
    'payload', ARGV[5]
)
redis.call('XACK', KEYS[1], ARGV[1], ARGV[2])
redis.call('DEL', KEYS[3])
return 1
`;

export async function persistReservationEvent(
  redis: Redis,
  pgPool: Pool,
  msgId: string,
  fields: Record<string, string>,
  counters: WorkerCounters,
  options: PersistenceOptions
): Promise<void> {
  const eventType = fields.event_type;
  const catalogEventId = fields.event_id_ref;
  const reservationId = fields.reservation_id;
  const unitId = fields.unit_id;
  const version = Number(fields.version);
  const occurredAtSeconds = Number(fields.occurred_at);
  const occurredAt = new Date(occurredAtSeconds * 1000);
  const expiresAtSeconds = fields.expires_at ? Number(fields.expires_at) : null;

  let client: PoolClient | undefined;
  let committed = false;
  let databaseStartedAt: number | undefined;
  try {
    if (
      !eventType ||
      !catalogEventId ||
      !reservationId ||
      !unitId ||
      !Number.isFinite(occurredAtSeconds) ||
      !Number.isFinite(occurredAt.getTime()) ||
      !Number.isInteger(version) ||
      version < 1
    ) {
      throw new Error(`Invalid reservation event: ${msgId}`);
    }

    if (
      eventType === "HOLD_CREATED" &&
      (expiresAtSeconds === null || !Number.isFinite(expiresAtSeconds))
    ) {
      throw new Error(`Invalid hold expiry timestamp: ${msgId}`);
    }

    databaseStartedAt = performance.now();
    counters.databaseAttempts++;
    const dbClient = await pgPool.connect();
    client = dbClient;
    const verifyReservationWrite = async (rowCount: number | null) => {
      if (rowCount !== 0) return;
      const existing = await dbClient.query(
        "SELECT event_id, unit_id, version FROM reservations WHERE reservation_id = $1",
        [reservationId]
      );
      const row = existing.rows[0];
      if (
        !row ||
        row.event_id !== catalogEventId ||
        row.unit_id !== unitId ||
        Number(row.version) < version
      ) {
        throw new Error(`Reservation identity/version conflict while processing event ${msgId}.`);
      }
    };

    await dbClient.query("BEGIN");
    const eventRes = await dbClient.query(
      `
        INSERT INTO reservation_events (event_id, event_type, reservation_id, event_id_ref, unit_id, version, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id;
      `,
      [msgId, eventType, reservationId, catalogEventId, unitId, version, occurredAt]
    );

    if (eventRes.rowCount === 0) {
      await dbClient.query("COMMIT");
      committed = true;
    } else {
      let writeResult;
      if (eventType === "HOLD_CREATED") {
        writeResult = await dbClient.query(
          `
            INSERT INTO reservations (reservation_id, unit_id, event_id, status, version, hold_expires_at, created_at, updated_at)
            VALUES ($1, $2, $3, 'HELD', $4, to_timestamp($5), $6, $6)
            ON CONFLICT (reservation_id) DO UPDATE
            SET event_id = EXCLUDED.event_id,
                unit_id = EXCLUDED.unit_id,
                status = 'HELD',
                version = EXCLUDED.version,
                updated_at = EXCLUDED.updated_at
            WHERE reservations.event_id = EXCLUDED.event_id
              AND reservations.unit_id = EXCLUDED.unit_id
              AND reservations.version <= EXCLUDED.version;
          `,
          [reservationId, unitId, catalogEventId, version, expiresAtSeconds, occurredAt]
        );
      } else if (eventType === "RESERVATION_CONFIRMED") {
        writeResult = await dbClient.query(
          `
            INSERT INTO reservations
              (reservation_id, unit_id, event_id, status, version, confirmed_at, created_at, updated_at)
            VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, $5, $5)
            ON CONFLICT (reservation_id) DO UPDATE
            SET status = 'CONFIRMED',
                version = EXCLUDED.version,
                confirmed_at = EXCLUDED.confirmed_at,
                updated_at = EXCLUDED.updated_at
            WHERE reservations.event_id = EXCLUDED.event_id
              AND reservations.unit_id = EXCLUDED.unit_id
              AND reservations.version <= EXCLUDED.version;
          `,
          [reservationId, unitId, catalogEventId, version, occurredAt]
        );
      } else if (eventType === "HOLD_EXPIRED" || eventType === "HOLD_RELEASED") {
        const terminalStatus = eventType === "HOLD_EXPIRED" ? "EXPIRED" : "RELEASED";
        writeResult = await dbClient.query(
          `
            INSERT INTO reservations
              (reservation_id, unit_id, event_id, status, version, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $6)
            ON CONFLICT (reservation_id) DO UPDATE
            SET status = EXCLUDED.status,
                version = EXCLUDED.version,
                updated_at = EXCLUDED.updated_at
            WHERE reservations.event_id = EXCLUDED.event_id
              AND reservations.unit_id = EXCLUDED.unit_id
              AND reservations.version <= EXCLUDED.version;
          `,
          [reservationId, unitId, catalogEventId, terminalStatus, version, occurredAt]
        );
      } else {
        throw new Error(`Unsupported reservation event type: ${eventType}`);
      }

      await verifyReservationWrite(writeResult.rowCount);
      await dbClient.query("COMMIT");
      committed = true;
    }
  } catch (err: unknown) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("PostgreSQL rollback failed:", rollbackErr);
      }
    }

    if (!committed) {
      const attemptKey = `ticketwala:worker:attempts:${msgId}`;
      const attempts = await redis.incr(attemptKey);
      await redis.expire(attemptKey, 7 * 24 * 60 * 60);
      if (attempts >= options.maxProcessingAttempts) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const deadLettered = await redis.eval(
          DEAD_LETTER_PENDING_EVENT_LUA,
          3,
          options.streamKey,
          options.deadLetterStreamKey,
          attemptKey,
          options.groupName,
          msgId,
          String(attempts),
          errorMessage.slice(0, 1000),
          JSON.stringify(fields)
        );
        if (Number(deadLettered) === 1) {
          counters.deadLettered++;
          console.error(`Dead-lettered Redis event ${msgId} after ${attempts} processing attempts:`, err);
        }
      } else {
        counters.retried++;
        console.error(`Redis event ${msgId} failed on attempt ${attempts}/${options.maxProcessingAttempts}:`, err);
      }
    }
  } finally {
    client?.release();
    if (databaseStartedAt !== undefined) {
      const databaseDurationMs = performance.now() - databaseStartedAt;
      counters.databaseTimeMs += databaseDurationMs;
      counters.lastDatabaseDurationMs = databaseDurationMs;
      counters.lastDatabaseAt = Date.now();
    }
  }

  if (committed) {
    try {
      await redis.xack(options.streamKey, options.groupName, msgId);
      counters.processed++;
    } catch (ackErr) {
      console.error(`Postgres committed Redis event ${msgId}, but XACK failed; it will be safely retried:`, ackErr);
      return;
    }
    try {
      await redis.del(`ticketwala:worker:attempts:${msgId}`);
    } catch (cleanupErr) {
      console.error(`Processed Redis event ${msgId}, but retry-counter cleanup failed:`, cleanupErr);
    }
  }
}
