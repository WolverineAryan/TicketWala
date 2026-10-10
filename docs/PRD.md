# TicketWala — Product Requirements Document (PRD)
## High-Contention Flash Reservation & Locking Engine

> **Official PDF Version:** [Download TicketWala_PRD.pdf](./TicketWala_PRD.pdf)  
> **Companion Specification:** [Software Requirements Specification (SRS)](./SRS.md) • [50K Load Testing Report](./LOAD_TESTING_50K_REPORT.md)  
> **Version:** 2.0.0 • **Status:** Production Verified  

---

## 1. Executive Vision & Problem Statement

During high-demand ticket drops—such as stadium concerts (Coldplay, Diljit Dosanjh), championship finals (IPL, ICC World Cup), or festive transit bookings—traditional relational ticketing architectures collapse under thundering-herd contention:
1. **Database Lock Contention:** Thousands of concurrent `SELECT ... FOR UPDATE` queries exhaust connection pools and trigger deadlocks.
2. **Overselling & Double-Bookings:** Race conditions between read-availability and write-commit cause the same seat to be sold to multiple buyers.
3. **Ghost Inventory (Orphaned Holds):** Abandoned checkouts lock seats indefinitely when background timers fail or fire out of order.
4. **Unfair Queue Jumping:** Retries and page refreshes penalize honest users while rewarding aggressive bot scripts.

**TicketWala** solves this with **FlashLock**: a deterministic, high-throughput, zero-overselling reservation engine capable of absorbing **50,000+ concurrent contenders competing for 5,000 seats** with sub-10ms median latency and 100% mathematical inventory conservation.

---

## 2. Core Product Goals & Non-Negotiable Invariants

| Invariant ID | Invariant Name | Mathematical / Operational Guarantee |
|:---|:---|:---|
| **INV-01** | **Zero Double-Booking** | At any instant $t$, a seat $U_i$ may be bound to at most one active `HELD` or `CONFIRMED` reservation. |
| **INV-02** | **Strict Conservation of Inventory** | $N_{\text{Total}} = N_{\text{Available}} + N_{\text{Held}} + N_{\text{Confirmed}}$ across all failure modes. |
| **INV-03** | **Deterministic Idempotency** | Retrying a request with the same `Idempotency-Key` and payload returns the exact original state without double-allocating. |
| **INV-04** | **Stale Expiry Fencing** | Monotonic version tokens prevent delayed timeout workers from releasing a seat that was already recycled and re-assigned to a new user. |
| **INV-05** | **Instant $O(1)$ Sold-Out Short-Circuit** | When $N_{\text{Available}} = 0$, ingress requests short-circuit in $<2\text{ms}$ without touching the durable database. |

---

## 3. Target User Personas

1. **High-Velocity Fan / Attendee:** Wants instant seat selection, transparent pricing, a clear 60-second hold countdown, instant UPI checkout, and a verifiable QR boarding pass.
2. **Event Organizer:** Needs real-time telemetry into live seat occupancy, dynamic tier pricing, revenue tracking, and zero oversold seats.
3. **Venue Gate Operator:** Requires a sub-second QR/PNR verification scanner that prevents replay attacks and duplicate gate entry.
4. **System Auditor / SRE:** Uses the built-in **FlashLock Contention Lab** (`/simulation`) to inject 50,000-user traffic bursts and export cryptographic/JSON audit proofs.

---

## 4. Functional Requirements (FR-01 to FR-13)

| ID | Feature Module | Requirement Description | Priority |
|:---|:---|:---|:---:|
| **FR-01** | **Multipurpose Event Catalog** | Support Flights, Concerts, Sports, Cinema, and High-Speed Transit with multi-tier seat pricing. | P0 |
| **FR-02** | **Interactive Seat Matrix** | Real-time visual seat map displaying `AVAILABLE`, `HELD`, and `CONFIRMED` states per row/column. | P0 |
| **FR-03** | **Atomic FCFS Seat Hold** | Grant a 60-second exclusive lock (`HELD`) with a cryptographic `holdToken` via atomic Lua/in-memory state transition. | P0 |
| **FR-04** | **Idempotent Retry Handling** | Enforce `Idempotency-Key` header validation; return `422 Unprocessable Entity` on payload fingerprint mismatch. | P0 |
| **FR-05** | **Adaptive Token Bucket Ingress** | Dynamically scale admission rate based on remaining seat scarcity (`adaptive_balance.lua`). | P0 |
| **FR-06** | **Live Hold Countdown & Instant Release** | Client-side and server-enforced TTL countdown with one-click voluntary seat release back to the FIFO pool. | P0 |
| **FR-07** | **Dynamic UPI & Card Checkout** | Generate dynamic UPI QR payloads and verify UTR references to transition `HELD` $\rightarrow$ `CONFIRMED`. | P0 |
| **FR-08** | **Printable E-Ticket & QR Pass** | Generate a print-optimized boarding pass with PNR code, cryptographic signature, and gate details. | P0 |
| **FR-09** | **Gate Entry QR Scanner** | Verify PNR/QR payloads at `/verify` and prevent duplicate check-ins (`ALREADY_SCANNED` protection). | P1 |
| **FR-10** | **Organizer Command Center** | Live event creation, dynamic tier price updates, and real-time revenue/occupancy analytics. | P1 |
| **FR-11** | **FlashLock Collision Lab** | Interactive stress-testing sandbox (`/simulation`) running 6 contention scenarios including the **50K Users / 5K Seats Mega Burst**. | P0 |
| **FR-12** | **Cross-Store Invariant Auditor** | Automated reconciliation script verifying zero drift between memory queues and durable PostgreSQL ledgers. | P1 |
| **FR-13** | **Two-Tier Health & Graceful Shutdown** | Expose `/health/live` and `/health/ready` probes with clean `SIGTERM` stream draining. | P1 |

---

## 5. Benchmark & SLA Acceptance Criteria (50,000 Users / 5,000 Seats)

The platform is verified against a **50,000 virtual user burst competing for 5,000 seats**:
- **Exact Allocation:** 5,000 holds granted (`201 Created`), 45,000 cleanly rejected (`409 Conflict`).
- **Double Bookings:** `0` (Strict requirement).
- **Throughput:** $>10,000\text{ RPS}$ sustained.
- **Latency SLA:** $p_{50} < 15\text{ms}$, $p_{95} < 50\text{ms}$, $p_{99} < 100\text{ms}$.

> See the full execution telemetry in **[LOAD_TESTING_50K_REPORT.md](./LOAD_TESTING_50K_REPORT.md)**.
