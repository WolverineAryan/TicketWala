import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const eventId = process.env.EVENT_ID || "evt-main";
const capacityArg = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
const capacity = capacityArg || parseInt(process.env.DEFAULT_EVENT_CAPACITY || "200", 10);

async function seedInventory() {
  console.log(`🌱 Seeding TicketWala inventory for event [${eventId}] with ${capacity} units...`);
  const redis = new Redis(redisUrl);

  try {
    const queueKey = `ticketwala:event:${eventId}:available_queue`;
    const bucketKey = `ticketwala:event:${eventId}:token_bucket`;

    // 1. Reset FIFO Queue
    await redis.del(queueKey);

    const unitIds: string[] = [];
    const padLen = capacity >= 1000 ? 4 : 3;

    for (let i = 1; i <= capacity; i++) {
      const unitId = `unit-${String(i).padStart(padLen, "0")}`;
      unitIds.push(unitId);
    }

    // Push units into FIFO List (LPUSH so RPOP pops unit-001 first)
    const reversed = [...unitIds].reverse();
    const batchSize = 100;
    for (let i = 0; i < reversed.length; i += batchSize) {
      const chunk = reversed.slice(i, i + batchSize);
      await redis.lpush(queueKey, ...chunk);
    }

    // 2. Initialize Unit Hashes
    for (const unitId of unitIds) {
      const unitKey = `ticketwala:unit:${unitId}`;
      await redis.hmset(unitKey, {
        status: "AVAILABLE",
        version: "1",
      });
      await redis.hdel(unitKey, "reservation_id", "token_hash", "expires_at");
    }

    // 3. Initialize Adaptive Token Bucket
    await redis.hmset(bucketKey, {
      tokens: String(capacity),
      last_updated: String(Date.now()),
    });

    const queueLength = await redis.llen(queueKey);
    console.log(`✅ Successfully seeded ${queueLength} units into FIFO queue [${queueKey}].`);
    console.log(`✅ Initialized adaptive token bucket [${bucketKey}] with ${capacity} tokens.`);
  } catch (err: any) {
    console.error("❌ Inventory seeding failed:", err.message);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

seedInventory();
