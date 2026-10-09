-- ==============================================================================
-- TicketWala Relational Schema Migration (Supabase Postgres & Local PG)
-- Migration 001: Initial Core Schema & Invariant Constraints
-- ==============================================================================

-- 1. Enable UUID Extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Reservations Table (Durable State of Truth)
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id UUID PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL DEFAULT 'evt-main',
    unit_id VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64),
    version INT NOT NULL DEFAULT 1,
    hold_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_status CHECK (status IN ('HELD', 'CONFIRMED', 'EXPIRED', 'RELEASED'))
);

-- Crucial PostgreSQL Invariant: Exactly one active holder or confirmed owner per unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_unit 
ON reservations (event_id, unit_id) 
WHERE status IN ('HELD', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_reservations_status_expires 
ON reservations (status, hold_expires_at);

-- 3. Reservation Events Ledger (Append-Only Event Stream)
CREATE TABLE IF NOT EXISTS reservation_events (
    event_id VARCHAR(64) PRIMARY KEY, -- Redis Stream ID (e.g. 1791535000000-0)
    reservation_id UUID NOT NULL,
    event_id_ref VARCHAR(64) NOT NULL DEFAULT 'evt-main',
    unit_id VARCHAR(32) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    version INT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_reservation_id 
ON reservation_events (reservation_id, version);

-- 4. Scoped Idempotency Records Table
CREATE TABLE IF NOT EXISTS idempotency_records (
    scope VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_fingerprint VARCHAR(64) NOT NULL,
    outcome JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created 
ON idempotency_records (created_at);

-- 5. Reconciliation & Invariant Auditor Runs Table
CREATE TABLE IF NOT EXISTS reconciliation_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    mismatches_found INT NOT NULL DEFAULT 0,
    repairs_executed INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PASSED',
    details JSONB
);
