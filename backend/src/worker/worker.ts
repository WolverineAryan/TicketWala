import Redis from "ioredis";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { releaseHold } from "../lua/index.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const rawRedisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isPlaceholderRedis =
  rawRedisUrl.includes("[TOKEN]") ||
  rawRedisUrl.includes("[ENDPOINT]") ||
  rawRedisUrl.includes("YOUR_");
const REDIS_URL = isPlaceholderRedis ? "redis://localhost:6379" : rawRedisUrl;

const DATABASE_URL =
  process.env.DATABASE_DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const STREAM_KEY = "ticketwala:events";
const GROUP_NAME = "ticketwala_workers";
const WORKER_ID = `worker-${process.pid}-${Math.random().toString(36).substring(7)}`;
const BATCH_SIZE = parseInt(process.env.WORKER_BATCH_SIZE || "50", 10);
const CLAIM_INTERVAL = parseInt(process.env.WORKER_CLAIM_INTERVAL_MS || "5000", 10);

let isRunning = true;

async function runWorker() {
  console.log(`👷 Starting TicketWala Worker [${WORKER_ID}]...`);
  console.log(`🔌 Connecting to Supabase/Postgres & Upstash/Redis...`);

  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 5,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });

  const pgPool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
  });

  // 1. Initialize Stream Consumer Group
  try {
    await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "0", "MKSTREAM");
    console.log(`✅ Created consumer group [${GROUP_NAME}] on stream [${STREAM_KEY}].`);
  } catch (err: any) {
    if (err.message && err.message.includes("BUSYGROUP")) {
      console.log(`ℹ️ Consumer group [${GROUP_NAME}] already exists.`);
    } else {
      console.warn(`⚠️ Warning on consumer group creation: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Message Processor (Idempotent SQL Transaction)
  // ---------------------------------------------------------------------------
  const processEvent = async (msgId: string, fields: Record<string, string>) => {
    const eventType = fields.event_type;
    const reservationId = fields.reservation_id;
    const unitId = fields.unit_id;
    const version = Number(fields.version);
    const occurredAt = new Date(
      fields.occurred_at ? Number(fields.occurred_at) * 1000 : Date.now()
    );
    const expiresAtSeconds = fields.expires_at
      ? Number(fields.expires_at)
      : null;

    if (
      !eventType ||
      !reservationId ||
      !unitId ||
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

    const client = await pgPool.connect();

    try {
      await client.query("BEGIN");

      // Idempotency check: record event in reservation_events ledger
      const insertEventQuery = `
        INSERT INTO reservation_events (event_id, event_type, reservation_id, unit_id, version, occurred_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id;
      `;
      const eventRes = await client.query(insertEventQuery, [
        msgId,
        eventType,
        reservationId,
        unitId,
        version,
        occurredAt,
      ]);

      if (eventRes.rowCount === 0) {
        // Event already processed in Postgres
        await client.query("COMMIT");
        await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
        return;
      }

      // Upsert into reservations table with version check
      if (eventType === "HOLD_CREATED") {
        const holdQuery = `
          INSERT INTO reservations (reservation_id, unit_id, event_id, status, version, hold_expires_at, created_at, updated_at)
          VALUES ($1, $2, 'evt-main', 'HELD', $3, to_timestamp($4), $5, $5)
          ON CONFLICT (reservation_id) DO UPDATE
          SET status = 'HELD',
              version = EXCLUDED.version,
              updated_at = EXCLUDED.updated_at
          WHERE reservations.version <= EXCLUDED.version;
        `;
        await client.query(holdQuery, [
          reservationId,
          unitId,
          version,
          expiresAtSeconds,
          occurredAt,
        ]);
      } else if (eventType === "RESERVATION_CONFIRMED") {
        const confirmQuery = `
          UPDATE reservations
          SET status = 'CONFIRMED',
              version = $1,
              confirmed_at = $2,
              updated_at = $2
          WHERE reservation_id = $3
            AND version <= $1;
        `;
        await client.query(confirmQuery, [version, occurredAt, reservationId]);
      } else if (eventType === "HOLD_EXPIRED" || eventType === "HOLD_RELEASED") {
        const terminalStatus = eventType === "HOLD_EXPIRED" ? "EXPIRED" : "RELEASED";
        const releaseQuery = `
          UPDATE reservations
          SET status = $1,
              version = $2,
              updated_at = $3
          WHERE reservation_id = $4
            AND version <= $2;
        `;
        await client.query(releaseQuery, [terminalStatus, version, occurredAt, reservationId]);
      }

      await client.query("COMMIT");

      // Acknowledge stream message
      await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
   
    } catch (err: unknown) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("PostgreSQL rollback failed:", rollbackErr);
      }

      console.error(`Failed to process Redis event ${msgId}:`, err);
      // Do not acknowledge the message on failure.
      // Redis can redeliver it for retry/recovery.
    } finally {
      client.release();
    }
  };

  // ---------------------------------------------------------------------------
  // XREADGROUP Main Event Loop
  // ---------------------------------------------------------------------------
  const consumeLoop = async () => {
    while (isRunning) {
      try {
        const response = (await redis.xreadgroup(
          "GROUP",
          GROUP_NAME,
          WORKER_ID,
          "COUNT",
          BATCH_SIZE,
          "BLOCK",
          2000,
          "STREAMS",
          STREAM_KEY,
          ">"
        )) as any;

        if (response && response.length > 0) {
          const [_streamName, messages] = response[0];
          for (const [msgId, fieldArray] of messages) {
            const fields: Record<string, string> = {};
            for (let i = 0; i < fieldArray.length; i += 2) {
              fields[fieldArray[i]] = fieldArray[i + 1];
            }
            await processEvent(msgId, fields);
          }
        }
      } catch (err: any) {
        if (!isRunning) break;
        console.error("Worker stream read error:", err.message);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  // ---------------------------------------------------------------------------
  // XAUTOCLAIM Failure Recovery Loop
  // ---------------------------------------------------------------------------
  const recoveryLoop = async () => {
    while (isRunning) {
      try {
        await new Promise((resolve) => setTimeout(resolve, CLAIM_INTERVAL));
        if (!isRunning) break;

        const minIdleTimeMs = 30000; // Claim messages idle > 30s
        const claimRes = (await (redis as any).xautoclaim(
          STREAM_KEY,
          GROUP_NAME,
          WORKER_ID,
          minIdleTimeMs,
          "0-0",
          "COUNT",
          BATCH_SIZE
        )) as any;

        if (claimRes && claimRes[1] && claimRes[1].length > 0) {
          console.log(`♻️ Auto-claimed ${claimRes[1].length} orphaned messages from stalled workers.`);
          for (const [msgId, fieldArray] of claimRes[1]) {
            const fields: Record<string, string> = {};
            for (let i = 0; i < fieldArray.length; i += 2) {
              fields[fieldArray[i]] = fieldArray[i + 1];
            }
            await processEvent(msgId, fields);
          }
        }
      } catch (err: any) {
        if (!isRunning) break;
        console.warn("Worker recovery loop warning:", err.message);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // TTL Expiry Sweep Loop (Local Timeout Fallback)
  // ---------------------------------------------------------------------------
  const expirySweepLoop = async () => {
    while (isRunning) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Every 10s
        if (!isRunning) break;

        const now = Math.floor(Date.now() / 1000);
        const keys = await redis.keys("ticketwala:unit:*");

        for (const key of keys) {
          const unit = await redis.hgetall(key);
          if (unit.status === "HELD" && unit.expires_at) {
            const expiresAt = parseInt(unit.expires_at, 10);
            if (now >= expiresAt && unit.reservation_id) {
              console.log(`⏰ Reaping expired reservation [${unit.reservation_id}] for unit [${key}]`);
              await releaseHold(redis, {
                eventId: "evt-main",
                reservationId: unit.reservation_id,
                isTimeoutJob: true,
              });
            }
          }
        }
      } catch (err: any) {
        if (!isRunning) break;
        console.warn("Expiry sweep warning:", err.message);
      }
    }
  };

  // Start concurrent loops
  Promise.all([consumeLoop(), recoveryLoop(), expirySweepLoop()]).catch((err) => {
    console.error("Fatal worker loop error:", err);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log(`\n🛑 Shutting down TicketWala Worker [${WORKER_ID}]...`);
    isRunning = false;
    await redis.quit();
    await pgPool.end();
    console.log("👋 Worker shutdown complete.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

runWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
