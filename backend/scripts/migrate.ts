import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

async function runMigrations() {
  console.log("🔌 Connecting to database for migrations...");
  const pool = new Pool({ connectionString });

  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully.");

    const migrationsDir = path.join(__dirname, "../db/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      console.log(`🚀 Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await client.query(sql);
      console.log(`✅ Applied migration: ${file}`);
    }

    client.release();
    console.log("🎉 All database migrations applied successfully.");

  } catch (err: unknown) {
    console.error("❌ Migration error:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err: unknown) => {
  console.error("❌ Migration process failed:", err);
  process.exitCode = 1;
});
