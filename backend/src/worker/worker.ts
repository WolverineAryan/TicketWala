import Redis from "ioredis";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { releaseHold } from "../lua/index.js";
import { persistReservationEvent, type WorkerCounters } from "./persistence.js";

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
const DEAD_LETTER_STREAM_KEY = "ticketwala:events:dead-letter";
const GROUP_NAME = "ticketwala_workers";
const WORKER_ID = `worker-${process.pid}-${Math.random().toString(36).substring(7)}`;
const BATCH_SIZE = parseInt(process.env.WORKER_BATCH_SIZE || "50", 10);
const CLAIM_INTERVAL = parseInt(process.env.WORKER_CLAIM_INTERVAL_MS || "5000", 10);
const MAX_PROCESSING_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || "5", 10);
const WORKER_HEARTBEATS_KEY = "ticketwala:workers:heartbeat";
const workerStatusKey = `ticketwala:worker:${WORKER_ID}`;

let isRunning = true;
const workerCounters: WorkerCounters = {
  processed: 0,
  retried: 0,
  deadLettered: 0,
  databaseAttempts: 0,
  databaseTimeMs: 0,
  lastDatabaseDurationMs: 0,
  lastDatabaseAt: 0,
};

if (!Number.isInteger(MAX_PROCESSING_ATTEMPTS) || MAX_PROCESSING_ATTEMPTS < 1) {
  throw new Error("WORKER_MAX_ATTEMPTS must be a positive integer.");
}

async function publishWorkerHeartbeat(redis: Redis) {
  const now = Date.now();
  await redis.zremrangebyscore(WORKER_HEARTBEATS_KEY, "-inf", now - 60000);
  await redis.zadd(WORKER_HEARTBEATS_KEY, now, WORKER_ID);
  await redis.hset(workerStatusKey, {
    status: isRunning ? "running" : "stopping",
    last_seen: String(now),
    processed: String(workerCounters.processed),
    retried: String(workerCounters.retried),
    dead_lettered: String(workerCounters.deadLettered),
    database_attempts: String(workerCounters.databaseAttempts),
    database_time_ms: String(workerCounters.databaseTimeMs),
    last_database_duration_ms: String(workerCounters.lastDatabaseDurationMs),
    last_database_at: String(workerCounters.lastDatabaseAt),
  });
  await redis.expire(workerStatusKey, 60);
}

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
      throw err;
    }
  }

  const processEvent = (msgId: string, fields: Record<string, string>) =>
    persistReservationEvent(redis, pgPool, msgId, fields, workerCounters, {
      streamKey: STREAM_KEY,
      groupName: GROUP_NAME,
      deadLetterStreamKey: DEAD_LETTER_STREAM_KEY,
      maxProcessingAttempts: MAX_PROCESSING_ATTEMPTS,
    });

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
        const keys: string[] = [];
        let cursor = "0";
        do {
          const [nextCursor, batch] = await redis.scan(cursor, "MATCH", "ticketwala:event:*:unit:*", "COUNT", 200);
          cursor = nextCursor;
          keys.push(...batch);
        } while (cursor !== "0");

        for (const key of keys) {
          const unit = await redis.hgetall(key);
          if (unit.status === "HELD" && unit.expires_at) {
            const expiresAt = parseInt(unit.expires_at, 10);
            if (now >= expiresAt && unit.reservation_id) {
              console.log(`⏰ Reaping expired reservation [${unit.reservation_id}] for unit [${key}]`);
              await releaseHold(redis, {
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
  await publishWorkerHeartbeat(redis);
  const heartbeatInterval = setInterval(() => {
    publishWorkerHeartbeat(redis).catch((err) => {
      console.error("Worker heartbeat publish failed:", err);
    });
  }, 10000);
  Promise.all([consumeLoop(), recoveryLoop(), expirySweepLoop()]).catch((err) => {
    console.error("Fatal worker loop error:", err);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log(`\n🛑 Shutting down TicketWala Worker [${WORKER_ID}]...`);
    isRunning = false;
    clearInterval(heartbeatInterval);
    await redis.zrem(WORKER_HEARTBEATS_KEY, WORKER_ID);
    await redis.del(workerStatusKey);
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
