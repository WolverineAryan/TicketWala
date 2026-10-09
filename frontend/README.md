# TicketWala Frontend

This is the Next.js frontend scaffold for **TicketWala**. It is designed to be easily customized, styled, and extended by the frontend engineer.

## Architecture & Integration

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Backend API Base**: Default `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL` in `.env.local`)
- **API Contracts & Types**: Fully defined in `src/types/api.ts`

## Key Capabilities Pre-Wired

1. **⚡ Flash Reservation Claim (`POST /api/v1/reservations/hold`)**:
   - Acquires the next available inventory unit using strict FCFS Redis queue.
   - Receives `holdToken`, `reservationId`, `unitId`, and `expiresAt` (120s TTL).
2. **⏳ 120-Second Countdown Hold Timer**:
   - Accurately tracks server-side expiration.
   - Cleans up state when the hold expires.
3. **💳 Payment & Confirmation (`POST /api/v1/reservations/:id/confirm`)**:
   - Confirms the active hold using the cryptographic `holdToken`.
   - Transitions state to confirmed (durable in Supabase Postgres).
4. **❌ Intentional Release / Abandonment (`POST /api/v1/reservations/:id/release`)**:
   - Immediately releases the seat back to the front of the available queue (`LPUSH`).
5. **🔍 Contention Observatory (`GET /api/v1/ops/metrics`, `GET /api/v1/ops/inventory`, `POST /api/v1/ops/audit`)**:
   - Live telemetry counters, seat matrix visualizer, and invariant audit trigger.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

## Environment Variables

Create `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
