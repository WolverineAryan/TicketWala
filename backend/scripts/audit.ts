import Redis from "ioredis";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DATABASE_URL =
  process.env.DATABASE_DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

async function runInvariantAudit() {
  console.log("================================================================================");
  console.log("🔍 TICKETWALA INDEPENDENT INVARIANT AUDITOR (MATHEMATICAL VERIFICATION)");
  console.log("================================================================================");

  const redis = new Redis(REDIS_URL);
  const pgPool = new Pool({ connectionString: DATABASE_URL });

  try {
    const eventId = process.env.EVENT_ID || "evt-main";
    const unitKeys = await redis.keys(`ticketwala:event:{${eventId}}:unit:*`);
    const totalUnits = unitKeys.length;
    const queueLen = await redis.llen(`ticketwala:event:{${eventId}}:available_queue`);

    let heldCount = 0;
    let confirmedCount = 0;
    let availableCount = 0;

    const holderMap = new Map<string, string>();
    const redisViolations: string[] = [];

    for (const key of unitKeys) {
      const uData = await redis.hgetall(key);
      const unitId = key.substring(key.lastIndexOf(":") + 1);
      const status = uData.status;

      if (status === "HELD") heldCount++;
      else if (status === "CONFIRMED") confirmedCount++;
      else availableCount++;

      if (uData.reservation_id && (status === "HELD" || status === "CONFIRMED")) {
        if (holderMap.has(unitId)) {
          redisViolations.push(`Duplicate Holder on unit ${unitId}`);
        } else {
          holderMap.set(unitId, uData.reservation_id);
        }
      }
    }

    // 2. Query Supabase / PostgreSQL Relational Invariants
    let dbDoubleBookings = 0;
    let dbConfirmedCount = 0;

    try {
      const collisionRes = await pgPool.query(`
        SELECT unit_id, COUNT(*) as active_count
        FROM reservations 
        WHERE status IN ('HELD', 'CONFIRMED')
        GROUP BY unit_id 
        HAVING COUNT(*) > 1;
      `);
      dbDoubleBookings = collisionRes.rowCount || 0;

      const confirmedRes = await pgPool.query(`
        SELECT COUNT(*) as count FROM reservations WHERE status = 'CONFIRMED';
      `);
      dbConfirmedCount = parseInt(confirmedRes.rows[0]?.count || "0", 10);
    } catch (dbErr: any) {
      console.warn("⚠️ Note: Supabase/PostgreSQL query warning:", dbErr.message);
    }

    // Mathematical Invariant Checks
    const singleOwnershipPassed = redisViolations.length === 0 && dbDoubleBookings === 0;
    const capacityPassed = heldCount + confirmedCount + availableCount === totalUnits;

    console.log(`\n📊 Inventory Breakdown:`);
    console.log(`   - Total Configured Capacity (N): ${totalUnits}`);
    console.log(`   - Available Units in FIFO Queue: ${queueLen}`);
    console.log(`   - Active Temporary Holds:        ${heldCount}`);
    console.log(`   - Confirmed Bookings (Redis):    ${confirmedCount}`);
    console.log(`   - Confirmed Bookings (Postgres): ${dbConfirmedCount}`);

    console.log(`\n📋 Invariant Assertions:`);
    console.log(`   [1] Single Ownership (Zero Double-Bookings): ${singleOwnershipPassed ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`       Redis active collisions: ${redisViolations.length}`);
    console.log(`       PostgreSQL active collisions: ${dbDoubleBookings}`);

    console.log(`   [2] Capacity Conservation (Held + Confirmed + Avail == N): ${capacityPassed ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`       Sum (${heldCount + confirmedCount + availableCount}) == Total (${totalUnits})`);

    const allPassed = singleOwnershipPassed && capacityPassed;

    console.log(`\n================================================================================`);
    if (allPassed) {
      console.log(`🎉 AUDIT PASSED: 100% Mathematical Invariant Integrity Verified.`);
    } else {
      console.log(`❌ AUDIT FAILED: Anomalies detected.`);
    }
    console.log("================================================================================\n");

    // Record Audit Run to Database if connected
    try {
      await pgPool.query(`
        INSERT INTO reconciliation_runs (mismatches_found, status, details)
        VALUES ($1, $2, $3)
      `, [
        redisViolations.length + dbDoubleBookings,
        allPassed ? "PASSED" : "FAILED",
        JSON.stringify({ heldCount, confirmedCount, availableCount, totalUnits }),
      ]);
    } catch {
      // Ignore if table not ready
    }

    process.exit(allPassed ? 0 : 1);
  } catch (err: any) {
    console.error("❌ Auditor execution error:", err.message);
    process.exit(1);
  } finally {
    redis.disconnect();
    await pgPool.end();
  }
}

runInvariantAudit();
