import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Redis from "ioredis";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import dotenv from "dotenv";

import {
  HoldRequestSchema,
  ConfirmRequestSchema,
  ReleaseRequestSchema,
  type HoldRequest,
  type ConfirmRequest,
  type ReleaseRequest,
} from "../contracts/index.js";
import {
  loadScripts,
  checkAdaptiveAdmission,
  claimHoldFcfs,
  confirmHold,
  releaseHold,
  generateHoldToken,
} from "../lua/index.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "8000", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_DIRECT_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const HOLD_TTL = parseInt(process.env.RESERVATION_TTL_SECONDS || "120", 10);
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["*"];

// Operational Telemetry Counters
const telemetry = {
  totalRequests: 0,
  holdsCreated: 0,
  holdsConfirmed: 0,
  holdsReleased: 0,
  holdsExpired: 0,
  soldOutCount: 0,
  rateLimitedCount: 0,
};

export async function createServer(): Promise<{
  app: FastifyInstance;
  redis: Redis;
  pgPool: Pool;
}> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
    },
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  });

  // Redis Connection with auto-reconnect
  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });

  // Supabase PostgreSQL Pool (using Supavisor port 6543)
  const pgPool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Load Lua Scripts into Redis SHA cache
  redis.on("ready", async () => {
    try {
      await loadScripts(redis);
      app.log.info("🚀 TicketWala Lua scripts pre-loaded and cached into Redis SHA table.");
    } catch (err: any) {
      app.log.error(`Failed to pre-load Redis Lua scripts: ${err.message}`);
    }
  });

  // ---------------------------------------------------------------------------
  // Health Probes
  // ---------------------------------------------------------------------------
  app.get("/health/live", async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ status: "alive", timestamp: new Date().toISOString() });
  });

  app.get("/health/ready", async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const redisPing = await redis.ping();
      const pgClient = await pgPool.connect();
      await pgClient.query("SELECT 1");
      pgClient.release();

      return reply.status(200).send({
        status: "ready",
        checks: {
          redis: redisPing === "PONG" ? "healthy" : "unhealthy",
          postgres: "healthy",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return reply.status(503).send({
        status: "not_ready",
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Core Reservation Endpoints
  // ---------------------------------------------------------------------------

  /**
   * POST /api/v1/reservations/hold
   * First-Come-First-Served atomic hold with adaptive admission short-circuiting
   */
  app.post("/api/v1/reservations/hold", async (req: FastifyRequest, reply: FastifyReply) => {
    telemetry.totalRequests++;

    const parseResult = HoldRequestSchema.safeParse(req.body || {});
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: parseResult.error.errors.map((e) => e.message).join(", "),
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { eventId } = parseResult.data;
    const idempotencyKey = (req.headers["idempotency-key"] as string) || uuidv4();
    const reqFingerprint = crypto
      .createHash("md5")
      .update(`${eventId}:${JSON.stringify(req.body)}`)
      .digest("hex");

    // 1. Adaptive Admission Controller (Token Bucket scaled by remaining seat scarcity)
    const admission = await checkAdaptiveAdmission(redis, eventId);
    if (admission.admitted === 0) {
      if (admission.reason === "SOLD_OUT") {
        telemetry.soldOutCount++;
        return reply.status(409).send({
          error: {
            code: "SOLD_OUT",
            message: "All seats for this event are currently claimed or locked.",
            retryable: true,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        telemetry.rateLimitedCount++;
        return reply.status(429).send({
          error: {
            code: "RATE_LIMITED",
            message: "System under peak load. Please retry in a few seconds.",
            retryable: true,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // 2. Strict FCFS Atomic Reservation Claim via Redis Lua Script
    const reservationId = uuidv4();
    const rawHoldToken = generateHoldToken();

    const claimResult = await claimHoldFcfs(redis, {
      eventId,
      idempotencyScopeKey: idempotencyKey,
      requestFingerprint: reqFingerprint,
      reservationId,
      rawHoldToken,
      ttlSeconds: HOLD_TTL,
    });

    if (claimResult.error) {
      if (claimResult.code === 409) telemetry.soldOutCount++;
      return reply.status(claimResult.code || 400).send({
        error: {
          code: claimResult.error,
          message: claimResult.message,
          retryable: claimResult.code === 409,
          timestamp: new Date().toISOString(),
        },
      });
    }

    telemetry.holdsCreated++;

    return reply.status(201).send({
      reservationId: claimResult.reservationId,
      unitId: claimResult.unitId,
      status: claimResult.status,
      expiresAt: claimResult.expiresAt,
      holdToken: rawHoldToken,
      version: claimResult.version,
      eventId,
    });
  });

  /**
   * POST /api/v1/reservations/:id/confirm
   * Transitions HELD seat to CONFIRMED using holdToken and monotonic version fence
   */
  app.post("/api/v1/reservations/:id/confirm", async (req: FastifyRequest, reply: FastifyReply) => {
    telemetry.totalRequests++;

    const { id: reservationId } = req.params as { id: string };
    const parseResult = ConfirmRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: parseResult.error.errors.map((e) => e.message).join(", "),
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { holdToken } = parseResult.data;
    const idempotencyKey = (req.headers["idempotency-key"] as string) || "";

    const confirmResult = await confirmHold(redis, {
      reservationId,
      rawHoldToken: holdToken,
      idempotencyKey,
    });

    if (confirmResult.error) {
      return reply.status(confirmResult.code || 400).send({
        error: {
          code: confirmResult.error,
          message: confirmResult.message,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    telemetry.holdsConfirmed++;

    return reply.status(200).send({
      reservationId: confirmResult.reservationId,
      unitId: confirmResult.unitId,
      status: confirmResult.status,
      version: confirmResult.version,
      confirmedAt: confirmResult.confirmedAt,
    });
  });

  /**
   * POST /api/v1/reservations/:id/release
   * Instant user abandonment release - returns unit to the head of FIFO queue
   */
  app.post("/api/v1/reservations/:id/release", async (req: FastifyRequest, reply: FastifyReply) => {
    telemetry.totalRequests++;

    const { id: reservationId } = req.params as { id: string };
    const parseResult = ReleaseRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: "INVALID_REQUEST",
          message: parseResult.error.errors.map((e) => e.message).join(", "),
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { holdToken } = parseResult.data;
    const eventId = "evt-main";

    const releaseResult = await releaseHold(redis, {
      eventId,
      reservationId,
      rawHoldToken: holdToken,
      isTimeoutJob: false,
    });

    if (releaseResult.error) {
      return reply.status(releaseResult.code || 400).send({
        error: {
          code: releaseResult.error,
          message: releaseResult.message,
          retryable: false,
          timestamp: new Date().toISOString(),
        },
      });
    }

    telemetry.holdsReleased++;

    return reply.status(200).send({
      reservationId: releaseResult.reservationId,
      unitId: releaseResult.unitId,
      status: releaseResult.status,
      version: releaseResult.version,
    });
  });

  // ---------------------------------------------------------------------------
  // Operations & Observatory Endpoints
  // ---------------------------------------------------------------------------

  /**
   * GET /api/v1/ops/metrics
   * Real-time metrics on queue size, holds, confirms, and streams
   */
  app.get("/api/v1/ops/metrics", async (_req: FastifyRequest, reply: FastifyReply) => {
    const eventId = "evt-main";
    const queueKey = `ticketwala:event:${eventId}:available_queue`;

    const availableCount = await redis.llen(queueKey);
    const streamInfo = await redis.xinfo("STREAM", "ticketwala:events").catch(() => null);

    return reply.status(200).send({
      inventory: {
        total: 200,
        available: availableCount,
        held: telemetry.holdsCreated - telemetry.holdsConfirmed - telemetry.holdsReleased,
        confirmed: telemetry.holdsConfirmed,
      },
      telemetry: {
        ...telemetry,
      },
      stream: {
        length: streamInfo ? (streamInfo as any)[1] : 0,
        lastDeliveredId: streamInfo ? (streamInfo as any)[7] : "0-0",
      },
      serverTime: new Date().toISOString(),
    });
  });

  /**
   * GET /api/v1/ops/inventory
   * Fetches current state of inventory units for visual grid inspection
   */
  app.get("/api/v1/ops/inventory", async (_req: FastifyRequest, reply: FastifyReply) => {
    const keys = await redis.keys("ticketwala:unit:*");
    const units = [];

    for (const key of keys) {
      const data = await redis.hgetall(key);
      const unitId = key.replace("ticketwala:unit:", "");
      units.push({
        unitId,
        status: data.status || "AVAILABLE",
        reservationId: data.reservation_id,
        expiresAt: data.expires_at ? parseInt(data.expires_at, 10) : undefined,
        version: parseInt(data.version || "1", 10),
      });
    }

    units.sort((a, b) => a.unitId.localeCompare(b.unitId));

    return reply.status(200).send({
      totalUnits: units.length,
      units,
    });
  });

  /**
   * POST /api/v1/ops/audit
   * Runs an independent Invariant Audit verifying Single Ownership and Capacity Conservation
   */
  app.post("/api/v1/ops/audit", async (_req: FastifyRequest, reply: FastifyReply) => {
    const eventId = "evt-main";
    const queueKey = `ticketwala:event:${eventId}:available_queue`;

    const availableCount = await redis.llen(queueKey);
    const unitKeys = await redis.keys("ticketwala:unit:*");

    const anomalies: string[] = [];
    const heldReservations = new Set<string>();
    let heldCount = 0;
    let confirmedCount = 0;
    let availableInHashes = 0;

    for (const key of unitKeys) {
      const unit = await redis.hgetall(key);
      const unitId = key.replace("ticketwala:unit:", "");

      if (unit.status === "HELD") {
        heldCount++;
        if (unit.reservation_id) {
          if (heldReservations.has(unit.reservation_id)) {
            anomalies.push(`Double booking violation: Reservation ${unit.reservation_id} is linked to multiple units!`);
          }
          heldReservations.add(unit.reservation_id);
        }
      } else if (unit.status === "CONFIRMED") {
        confirmedCount++;
      } else if (unit.status === "AVAILABLE") {
        availableInHashes++;
      }
    }

    const totalCalculated = availableCount + heldCount + confirmedCount;
    const totalConfigured = unitKeys.length;

    const singleOwnershipPassed = anomalies.length === 0;
    const capacityConservationPassed = totalCalculated === totalConfigured;

    if (!capacityConservationPassed) {
      anomalies.push(`Capacity Conservation Violation: configured=${totalConfigured}, calculated sum=${totalCalculated}`);
    }

    const passed = singleOwnershipPassed && capacityConservationPassed;

    return reply.status(200).send({
      passed,
      timestamp: new Date().toISOString(),
      summary: {
        totalConfiguredCapacity: totalConfigured,
        activeHolds: heldCount,
        confirmedBookings: confirmedCount,
        availableQueueLength: availableCount,
        violationsCount: anomalies.length,
      },
      checks: {
        singleOwnership: {
          passed: singleOwnershipPassed,
          details: singleOwnershipPassed ? "Verified: Each unit has at most one active holder." : "Violations detected",
        },
        capacityConservation: {
          passed: capacityConservationPassed,
          details: `Sum: ${availableCount} (queue) + ${heldCount} (held) + ${confirmedCount} (confirmed) = ${totalCalculated} / ${totalConfigured}`,
        },
      },
      anomalies,
    });
  });

  return { app, redis, pgPool };
}

// Start server directly if this file is executed
if (process.argv[1] && process.argv[1].includes("server")) {
  createServer()
    .then(({ app }) => {
      app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
        if (err) {
          console.error("❌ Failed to start TicketWala API:", err);
          process.exit(1);
        }
        console.log(`\n======================================================`);
        console.log(`🚀 TicketWala High-Contention API running at: ${address}`);
        console.log(`📡 Health Check:  GET ${address}/health/live`);
        console.log(`⚡ Flash Hold:    POST ${address}/api/v1/reservations/hold`);
        console.log(`💳 Confirm Hold:  POST ${address}/api/v1/reservations/:id/confirm`);
        console.log(`❌ Release Hold:  POST ${address}/api/v1/reservations/:id/release`);
        console.log(`📊 Observatory:   GET ${address}/api/v1/ops/metrics`);
        console.log(`======================================================\n`);
      });
    })
    .catch((err) => {
      console.error("Fatal startup error:", err);
      process.exit(1);
    });
}
