# TicketWala Backend

High-Contention Flash-Reservation & Seat Inventory Locking Engine built with **Fastify**, **Redis (Lua Scripts)**, and **Supabase (PostgreSQL)**.

## Architecture Highlights

1. **Transactional Inventory Broker**: Redis Lua scripts ensure atomic FCFS seat allocation, zero double-bookings, and sub-second execution without pessimistic relational database locks.
2. **Adaptive Ingress Balancing**: Token bucket admissions scale dynamically according to remaining seat scarcity. When $S_{\text{available}} = 0$, requests short-circuit in $<2\text{ms}$ with `409 SOLD_OUT`.
3. **Decoupled Asynchronous Persistence**: In-memory state changes are streamed via event-scoped Redis Streams and durably persisted to PostgreSQL by background consumers with `XAUTOCLAIM` recovery.
4. **Server-Side Expiry & Instant Release**: 120s TTL locks automatically expire; user cancellations immediately return inventory to the head of the FIFO queue (`LPUSH`).
5. **Deterministic Idempotency**: Cryptographic SHA-256 tokens and event-scoped client idempotency keys prevent duplicate claims across network retries. Raw hold tokens are returned only once; a replay returns the original logical result without a token.

## Directory Structure

- `src/api/server.ts`: Fastify REST API gateway.
- `src/worker/worker.ts`: Redis Streams to Supabase PostgreSQL sync worker.
- `src/lua/`: Core atomic Lua scripts (`initialize_inventory`, `adaptive_balance`, `hold_fcfs`, `confirm`, `release_fcfs`).
- `src/contracts/`: Zod validation schemas and TypeScript DTOs.
- `db/migrations/`: PostgreSQL schema migrations with unique partial index invariants.
- `scripts/`: Operational tools (`migrate.ts`, `seed.ts`, `audit.ts`).
- `tests/concurrency/`: High-concurrency race condition test suite.
- `tests/load/`: k6 load testing scripts (5,000+ burst simulation).

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env and configure REDIS_URL and DATABASE_URL

# 3. Apply database migrations
npm run db:migrate

# 4. Initialize exactly 200 event units (safe to rerun)
npm run db:seed

# 5. Start API Gateway
npm run dev:api

# 6. Start Persistence Worker
npm run dev:worker
```

## Running Tests

```bash
# Run unit & concurrency tests
npm run test

# Run Invariant Auditor (verifies single ownership & capacity conservation)
npm run ops:audit

# Run 5,000+ request burst benchmark
npm run bench:burst
```

## Redis key and event contract

All event data uses the event hash-tagged namespace below so every multi-key Lua
operation stays in one Redis Cluster slot:

```text
ticketwala:event:{<eventId>}:available_queue
ticketwala:event:{<eventId>}:available_units
ticketwala:event:{<eventId>}:unit:<unitId>
ticketwala:event:{<eventId>}:reservation:<reservationId>
ticketwala:event:{<eventId>}:idempotency:<scope>
ticketwala:event:{<eventId>}:events
```

`initializeInventory` creates `unit-001` through `unit-200`, rebuilding only the
available queue. It never resets a `HELD` or `CONFIRMED` unit. Hold, confirm,
release, and expiry state changes append `event_type`, `event_id_ref`,
`reservation_id`, `unit_id`, `version`, `occurred_at`, and JSON `payload` fields
to the event's `events` stream in the same Lua transaction. Run one worker per
event (or configure a stream multiplexer) when processing multiple events.

Expiry jobs must pass the reservation's expected version. A stale job is a
successful no-op and cannot release a newer owner. The worker persists
`event_id_ref` and `payload` to PostgreSQL before acknowledging the stream entry.

The concurrency suite requires an isolated Redis instance. The API and worker
also require PostgreSQL for readiness and persistence checks. The k6 scripts
are benchmarks only; the 5,000+ request target is not considered achieved
unless a real run is performed and its results are saved separately.
