import Redis from "ioredis";
import dotenv from "dotenv";
import { initializeInventory, INVENTORY_CAPACITY } from "../src/lua/index.js";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const eventId = process.env.EVENT_ID || "evt-main";
const capacity = INVENTORY_CAPACITY;

async function seedInventory() {
  console.log(`🌱 Seeding TicketWala inventory for event [${eventId}] with ${capacity} units...`);
  const redis = new Redis(redisUrl);

  try {
    const result = await initializeInventory(redis, eventId, capacity);
    console.log(`✅ Inventory initialization result: ${JSON.stringify(result)}`);
  } catch (err: any) {
    console.error("❌ Inventory seeding failed:", err.message);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

seedInventory();
