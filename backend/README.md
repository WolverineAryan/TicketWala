# TicketWala Backend

High-Contention Flash-Reservation & Seat Inventory Locking Engine built with **Fastify**, **Redis (Lua Scripts)**, and **Supabase (PostgreSQL)**.

## Architecture Highlights

1. **Transactional Inventory Broker**: Redis Lua scripts ensure atomic FCFS seat allocation, zero double-bookings, and sub-second execution without pessimistic relational database locks.
2. **Adaptive Ingress Balancing**: Token bucket admissions scale dynamically according to remaining seat scarcity. When $S_{\text{available}} = 0$, requests short-circuit in $<2\text{ms}$ with `409 SOLD_OUT`.
3. **Decoupled Asynchronous Persistence**: Reservation stream entries carry the catalog event ID and are durably persisted to PostgreSQL. Worker failures are retried a bounded number of times before being moved to `ticketwala:events:dead-letter`; the worker acknowledges only after the database transaction commits.
4. **Server-Side Expiry & Instant Release**: 120s TTL locks automatically expire; user cancellations immediately return inventory to the head of the FIFO queue (`LPUSH`).
5. **Deterministic Idempotency**: Cryptographic SHA-256 tokens and client idempotency keys prevent duplicate charges or double claims across network retries.
6. **Event-Scoped Inventory**: Unit state is keyed by both event ID and unit ID, so identically named seats in different events are independent.

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

The operations endpoint (`/api/v1/ops/metrics`) reports worker heartbeats,
processed/retried/dead-lettered totals, the dead-letter stream length, and the
worker's average and most recent PostgreSQL persistence duration.
`/health/live` checks that the API process is running. `/health/ready` checks
Redis and PostgreSQL with live probes and returns HTTP `503` if either required
dependency is unavailable; embedded in-memory fallback is intentionally not
considered ready for durable booking traffic. Worker retry limits can be
configured with `WORKER_MAX_ATTEMPTS` (default `5`).

### Measuring PostgreSQL before optimizing

Use the Supabase SQL Editor to inspect database size and index usage before
adding or removing indexes. These are read-only queries:

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

SELECT
  schemaname,
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

SELECT
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

If `pg_stat_statements` is enabled for the project, inspect the most expensive
queries with:

```sql
SELECT
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  rows,
  left(query, 300) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

For an individual slow query, use `EXPLAIN (ANALYZE, BUFFERS)` with
representative parameters in a non-production environment. Do not add indexes
based only on intuition: indexes increase storage and add work to every
reservation write. The worker's database durations are end-to-end persistence
time (including pool acquisition and transaction work), not isolated SQL
execution time; use PostgreSQL query statistics or query plans to locate a
specific slow statement.

### Redis inventory key change

Inventory hashes now use `ticketwala:event:<event-id>:unit:<unit-id>` rather
than the previously shared `ticketwala:unit:<unit-id>` keys. The old layout
cannot be migrated automatically because identically named units from
different events shared the same Redis hash. Before switching an existing
deployment, stop booking traffic and perform a deliberate inventory
reconciliation/reseed in that environment; do not point the seed script at
live booking data.

## Manual demo traffic burst

Run this from a terminal before the demo; it does not add a button or load
traffic from visitors' browsers. It sends 5,000 hold requests to the selected
API using up to 250 virtual users, after checking API health and that the event
exists. This is 5,000 requests, not 5,000 simultaneous real users.

Use a dedicated demo deployment and an event reserved for load testing. Each
successful request creates a real temporary hold and consumes demo inventory
until it expires; do not point this test at an event accepting real bookings.
The script intentionally requires the target and event to be supplied and
requires explicit confirmation for remote targets.

PowerShell example:

```powershell
$env:BASE_URL = "https://your-demo-api.example.com"
$env:EVENT_ID = "evt-flight-ai101"
$env:CONFIRM_DEMO_TARGET = "YES"
$env:ALLOW_REMOTE_TARGET = "YES"
npm run bench:demo --workspace=ticketwala-backend
```

Optionally lower the load, up to the script limits of 5,000 total requests and
250 virtual users:

```powershell
$env:TOTAL_REQUESTS = "1000"
$env:VUS = "100"
```

`SCENARIO` selects a focused test: `burst` (default), `same-seat` (all VUs
compete for `UNIT_ID`), `idempotency` (replay the same request), or
`idempotency-conflict` (verify a changed request is rejected with 422; requires
one VU and at least two requests). `stale-expiry` makes one hold, waits for
expiry, then checks that the worker returned the seat to inventory; run it with
`TOTAL_REQUESTS=1`, `VUS=1`, and `HOLD_TTL_SECONDS` matching the API's
`RESERVATION_TTL_SECONDS`. Use a separate, isolated demo event for each
scenario.

Close the test terminal to stop a running test. Keep the demo website open for
viewers; this script sends traffic directly to the API and does not make the
browser display a load-test dashboard. Refresh the event/seat view to see
availability changes if the page does not update automatically.
