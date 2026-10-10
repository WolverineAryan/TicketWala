import http from "k6/http";
import { check } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

/**
 * TicketWala Mega-Scale Load Test (k6)
 * Scenario: 50,000 Virtual Contenders Competing for 5,000 Seats
 *
 * Usage:
 *   k6 run -e BASE_URL=http://localhost:8000 backend/tests/load/k6-50k-users.js
 */

const successfulHolds = new Counter("successful_holds_201");
const soldOutRejections = new Counter("sold_out_rejections_409");
const rateLimited = new Counter("rate_limited_429");
const unexpectedErrorRate = new Rate("unexpected_error_rate");
const holdLatency = new Trend("hold_latency_ms");

const BASE_URL = (__ENV.BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const EVENT_ID = __ENV.EVENT_ID || "evt-mega-stadium-5000";
const TOTAL_USERS = Number(__ENV.TOTAL_USERS || 50000);
const VUS = Number(__ENV.VUS || 500);

export const options = {
  scenarios: {
    mega_stadium_flash_drop: {
      executor: "shared-iterations",
      vus: VUS,
      iterations: TOTAL_USERS,
      maxDuration: "3m",
    },
  },
  thresholds: {
    unexpected_error_rate: ["rate==0"],
    http_req_duration: ["p(50)<25", "p(95)<100", "p(99)<250"],
  },
};

export function setup() {
  // 1. Verify API Liveness
  const live = http.get(`${BASE_URL}/health/live`, { timeout: "5s" });
  if (live.status !== 200) {
    throw new Error(`API Liveness check failed with HTTP ${live.status}`);
  }

  // 2. Reset the 5,000-seat inventory to pristine state
  const reset = http.post(`${BASE_URL}/api/v1/simulation/reset`, null, { timeout: "10s" });
  if (reset.status !== 200) {
    throw new Error(`Failed to reset inventory: HTTP ${reset.status}`);
  }

  return { startTime: Date.now() };
}

export default function () {
  const idempotencyKey = `k6-50k-vu-${__VU}-iter-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    eventId: EVENT_ID,
  });

  const res = http.post(`${BASE_URL}/api/v1/reservations/hold`, payload, {
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Client-Id": `k6-vu-${__VU}`,
    },
    timeout: "10s",
  });

  holdLatency.add(res.timings.duration);

  if (res.status === 201) {
    successfulHolds.add(1);
    unexpectedErrorRate.add(false);
  } else if (res.status === 409) {
    soldOutRejections.add(1);
    unexpectedErrorRate.add(false);
  } else if (res.status === 429) {
    rateLimited.add(1);
    unexpectedErrorRate.add(false);
  } else {
    unexpectedErrorRate.add(true);
  }

  check(res, {
    "status is 201 (Held) or 409 (Sold Out)": (r) => r.status === 201 || r.status === 409 || r.status === 429,
  });
}
