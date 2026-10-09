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
  type EventDetails,
  type EventCategory,
  type InventoryUnitState,
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

// -----------------------------------------------------------------------------
// Multipurpose Event Catalog Database
// -----------------------------------------------------------------------------
export const MULTIPURPOSE_EVENTS: EventDetails[] = [
  {
    id: "evt-flight-ai101",
    title: "Air India AI-101: Mumbai (BOM) → London Heathrow (LHR)",
    category: "FLIGHT",
    categoryLabel: "Commercial Flight",
    venue: "Boeing 787-9 Dreamliner • CSMIA Terminal 2",
    location: "Mumbai → London",
    dateTime: "Tomorrow • 02:15 AM Departure (9h 45m Non-stop)",
    totalSeats: 192,
    availableSeats: 148,
    basePrice: 48500,
    currency: "INR",
    badge: "FAST FILLING",
    description: "Flagship long-haul direct service with luxury lie-flat beds, gourmet multi-cuisine dining, and 4K in-flight entertainment.",
    tiers: [
      { id: "FIRST", name: "First Class Suite", price: 120000, color: "#F59E0B", description: "Private enclosed suite, caviar service & champagne" },
      { id: "BUSINESS", name: "Business Class Flatbed", price: 75000, color: "#6366F1", description: "180° lie-flat bed, lounge access & priority lane" },
      { id: "ECONOMY", name: "Economy Comfort", price: 48500, color: "#10B981", description: "Ergonomic 32-inch pitch, personal 4K display & meals" },
    ],
  },
  {
    id: "evt-concert-coldplay",
    title: "Coldplay: Music of the Spheres World Tour 2026",
    category: "CONCERT",
    categoryLabel: "Stadium Concert",
    venue: "DY Patil Sports Stadium, Navi Mumbai",
    location: "Navi Mumbai, India",
    dateTime: "Saturday, 18 Jan 2026 • 07:00 PM IST",
    totalSeats: 200,
    availableSeats: 34,
    basePrice: 4500,
    currency: "INR",
    badge: "EXTREME CONTENTION",
    description: "The worldwide record-breaking stadium spectacle featuring kinetic dance floors, solar-powered lasers, and illuminated xylobands.",
    tiers: [
      { id: "LOUNGE", name: "Infinity Lounge VIP", price: 25000, color: "#F59E0B", description: "Air-conditioned luxury lounge, artist gift pack & open bar" },
      { id: "STANDING", name: "Floor Standing Pit", price: 12500, color: "#EC4899", description: "Direct mainstage proximity, priority early gate admission" },
      { id: "LEVEL1", name: "Level 1 Premium Seated", price: 6500, color: "#6366F1", description: "Elevated mid-tier clear line-of-sight reserved seats" },
      { id: "GENERAL", name: "General Grandstand", price: 4500, color: "#10B981", description: "Upper bowl full stadium panoramic sound & visual view" },
    ],
  },
  {
    id: "evt-sports-iplfinal",
    title: "IPL Grand Final 2026: Mumbai Indians vs Chennai Super Kings",
    category: "SPORTS",
    categoryLabel: "Cricket Championship",
    venue: "Wankhede Stadium, Churchgate, Mumbai",
    location: "Mumbai, India",
    dateTime: "Sunday, 24 May 2026 • 07:30 PM IST",
    totalSeats: 180,
    availableSeats: 28,
    basePrice: 3200,
    currency: "INR",
    badge: "CHAMPIONSHIP",
    description: "The greatest rivalry in cricket history competing for the championship trophy under full stadium floodlights.",
    tiers: [
      { id: "BOX", name: "Corporate Hospitality Box", price: 35000, color: "#F59E0B", description: "VIP glass enclosure, gourmet buffet & legend meet-and-greet" },
      { id: "SACHIN", name: "Sachin Tendulkar Stand", price: 8500, color: "#3B82F6", description: "Covered pavilion level, direct straight-drive boundary view" },
      { id: "GARWARE", name: "Garware Club Pavilion", price: 5000, color: "#6366F1", description: "Mid-wicket elevated stand with exclusive dining stalls" },
      { id: "GAVASKAR", name: "Sunil Gavaskar Stand", price: 3200, color: "#10B981", description: "High-energy stadium fan stand behind the bowler's arm" },
    ],
  },
  {
    id: "evt-cinema-imax",
    title: "Interstellar: 10th Anniversary IMAX 70mm Special Experience",
    category: "CINEMA",
    categoryLabel: "IMAX 70mm Cinema",
    venue: "PVR INOX IMAX with Laser • Palladium Mall, Lower Parel",
    location: "Mumbai, India",
    dateTime: "Tonight • 09:45 PM IST • Screen 1",
    totalSeats: 160,
    availableSeats: 52,
    basePrice: 850,
    currency: "INR",
    badge: "EXCLUSIVE",
    description: "Christopher Nolan's cinematic masterpiece in pure 70mm full-aperture IMAX laser format with 12-channel immersive audio.",
    tiers: [
      { id: "RECLINER", name: "Royal Motorized Recliner", price: 1500, color: "#F59E0B", description: "Plush leather motorized full recliner with in-seat service" },
      { id: "PRIME", name: "Prime Executive Center", price: 1050, color: "#6366F1", description: "Optimal acoustic & visual sweet spot in rows E through H" },
      { id: "CLASSIC", name: "Classic Standard", price: 850, color: "#10B981", description: "Standard rocker seating with unobstructed curved screen view" },
    ],
  },
  {
    id: "evt-train-vandebharat",
    title: "Vande Bharat Express (22229): Mumbai CSMT → Goa Madgaon",
    category: "TRANSIT",
    categoryLabel: "High-Speed Rail",
    venue: "Platform 18, Chhatrapati Shivaji Maharaj Terminus (CSMT)",
    location: "Mumbai → Goa",
    dateTime: "Friday • 05:25 AM Departure (7h 50m)",
    totalSeats: 150,
    availableSeats: 64,
    basePrice: 1815,
    currency: "INR",
    badge: "FASTEST TRAIN",
    description: "Semi-high speed aerodynamic express through the scenic Western Ghats with 180-degree revolving executive seating.",
    tiers: [
      { id: "EXECUTIVE", name: "Executive Anubhuti Class (EC)", price: 3355, color: "#F59E0B", description: "180-degree rotating seats, panoramic windows & hot breakfast" },
      { id: "CHAIR", name: "AC Chair Car (CC)", price: 1815, color: "#10B981", description: "Spacious ergonomic seating, onboard Wi-Fi infotainment" },
    ],
  },
];

// In-Memory user confirmed bookings store
const userBookingsRegistry = new Map<string, any[]>();

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
      // Pre-seed event queues if empty
      for (const event of MULTIPURPOSE_EVENTS) {
        const queueKey = `ticketwala:event:${event.id}:available_queue`;
        const exists = await redis.exists(queueKey);
        if (!exists) {
          const unitIds: string[] = [];
          for (let i = 1; i <= event.totalSeats; i++) {
            unitIds.push(`unit-${String(i).padStart(3, "0")}`);
          }
          await redis.lpush(queueKey, ...unitIds);
          for (const u of unitIds) {
            await redis.hmset(`ticketwala:unit:${u}`, { status: "AVAILABLE", version: "1" });
          }
          await redis.hmset(`ticketwala:event:${event.id}:token_bucket`, {
            tokens: String(event.totalSeats),
            last_updated: String(Date.now()),
          });
        }
      }
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
  // Multipurpose Event Catalog Endpoints
  // ---------------------------------------------------------------------------

  /**
   * GET /api/v1/events
   * Returns list of events, optionally filtered by category
   */
  app.get("/api/v1/events", async (req: FastifyRequest, reply: FastifyReply) => {
    const { category } = req.query as { category?: string };

    let events = MULTIPURPOSE_EVENTS;
    if (category && category !== "ALL") {
      events = events.filter((e) => e.category.toUpperCase() === category.toUpperCase());
    }

    // Refresh live available counts from Redis
    const enrichedEvents = await Promise.all(
      events.map(async (e) => {
        const queueKey = `ticketwala:event:${e.id}:available_queue`;
        const count = await redis.llen(queueKey).catch(() => e.availableSeats);
        return {
          ...e,
          availableSeats: count > 0 ? count : e.availableSeats,
        };
      })
    );

    return reply.status(200).send({
      total: enrichedEvents.length,
      events: enrichedEvents,
    });
  });

  /**
   * GET /api/v1/events/:id
   * Returns full event details with tiers and availability
   */
  app.get("/api/v1/events/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const event = MULTIPURPOSE_EVENTS.find((e) => e.id === id);
    if (!event) {
      return reply.status(404).send({ error: { code: "EVENT_NOT_FOUND", message: "Event not found" } });
    }

    const queueKey = `ticketwala:event:${id}:available_queue`;
    const availableCount = await redis.llen(queueKey).catch(() => event.availableSeats);

    return reply.status(200).send({
      ...event,
      availableSeats: availableCount,
    });
  });

  /**
   * GET /api/v1/events/:id/seats
   * Returns seat matrix with tier, prices, and live status
   */
  app.get("/api/v1/events/:id/seats", async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const event = MULTIPURPOSE_EVENTS.find((e) => e.id === id) || MULTIPURPOSE_EVENTS[0];

    const totalSeats = event.totalSeats;
    const seats: InventoryUnitState[] = [];

    for (let i = 1; i <= totalSeats; i++) {
      const unitId = `unit-${String(i).padStart(3, "0")}`;
      const unitData = ((await redis.hgetall(`ticketwala:unit:${unitId}`).catch(() => ({}))) || {}) as Record<string, string>;

      // Determine Tier based on seat index
      let tier = event.tiers[event.tiers.length - 1]; // Default lowest
      if (i <= Math.floor(totalSeats * 0.15)) {
        tier = event.tiers[0]; // Top tier (First / VIP)
      } else if (i <= Math.floor(totalSeats * 0.45) && event.tiers.length > 2) {
        tier = event.tiers[1]; // Mid tier (Business / Standing)
      }

      const row = Math.ceil(i / 6);
      const col = ((i - 1) % 6) + 1;
      const colLetters = ["A", "B", "C", "D", "E", "F"];
      const seatLabel = `${row}${colLetters[col - 1]}`;

      seats.push({
        unitId,
        seatLabel,
        status: (unitData.status as any) || "AVAILABLE",
        reservationId: unitData.reservation_id,
        expiresAt: unitData.expires_at ? parseInt(unitData.expires_at, 10) : undefined,
        version: parseInt(unitData.version || "1", 10),
        tierId: tier.id,
        tierName: tier.name,
        price: tier.price,
        row,
        col,
      });
    }

    return reply.status(200).send({
      eventId: id,
      totalSeats,
      seats,
    });
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

    const { eventId, unitId: requestedUnitId, tierId } = parseResult.data;
    const event = MULTIPURPOSE_EVENTS.find((e) => e.id === eventId) || MULTIPURPOSE_EVENTS[0];

    const idempotencyKey = (req.headers["idempotency-key"] as string) || uuidv4();
    const reqFingerprint = crypto
      .createHash("md5")
      .update(`${eventId}:${requestedUnitId || ""}:${JSON.stringify(req.body)}`)
      .digest("hex");

    // 1. Adaptive Admission Controller (Token Bucket scaled by remaining seat scarcity)
    const admission = await checkAdaptiveAdmission(redis, event.id);
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
      eventId: event.id,
      idempotencyScopeKey: idempotencyKey,
      requestFingerprint: reqFingerprint,
      reservationId,
      rawHoldToken,
      ttlSeconds: HOLD_TTL,
      requestedUnitId,
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

    // Calculate tier and price
    const unitNum = parseInt(claimResult.unitId.replace("unit-", ""), 10) || 1;
    let selectedTier = event.tiers[event.tiers.length - 1];
    if (unitNum <= Math.floor(event.totalSeats * 0.15)) {
      selectedTier = event.tiers[0];
    } else if (unitNum <= Math.floor(event.totalSeats * 0.45) && event.tiers.length > 2) {
      selectedTier = event.tiers[1];
    }

    return reply.status(201).send({
      reservationId: claimResult.reservationId,
      unitId: claimResult.unitId,
      status: claimResult.status,
      expiresAt: claimResult.expiresAt,
      holdToken: rawHoldToken,
      version: claimResult.version,
      eventId: event.id,
      eventTitle: event.title,
      tierName: selectedTier.name,
      price: selectedTier.price,
      currency: event.currency,
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

    const { holdToken, passengerName, email, paymentMethod } = parseResult.data;
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

    // Generate unique verifiable PNR and E-Ticket payload
    const pnrCode = `TW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

    const event = MULTIPURPOSE_EVENTS[0];
    const unitNum = parseInt(confirmResult.unitId.replace("unit-", ""), 10) || 1;
    let selectedTier = event.tiers[event.tiers.length - 1];
    if (unitNum <= Math.floor(event.totalSeats * 0.15)) {
      selectedTier = event.tiers[0];
    } else if (unitNum <= Math.floor(event.totalSeats * 0.45) && event.tiers.length > 2) {
      selectedTier = event.tiers[1];
    }

    const confirmedTicketData = {
      reservationId: confirmResult.reservationId,
      unitId: confirmResult.unitId,
      status: "CONFIRMED",
      version: confirmResult.version,
      confirmedAt: confirmResult.confirmedAt,
      pnr: pnrCode,
      eventId: event.id,
      eventTitle: event.title,
      venue: event.venue,
      dateTime: event.dateTime,
      passengerName: passengerName || "Verified Guest",
      tierName: selectedTier.name,
      amountPaid: selectedTier.price,
      currency: event.currency,
      qrCodePayload: `TICKETWALA:${pnrCode}:${confirmResult.unitId}:${reservationId}`,
      paymentRef,
    };

    // Store in user bookings registry
    const defaultUser = "user-default";
    const existing = userBookingsRegistry.get(defaultUser) || [];
    userBookingsRegistry.set(defaultUser, [confirmedTicketData, ...existing]);

    return reply.status(200).send(confirmedTicketData);
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
    const eventId = "evt-flight-ai101";

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

  /**
   * GET /api/v1/users/:userId/bookings
   * Returns list of confirmed bookings for user
   */
  app.get("/api/v1/users/:userId/bookings", async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    const bookings = userBookingsRegistry.get(userId) || userBookingsRegistry.get("user-default") || [];

    return reply.status(200).send({
      userId,
      count: bookings.length,
      bookings,
    });
  });

  // ---------------------------------------------------------------------------
  // Operations & Observatory Endpoints (For Backend Verification & Ops)
  // ---------------------------------------------------------------------------
  app.get("/api/v1/ops/metrics", async (_req: FastifyRequest, reply: FastifyReply) => {
    const eventId = "evt-flight-ai101";
    const queueKey = `ticketwala:event:${eventId}:available_queue`;

    const availableCount = await redis.llen(queueKey).catch(() => 0);
    const streamInfo = await redis.xinfo("STREAM", "ticketwala:events").catch(() => null);

    return reply.status(200).send({
      inventory: {
        total: 192,
        available: availableCount,
        held: Math.max(0, telemetry.holdsCreated - telemetry.holdsConfirmed - telemetry.holdsReleased),
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

  app.post("/api/v1/ops/audit", async (_req: FastifyRequest, reply: FastifyReply) => {
    const eventId = "evt-flight-ai101";
    const queueKey = `ticketwala:event:${eventId}:available_queue`;

    const availableCount = await redis.llen(queueKey).catch(() => 0);
    const unitKeys = await redis.keys("ticketwala:unit:*");

    const anomalies: string[] = [];
    const heldReservations = new Set<string>();
    let heldCount = 0;
    let confirmedCount = 0;
    let availableInHashes = 0;

    for (const key of unitKeys) {
      const unit = await redis.hgetall(key);
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
    const capacityConservationPassed = totalCalculated === totalConfigured || totalConfigured === 0;

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
        console.log(`🚀 TicketWala Multipurpose Ticketing API running at: ${address}`);
        console.log(`📡 Events Catalog:  GET  ${address}/api/v1/events`);
        console.log(`⚡ Seat Matrix:     GET  ${address}/api/v1/events/:id/seats`);
        console.log(`🔒 Flash Hold:      POST ${address}/api/v1/reservations/hold`);
        console.log(`💳 Confirm & Pay:   POST ${address}/api/v1/reservations/:id/confirm`);
        console.log(`❌ Cancel / Release:POST ${address}/api/v1/reservations/:id/release`);
        console.log(`🎟️ My Bookings:     GET  ${address}/api/v1/users/:userId/bookings`);
        console.log(`======================================================\n`);
      });
    })
    .catch((err) => {
      console.error("Fatal startup error:", err);
      process.exit(1);
    });
}
