import Redis from "ioredis";
import dotenv from "dotenv";
import { initializeInventory, INVENTORY_CAPACITY } from "../src/lua/index.js";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const eventId = process.env.EVENT_ID || "evt-main";

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
    const configuredEvents = process.env.EVENT_ID
      ? [{ id: eventId, capacity: INVENTORY_CAPACITY }]
      : SEED_EVENTS;
    for (const evt of configuredEvents) {
      const result = await initializeInventory(redis, evt.id, evt.capacity);
      console.log(`✅ Inventory initialization result for ${evt.id}: ${JSON.stringify(result)}`);
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
