import type Redis from "ioredis";
import type { Pool } from "pg";

export interface DependencyReadiness {
  ready: boolean;
  redis: "healthy" | "unavailable";
  postgres: "healthy" | "unavailable";
  errors: { dependency: "redis" | "postgres"; message: string }[];
}

export async function checkDependencyReadiness(
  redis: Redis,
  pgPool: Pool
): Promise<DependencyReadiness> {
  const [redisResult, postgresResult] = await Promise.allSettled([
    redis.ping(),
    pgPool.query("SELECT 1"),
  ]);
  const errors: DependencyReadiness["errors"] = [];

  if (redisResult.status === "rejected") {
    errors.push({ dependency: "redis", message: String(redisResult.reason) });
  }
  if (postgresResult.status === "rejected") {
    errors.push({ dependency: "postgres", message: String(postgresResult.reason) });
  }

  return {
    ready: redisResult.status === "fulfilled" && postgresResult.status === "fulfilled",
    redis: redisResult.status === "fulfilled" ? "healthy" : "unavailable",
    postgres: postgresResult.status === "fulfilled" ? "healthy" : "unavailable",
    errors,
  };
}
