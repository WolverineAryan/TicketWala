# TicketWala Backend

High-Contention Flash-Reservation & Seat Inventory Locking Engine built with **Fastify**, **Redis (Lua Scripts)**, and **Supabase (PostgreSQL)**.

## Architecture Highlights

1. **Transactional Inventory Broker**: Redis Lua scripts ensure atomic FCFS seat allocation, zero double-bookings, and sub-second execution without pessimistic relational database locks.
2. **Adaptive Ingress Balancing**: Token bucket admissions scale dynamically according to remaining seat scarcity. When $S_{\text{available}} = 0$, requests short-circuit in $<2\text{ms}$ with `409 SOLD_OUT`.
3. **Decoupled Asynchronous Persistence**: In-memory state changes are streamed via Redis Streams (`ticketwala:events`) and durably persisted to PostgreSQL by background consumers with `XAUTOCLAIM` recovery.
4. **Server-Side Expiry & Instant Release**: 120s TTL locks automatically expire; user cancellations immediately return inventory to the head of the FIFO queue (`LPUSH`).
5. **Deterministic Idempotency**: Cryptographic SHA-256 tokens and client idempotency keys prevent duplicate charges or double claims across network retries.

## Directory Structure

- `src/api/server.ts`: Fastify REST API gateway.
- `src/worker/worker.ts`: Redis Streams to Supabase PostgreSQL sync worker.
- `src/lua/`: Core atomic Lua scripts (`adaptive_balance`, `hold_fcfs`, `confirm`, `release_fcfs`).
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

# 4. Seed event inventory (e.g., 200 units)
npm run db:seed 200

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
