import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const SEED_EVENTS = [
  { id: "evt-flight-ai101", capacity: 192 },
  { id: "evt-concert-coldplay", capacity: 200 },
  { id: "evt-sports-iplfinal", capacity: 180 },
  { id: "evt-cinema-imax", capacity: 160 },
  { id: "evt-train-vandebharat", capacity: 150 },
];

async function seedAllInventory() {
  console.log(`🌱 Seeding TicketWala Multipurpose Events into Redis...`);
  const redis = new Redis(redisUrl);

  try {
    for (const evt of SEED_EVENTS) {
      const queueKey = `ticketwala:event:${evt.id}:available_queue`;
      const bucketKey = `ticketwala:event:${evt.id}:token_bucket`;

      await redis.del(queueKey);

      const unitIds: string[] = [];
      for (let i = 1; i <= evt.capacity; i++) {
        unitIds.push(`unit-${String(i).padStart(3, "0")}`);
      }

      // LPUSH in reverse order so RPOP pops unit-001 first
      const reversed = [...unitIds].reverse();
      const batchSize = 100;
      for (let i = 0; i < reversed.length; i += batchSize) {
        const chunk = reversed.slice(i, i + batchSize);
        await redis.lpush(queueKey, ...chunk);
      }

      // Initialize unit hashes
      for (const unitId of unitIds) {
        const unitKey = `ticketwala:unit:${unitId}`;
        await redis.hmset(unitKey, {
          status: "AVAILABLE",
          version: "1",
        });
        await redis.hdel(unitKey, "reservation_id", "token_hash", "expires_at");
      }

      // Initialize adaptive token bucket
      await redis.hmset(bucketKey, {
        tokens: String(evt.capacity),
        last_updated: String(Date.now()),
      });

      console.log(`✅ Seeded ${evt.capacity} units for event [${evt.id}].`);
    }
    console.log(`🎉 All multipurpose events successfully initialized in Redis!`);
  } catch (err: any) {
    console.error("❌ Inventory seeding failed:", err.message);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

seedAllInventory();
