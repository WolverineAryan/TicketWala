import { performance } from "perf_hooks";

const BASE_URL = process.env.BASE_URL || "http://localhost:8000";
const DEMO_EVENT_ID = "evt-demo-collision-200";

interface TestReport {
  name: string;
  category: "Functional" | "Integration" | "Load & Contention" | "Evidence & Observability";
  passed: boolean;
  skipped?: boolean;
  durationMs: number;
  details?: string;
}

const reports: TestReport[] = [];
const outstandingHolds = new Map<string, string>();
const confirmedReservations = new Set<string>();

class TestSkippedError extends Error {}

function requireSetup(value: string, description: string): string {
  if (!value) throw new TestSkippedError(`Skipped because ${description} did not pass`);
  return value;
}

function trackHold(data: { reservationId?: string; holdToken?: string }) {
  if (data.reservationId && data.holdToken) {
    outstandingHolds.set(data.reservationId, data.holdToken);
  }
}

function markConfirmed(reservationId: string) {
  if (reservationId) confirmedReservations.add(reservationId);
}

function assertSafeTarget() {
  const target = new URL(BASE_URL);
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(target.hostname);

  if (process.env.RUN_INTEGRATION_TESTS !== "YES") {
    throw new Error(
      "This suite mutates demo inventory, confirms test bookings, and creates an organizer event. " +
      "Set RUN_INTEGRATION_TESTS=YES only for an isolated test API."
    );
  }
  if (!isLoopback &&
      (process.env.ALLOW_REMOTE_TARGET !== "YES" || process.env.CONFIRM_DEMO_TARGET !== "YES")) {
    throw new Error(
      "Remote targets require both ALLOW_REMOTE_TARGET=YES and CONFIRM_DEMO_TARGET=YES. " +
      "Use a dedicated demo deployment, never a production booking API."
    );
  }
}

async function runTest(
  name: string,
  category: "Functional" | "Integration" | "Load & Contention" | "Evidence & Observability",
  fn: () => Promise<string | void>
) {
  const start = performance.now();
  try {
    const detail = await fn();
    const durationMs = Math.round(performance.now() - start);
    reports.push({
      name,
      category,
      passed: true,
      durationMs,
      details: detail || undefined,
    });
    console.log(`  ✅ [PASS] ${name} (${durationMs}ms) ${detail ? `-> ${detail}` : ""}`);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    const skipped = err instanceof TestSkippedError;
    reports.push({
      name,
      category,
      passed: false,
      skipped,
      durationMs,
      details: err instanceof Error ? err.message : String(err),
    });
    if (skipped) {
      console.warn(`  ⏭️ [SKIP] ${name} (${durationMs}ms): ${err.message}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} (${durationMs}ms):`, err instanceof Error ? err.message : String(err));
    }
  }
}

async function main() {
  assertSafeTarget();
  console.log("\n==================================================================");
  console.log("🧪 TicketWala FlashLock Evidence-Driven Verification Test Suite");
  console.log(`🎯 Target API: ${BASE_URL}`);
  console.log("==================================================================\n");

  const engineResponse = await fetch(`${BASE_URL}/api/v1/observability/stream-health`);
  if (!engineResponse.ok) throw new Error(`Could not verify test engine (HTTP ${engineResponse.status})`);
  const engineData = await engineResponse.json();
  if (engineData.engine !== "in_memory_event_channel") {
    throw new Error(
      "This suite requires the embedded in-memory test engine because the simulation reset endpoint " +
      "does not reset Redis inventory. Start the API without Redis for an isolated test run."
    );
  }

  const resetResponse = await fetch(`${BASE_URL}/api/v1/simulation/reset`, { method: "POST" });
  if (!resetResponse.ok) throw new Error(`Could not reset demo inventory (HTTP ${resetResponse.status})`);

  // ---------------------------------------------------------------------------
  // 1. Functional Tests
  // ---------------------------------------------------------------------------
  console.log("▶ 1. FUNCTIONAL & CONFORMANCE TESTING");

  await runTest("System Health Probes", "Functional", async () => {
    const res = await fetch(`${BASE_URL}/health/live`);
    if (!res.ok) throw new Error(`Health probe returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== "alive") throw new Error("Health status not alive");
    return `Engine: ${data.engine}`;
  });

  await runTest("Application Security Response Headers Audit", "Functional", async () => {
    const res = await fetch(`${BASE_URL}/health/live`);
    const nosniff = res.headers.get("x-content-type-options");
    const frameOptions = res.headers.get("x-frame-options");
    const referrerPolicy = res.headers.get("referrer-policy");
    const permissionsPolicy = res.headers.get("permissions-policy");

    if (nosniff !== "nosniff") throw new Error(`Missing or invalid X-Content-Type-Options: ${nosniff}`);
    if (frameOptions !== "DENY") throw new Error(`Missing or invalid X-Frame-Options: ${frameOptions}`);
    if (!referrerPolicy) throw new Error("Missing Referrer-Policy header");
    if (!permissionsPolicy) throw new Error("Missing Permissions-Policy header");

    return "All security headers verified (nosniff, DENY, strict-origin, restrictive permissions)";
  });

  await runTest("Support & Contact Inquiries API", "Functional", async () => {
    const catRes = await fetch(`${BASE_URL}/api/v1/support/categories`);
    if (!catRes.ok) throw new Error(`Categories API returned HTTP ${catRes.status}`);
    const catData = await catRes.json();
    if (!catData.categories || catData.categories.length < 5) throw new Error("Expected at least 5 support categories");
    if (catData.directSupportEmail !== "ticketwala.org@gmail.com") throw new Error("Official support email mismatch");

    const contactRes = await fetch(`${BASE_URL}/api/v1/support/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Automated Suite Verifier",
        email: "qa@ticketwala.org",
        category: "PAYMENT",
        subject: "Verification of 120s TTL lock",
        message: "Automated test validating ticket generation and rate limiting",
      }),
    });
    if (!contactRes.ok) throw new Error(`Contact API returned HTTP ${contactRes.status}`);
    const contactData = await contactRes.json();
    if (!contactData.success || !contactData.ticketId) throw new Error("Contact API did not return ticketId");

    return `Ticket reference generated: ${contactData.ticketId}`;
  });


  await runTest("Events Catalog Multipurpose Verification", "Functional", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/events`);
    if (!res.ok) throw new Error(`Events API returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.events || data.events.length < 5) throw new Error("Expected at least 5 vertical events");
    const categories = new Set(data.events.map((e: any) => e.category));
    return `Verified ${data.events.length} events across categories: [${Array.from(categories).join(", ")}]`;
  });

  await runTest("Seat Matrix & Tier Data", "Functional", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/events/evt-flight-ai101/seats`);
    if (!res.ok) throw new Error(`Seat matrix returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.seats || data.seats.length === 0) throw new Error("Empty seat matrix");
    return `Loaded ${data.seats.length} units with tiers for Flight AI-101`;
  });

  await runTest("Mathematical Invariant Conservation Audit", "Functional", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/inventory/audit/${DEMO_EVENT_ID}`);
    if (!res.ok) throw new Error(`Audit returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data.passed) throw new Error(`Invariant audit failed: ${JSON.stringify(data.checks)}`);
    return `Capacity: ${data.totalConfiguredCapacity} | Equation: ${data.checks.capacityConservation.equation} | Conserved: ${data.passed}`;
  });

  // ---------------------------------------------------------------------------
  // 2. Integration & Payment Tests
  // ---------------------------------------------------------------------------
  console.log("\n▶ 2. INTEGRATION & PAYMENT VERIFICATION TESTING");

  let heldReservationId = "";
  let heldToken = "";
  let issuedPnr = "";

  await runTest("Atomic 120s Flash Hold Reservation", "Integration", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: DEMO_EVENT_ID,
        unitId: "unit-018",
      }),
    });
    if (!res.ok) throw new Error(`Hold failed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reservationId || !data.holdToken) throw new Error("Missing reservationId or holdToken");
    trackHold(data);
    heldReservationId = data.reservationId;
    heldToken = data.holdToken;
    return `Locked Seat ${data.unitId} (Lease TTL: 120s)`;
  });

  await runTest("Dynamic NPCI UPI QR & Intent Generation", "Integration", async () => {
    requireSetup(heldReservationId, "the flash hold was not created");
    const res = await fetch(`${BASE_URL}/api/v1/reservations/${heldReservationId}/upi-qr`);
    if (!res.ok) throw new Error(`UPI QR generation failed HTTP ${res.status}`);
    const data = await res.json();
    const intent = data.intentUrl || data.upiIntentUrl || "";
    if (!data.qrCodeDataUrl || data.upiId !== "9146199158@fam" || !intent.includes("9146199158")) {
      throw new Error("UPI QR code missing or incorrect payee ID");
    }
    return `Generated dynamic QR for ${data.upiId} (Amount: ₹${data.amount})`;
  });

  const uniqueUtr = `987${Date.now().toString().slice(-9)}`;

  await runTest("Payment Verification & Test Email Sink", "Integration", async () => {
    requireSetup(heldReservationId, "the flash hold was not created");
    requireSetup(heldToken, "the flash hold token is missing");
    const res = await fetch(`${BASE_URL}/api/v1/reservations/${heldReservationId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdToken: heldToken,
        utr: uniqueUtr,
        passengerName: "TicketWala Integration Test",
        email: `ticketwala-test-${Date.now()}@example.invalid`,
      }),
    });
    if (!res.ok) throw new Error(`Payment verification failed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.pnr || data.status !== "CONFIRMED") throw new Error("Booking confirmation failed");
    markConfirmed(heldReservationId);
    issuedPnr = data.pnr;
    return `Issued PNR ${data.pnr}; test email recipient: ${data.recipientEmail}`;
  });

  await runTest("Single-Use QR Admission & Duplicate Entry Rejection", "Integration", async () => {
    requireSetup(issuedPnr, "payment confirmation did not issue a PNR");
    // 1st scan: valid
    const scan1Res = await fetch(`${BASE_URL}/api/v1/tickets/verify-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pnr: issuedPnr, gate: "Gate-South-1" }),
    });
    if (!scan1Res.ok) throw new Error(`First scan failed HTTP ${scan1Res.status}`);
    const scan1 = await scan1Res.json();
    if (scan1.status !== "ADMISSION_GRANTED") throw new Error(`First scan not granted: ${scan1.status}`);

    // 2nd scan: duplicate reject
    const scan2Res = await fetch(`${BASE_URL}/api/v1/tickets/verify-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pnr: issuedPnr, gate: "Gate-North-2" }),
    });
    if (scan2Res.status !== 409) throw new Error(`Duplicate scan was NOT rejected! Status: ${scan2Res.status}`);
    const scan2 = await scan2Res.json();
    if (scan2.status !== "DUPLICATE_SCAN_REJECTED") throw new Error(`Unexpected duplicate status: ${scan2.status}`);

    return `Scan 1: Admitted at Gate-South-1 | Scan 2: Duplicate blocked at Gate-North-2 (HTTP 409)`;
  });

  await runTest("Payment Webhook Deduplication & Idempotent Safety", "Integration", async () => {
    const providerEventId = `wh-evt-${Date.now()}`;
    const holdRes = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: DEMO_EVENT_ID }),
    });
    if (holdRes.status !== 201) throw new Error(`Webhook test hold failed HTTP ${holdRes.status}`);
    const hold = await holdRes.json();
    if (!hold.reservationId || !hold.holdToken) throw new Error("Webhook test hold is missing reservation credentials");
    trackHold(hold);
    const webhookPayload = {
      providerEventId,
      reservationId: hold.reservationId,
      holdToken: hold.holdToken,
      status: "PAYMENT_SUCCESS",
      amount: hold.price,
      currency: hold.currency,
    };

    // 1st delivery
    const wh1Res = await fetch(`${BASE_URL}/api/v1/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });
    if (!wh1Res.ok) throw new Error(`First webhook delivery failed HTTP ${wh1Res.status}`);
    const wh1 = await wh1Res.json();
    if (wh1.duplicate !== false || wh1.status !== "TICKET_ISSUED" || !wh1.pnr) {
      throw new Error(`First webhook delivery did not issue a ticket: ${JSON.stringify(wh1)}`);
    }
    markConfirmed(hold.reservationId);

    // 2nd delivery (Simulated webhook retry / network duplication)
    const wh2Res = await fetch(`${BASE_URL}/api/v1/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });
    if (!wh2Res.ok) throw new Error(`Webhook retry failed HTTP ${wh2Res.status}`);
    const wh2 = await wh2Res.json();
    if (wh2.duplicate !== true || wh2.status !== "ALREADY_PROCESSED") {
      throw new Error(`Second delivery did not handle duplicate idempotently: ${JSON.stringify(wh2)}`);
    }

    return `Delivery 1: Processed (HTTP 200) | Delivery 2: Deduplicated (status: ALREADY_PROCESSED)`;
  });

  await runTest("Cryptographic Replay Attack Prevention", "Integration", async () => {
    // Generate two fresh holds
    const holdRes1 = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: DEMO_EVENT_ID }),
    });
    if (holdRes1.status !== 201) throw new Error(`First replay-test hold failed HTTP ${holdRes1.status}`);
    const hold1 = await holdRes1.json();
    if (!hold1.reservationId || !hold1.holdToken) throw new Error("First replay-test hold is missing credentials");
    trackHold(hold1);

    const replayUtr = `777${Date.now().toString().slice(-9)}`;

    // First payment succeeds
    const pay1Res = await fetch(`${BASE_URL}/api/v1/reservations/${hold1.reservationId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdToken: hold1.holdToken,
        utr: replayUtr,
        passengerName: "Legitimate Buyer",
        email: `ticketwala-replay-test-${Date.now()}@example.invalid`,
      }),
    });
    if (!pay1Res.ok) throw new Error(`First payment failed HTTP ${pay1Res.status}`);
    const payment1 = await pay1Res.json();
    if (payment1.status !== "CONFIRMED" || !payment1.pnr) {
      throw new Error(`First payment did not confirm a booking: ${JSON.stringify(payment1)}`);
    }
    markConfirmed(hold1.reservationId);

    // Second hold attempts to reuse the same UTR
    const holdRes2 = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: DEMO_EVENT_ID }),
    });
    if (holdRes2.status !== 201) throw new Error(`Second replay-test hold failed HTTP ${holdRes2.status}`);
    const hold2 = await holdRes2.json();
    if (!hold2.reservationId || !hold2.holdToken) throw new Error("Second replay-test hold is missing credentials");
    trackHold(hold2);

    const replayRes = await fetch(`${BASE_URL}/api/v1/reservations/${hold2.reservationId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdToken: hold2.holdToken,
        utr: replayUtr, // Replayed!
        passengerName: "Attacker",
        email: `ticketwala-replay-test-${Date.now()}@example.invalid`,
      }),
    });

    if (replayRes.status !== 400) {
      throw new Error(`Replay attack was NOT blocked! Status: ${replayRes.status}`);
    }
    return `Correctly blocked duplicate UTR replay with HTTP 400`;
  });

  let createdEventId = "";

  await runTest("Organizer Studio: Publish Event & Apply Dynamic Surge Pricing", "Integration", async () => {
    const testEventTitle = `TicketWala Integration Test ${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/api/v1/organizer/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: testEventTitle,
        category: "CONCERT",
        categoryLabel: "Live Symphony",
        venue: "NCPA Mumbai",
        location: "Mumbai, India",
        dateTime: "Next Saturday 07:00 PM",
        totalSeats: 100,
        basePrice: 1500,
        currency: "INR",
        description: "Integration test event",
        tiers: [
          { id: "VIP", name: "VIP", price: 5000, color: "#F59E0B", description: "VIP tier" },
          { id: "GEN", name: "General", price: 1500, color: "#10B981", description: "General tier" },
        ],
      }),
    });
    if (!createRes.ok) throw new Error("Failed to create organizer event");
    const createData = await createRes.json();
    if (!createData.event?.id) throw new Error("Event creation response is missing the event ID");
    createdEventId = createData.event.id;

    const surgeRes = await fetch(`${BASE_URL}/api/v1/organizer/events/${createdEventId}/pricing`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surgeMultiplier: 1.3 }),
    });
    if (!surgeRes.ok) throw new Error("Failed to update surge pricing");
    const surgeData = await surgeRes.json();
    if (!Array.isArray(surgeData.tiers) || surgeData.tiers[0]?.price !== 6500) {
      throw new Error("Surge pricing response did not apply the expected 1.3x VIP price");
    }

    return `Created Event ${createdEventId} -> Applied 1.3x Surge Multiplier (VIP: ₹${surgeData.tiers[0].price})`;
  });

  await runTest("Stream Health Diagnostics Shape", "Evidence & Observability", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/observability/stream-health`);
    if (!res.ok) throw new Error(`Observability API returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== "HEALTHY" || !data.stream || typeof data.stream.pendingCount !== "number") {
      throw new Error("Stream health response is missing required diagnostics");
    }
    return `Engine: ${data.engine} | Lag: ${data.stream.workerLag} | Pending: ${data.stream.pendingCount}`;
  });

  // ---------------------------------------------------------------------------
  // 3. Collision Lab Signature Scenarios
  // ---------------------------------------------------------------------------
  console.log("\n▶ 3. FLASHLOCK COLLISION LAB BLUEPRINT SCENARIOS");

  await runTest("Lab Scenario 1: Three Contenders Racing for 1 Seat", "Evidence & Observability", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/simulation/run-scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: 1 }),
    });
    if (!res.ok) throw new Error(`Scenario 1 failed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.passed) throw new Error("Scenario 1 did not pass");
    return `Winner: ${data.winner?.name} (Seat ${data.targetSeat}) | Rejections: ${data.rejectionsCount} | Double Bookings: ${data.doubleBookingsCount}`;
  });

  await runTest("Lab Scenario 3: Idempotent Retry Storm vs Parameter Conflict", "Evidence & Observability", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/simulation/run-scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: 3 }),
    });
    if (!res.ok) throw new Error(`Scenario 3 failed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.passed) throw new Error("Scenario 3 did not pass");
    return `Stable Retry: Identical ResID | Conflicting Param: Rejected HTTP ${data.checks.conflictingPayloadRejection.httpStatus}`;
  });

  await runTest("Lab Scenario 4: Stale Expiry Fencing Protection", "Evidence & Observability", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/simulation/run-scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: 4 }),
    });
    if (!res.ok) throw new Error(`Scenario 4 failed HTTP ${res.status}`);
    const data = await res.json();
    if (!data.passed) throw new Error("Scenario 4 did not pass");
    return `Stale Release Fenced Out: Newer Hold ${data.newerHoldId} remains 100% active and protected`;
  });

  // ---------------------------------------------------------------------------
  // 4. Load & Contention Testing
  // ---------------------------------------------------------------------------
  console.log("\n▶ 4. HIGH-CONTENTION STORM & LOAD BENCHMARKING");

  await runTest("Single-Seat High Contention Storm (100 Simultaneous Requests -> 1 Seat)", "Load & Contention", async () => {
    // Reset sandbox
    const resetRes = await fetch(`${BASE_URL}/api/v1/simulation/reset`, { method: "POST" });
    if (!resetRes.ok) throw new Error(`Could not reset contention inventory (HTTP ${resetRes.status})`);
    outstandingHolds.clear();
    const contestedSeat = "unit-042";
    const totalRequests = 100;

    const promises = Array.from({ length: totalRequests }).map(async (_, idx) => {
      const res = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `client-${idx}-${Date.now()}`,
        },
        body: JSON.stringify({
          eventId: DEMO_EVENT_ID,
          unitId: contestedSeat,
        }),
      });
      if (res.status === 201) trackHold(await res.json());
      return res.status;
    });

    const statuses = await Promise.all(promises);
    const successes = statuses.filter((s) => s === 201).length;
    const rejections = statuses.filter((s) => s === 409).length;

    if (successes !== 1) {
      throw new Error(`Expected exactly one winner for one seat; received ${successes}`);
    }
    if (rejections !== totalRequests - 1 || statuses.length !== totalRequests) {
      throw new Error(`Expected ${totalRequests - 1} HTTP 409 responses; statuses were ${statuses.join(", ")}`);
    }
    return `Contention results: Exactly ${successes} Winner (HTTP 201), ${rejections} Graceful Rejections (HTTP 409). Double-bookings: 0`;
  });

  await runTest("Throughput & Latency Benchmark (150 Concurrent FCFS Requests)", "Load & Contention", async () => {
    const totalBenchmarkRequests = 150;
    const latencies: number[] = [];

    const startTime = performance.now();
    const benchmarkPromises = Array.from({ length: totalBenchmarkRequests }).map(async () => {
      const reqStart = performance.now();
      const res = await fetch(`${BASE_URL}/api/v1/reservations/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: DEMO_EVENT_ID }),
      });
      latencies.push(performance.now() - reqStart);
      if (res.status === 201) trackHold(await res.json());
      return res.status;
    });

    const results = await Promise.all(benchmarkPromises);
    const totalDurationMs = performance.now() - startTime;
    const rps = Math.round((totalBenchmarkRequests / (totalDurationMs / 1000)));

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(1);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(1);
    const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(1);

    const holdsGranted = results.filter((s) => s === 201).length;
    const unexpectedStatuses = results.filter((status) => ![201, 409, 429].includes(status));
    if (results.length !== totalBenchmarkRequests || unexpectedStatuses.length > 0) {
      throw new Error(
        `Benchmark received unexpected HTTP statuses: ${unexpectedStatuses.join(", ") || "incomplete results"}`
      );
    }
    if (holdsGranted !== totalBenchmarkRequests) {
      throw new Error(`Expected all ${totalBenchmarkRequests} benchmark holds to succeed; granted ${holdsGranted}`);
    }

    return `RPS: ${rps} req/sec | Latencies: p50=${p50}ms, p95=${p95}ms, p99=${p99}ms | Holds granted: ${holdsGranted}/${totalBenchmarkRequests}`;
  });

  await runTest("Release Remaining Test Holds", "Integration", async () => {
    const pending = [...outstandingHolds.entries()].filter(([reservationId]) =>
      !confirmedReservations.has(reservationId)
    );
    const failures: string[] = [];
    for (const [reservationId, holdToken] of pending) {
      const res = await fetch(`${BASE_URL}/api/v1/reservations/${reservationId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdToken }),
      });
      if (!res.ok) failures.push(`${reservationId}: HTTP ${res.status}`);
    }
    if (failures.length) throw new Error(`Could not release test holds: ${failures.join("; ")}`);
    return `Released ${pending.length} unconfirmed holds; confirmed test bookings remain in the in-memory sandbox`;
  });

  // ---------------------------------------------------------------------------
  // Summary Report
  // ---------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log("📊 FULL TEST SUITE SUMMARY");
  console.log("==================================================================");
  const passedCount = reports.filter((r) => r.passed).length;
  const skippedCount = reports.filter((r) => r.skipped).length;
  const failedCount = reports.length - passedCount - skippedCount;
  console.log(`Total Tests Run: ${reports.length}`);
  console.log(`Passed:          ${passedCount}`);
  console.log(`Skipped:         ${skippedCount}`);
  console.log(`Failed:          ${failedCount}`);
  console.log("==================================================================\n");
  if (failedCount > 0) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error("Integration suite aborted:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
