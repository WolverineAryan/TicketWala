import { describe, expect, it, vi } from "vitest";
import type Redis from "ioredis";
import type { Pool } from "pg";
import { checkDependencyReadiness } from "../../src/api/readiness.js";

function dependencies(redisPing: Promise<string>, postgresQuery: Promise<unknown>) {
  const redis = { ping: vi.fn(() => redisPing) } as unknown as Redis;
  const pgPool = { query: vi.fn(() => postgresQuery) } as unknown as Pool;
  return { redis, pgPool };
}

describe("dependency readiness checks", () => {
  it("reports ready only when Redis and PostgreSQL both respond", async () => {
    const services = dependencies(Promise.resolve("PONG"), Promise.resolve({ rows: [{ "?column?": 1 }] }));

    await expect(checkDependencyReadiness(services.redis, services.pgPool)).resolves.toEqual({
      ready: true,
      redis: "healthy",
      postgres: "healthy",
      errors: [],
    });
    expect(services.redis.ping).toHaveBeenCalledOnce();
    expect(services.pgPool.query).toHaveBeenCalledWith("SELECT 1");
  });

  it("reports unavailable dependencies without failing the health handler", async () => {
    const services = dependencies(
      Promise.reject(new Error("connection refused")),
      Promise.reject(new Error("database unavailable"))
    );

    await expect(checkDependencyReadiness(services.redis, services.pgPool)).resolves.toEqual({
      ready: false,
      redis: "unavailable",
      postgres: "unavailable",
      errors: [
        { dependency: "redis", message: "Error: connection refused" },
        { dependency: "postgres", message: "Error: database unavailable" },
      ],
    });
  });
});
