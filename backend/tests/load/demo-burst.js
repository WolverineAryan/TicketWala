import http from "k6/http";
import { check } from "k6";
import { Rate } from "k6/metrics";

const unexpectedResponseRate = new Rate("unexpected_response_rate");

const baseUrl = __ENV.BASE_URL;
const eventId = __ENV.EVENT_ID;
const totalRequests = Number(__ENV.TOTAL_REQUESTS || 5000);
const virtualUsers = Number(__ENV.VUS || 250);

if (!baseUrl || !eventId) {
  throw new Error("Set BASE_URL and EVENT_ID to the demo API and isolated demo event.");
}

if (__ENV.CONFIRM_DEMO_TARGET !== "YES") {
  throw new Error("Set CONFIRM_DEMO_TARGET=YES after verifying this is a safe demo target.");
}

let target;
try {
  target = new URL(baseUrl);
} catch {
  throw new Error("BASE_URL must be a valid absolute URL.");
}

if (target.protocol !== "http:" && target.protocol !== "https:") {
  throw new Error("BASE_URL must use HTTP or HTTPS.");
}

const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
if (!isLoopback && __ENV.ALLOW_REMOTE_TARGET !== "YES") {
  throw new Error("For a remote target, set ALLOW_REMOTE_TARGET=YES after confirming authorization.");
}

if (!Number.isInteger(totalRequests) || totalRequests < 1 || totalRequests > 5000) {
  throw new Error("TOTAL_REQUESTS must be an integer between 1 and 5000.");
}

if (!Number.isInteger(virtualUsers) || virtualUsers < 1 || virtualUsers > 250) {
  throw new Error("VUS must be an integer between 1 and 250.");
}

const apiBaseUrl = baseUrl.replace(/\/+$/, "");

export const options = {
  scenarios: {
    demo_burst: {
      executor: "shared-iterations",
      vus: virtualUsers,
      iterations: totalRequests,
      maxDuration: "2m",
    },
  },
  thresholds: {
    unexpected_response_rate: ["rate<0.01"],
  },
};

export function setup() {
  const health = http.get(`${apiBaseUrl}/health/live`, { timeout: "5s" });
  if (health.status !== 200) {
    throw new Error(`API health check failed with HTTP ${health.status}.`);
  }

  const event = http.get(
    `${apiBaseUrl}/api/v1/events/${encodeURIComponent(eventId)}`,
    { timeout: "5s" }
  );
  if (event.status !== 200) {
    throw new Error(`Demo event check failed with HTTP ${event.status}.`);
  }
}

export default function () {
  const response = http.post(
    `${apiBaseUrl}/api/v1/reservations/hold`,
    JSON.stringify({ eventId }),
    {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": `demo-${__VU}-${__ITER}-${Date.now()}`,
        "X-Client-Id": `demo-vu-${__VU}`,
      },
      timeout: "5s",
    }
  );

  const validResponse =
    response.status === 201 || response.status === 409 || response.status === 429;
  unexpectedResponseRate.add(!validResponse);

  check(response, {
    "API handled request (held, sold out, or rate limited)": () => validResponse,
  });
}
