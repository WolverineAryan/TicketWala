import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const unexpectedResponseRate = new Rate("unexpected_response_rate");
const successfulHolds = new Counter("successful_holds");

const baseUrl = __ENV.BASE_URL;
const eventId = __ENV.EVENT_ID;
const scenario = __ENV.SCENARIO || "burst";
const totalRequests = Number(__ENV.TOTAL_REQUESTS || 5000);
const virtualUsers = Number(__ENV.VUS || 250);
const unitId = __ENV.UNIT_ID || "unit-001";
const conflictUnitId = __ENV.CONFLICT_UNIT_ID || "unit-002";
const holdTtlSeconds = Number(__ENV.HOLD_TTL_SECONDS || 120);

if (!baseUrl || !eventId) {
  throw new Error("Set BASE_URL and EVENT_ID to the demo API and isolated demo event.");
}

if (!["burst", "same-seat", "idempotency", "idempotency-conflict", "stale-expiry"].includes(scenario)) {
  throw new Error("SCENARIO must be burst, same-seat, idempotency, idempotency-conflict, or stale-expiry.");
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

if (!Number.isInteger(holdTtlSeconds) || holdTtlSeconds < 1 || holdTtlSeconds > 3600) {
  throw new Error("HOLD_TTL_SECONDS must be an integer between 1 and 3600.");
}

if (scenario === "stale-expiry" && (totalRequests !== 1 || virtualUsers !== 1)) {
  throw new Error("stale-expiry requires TOTAL_REQUESTS=1 and VUS=1.");
}

if (scenario === "idempotency-conflict" && (totalRequests < 2 || virtualUsers !== 1)) {
  throw new Error("idempotency-conflict requires TOTAL_REQUESTS>=2 and VUS=1.");
}

if (scenario === "idempotency" && (totalRequests < 2 || virtualUsers !== 1)) {
  throw new Error("idempotency requires TOTAL_REQUESTS>=2 and VUS=1.");
}

const apiBaseUrl = baseUrl.replace(/\/+$/, "");

export const options = {
  scenarios: {
    [scenario]: {
      executor: "shared-iterations",
      vus: virtualUsers,
      iterations: totalRequests,
      maxDuration: scenario === "stale-expiry" ? `${holdTtlSeconds + 60}s` : "2m",
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
  const eventDetails = event.json();
  const validUnitId = (candidate) => {
    const match = /^unit-(\d+)$/.exec(candidate);
    return match && Number(match[1]) >= 1 && Number(match[1]) <= eventDetails.totalSeats;
  };
  if (
    ["same-seat", "idempotency", "idempotency-conflict", "stale-expiry"].includes(scenario) &&
    !validUnitId(unitId)
  ) {
    throw new Error("UNIT_ID must identify a seat in the selected event.");
  }
  if (
    scenario === "idempotency-conflict" &&
    (!validUnitId(conflictUnitId) || conflictUnitId === unitId)
  ) {
    throw new Error("CONFLICT_UNIT_ID must identify a different seat in the selected event.");
  }
}

export default function () {
  const stableIdempotencyKey = `demo-${scenario}-${eventId}-${scenario === "idempotency" ? __VU : "shared"}`;
  const firstBody = { eventId };
  if (scenario === "same-seat" || scenario === "idempotency" || scenario === "idempotency-conflict" || scenario === "stale-expiry") {
    firstBody.unitId = unitId;
  }

  const requestBody = scenario === "idempotency-conflict" && __ITER > 0
    ? { eventId, unitId: conflictUnitId }
    : firstBody;
  const idempotencyKey =
    scenario === "idempotency" || scenario === "idempotency-conflict"
      ? stableIdempotencyKey
      : `demo-${__VU}-${__ITER}-${Date.now()}`;

  const response = http.post(
    `${apiBaseUrl}/api/v1/reservations/hold`,
    JSON.stringify(requestBody),
    {
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "X-Client-Id": `demo-vu-${__VU}`,
      },
      timeout: "5s",
    }
  );

  let validResponse;
  if (scenario === "idempotency-conflict" && __ITER > 0) {
    validResponse = response.status === 422;
  } else if (scenario === "idempotency") {
    validResponse = response.status === 201;
  } else if (scenario === "stale-expiry") {
    validResponse = response.status === 201;
  } else {
    validResponse =
      response.status === 201 || response.status === 409 || response.status === 429;
  }
  unexpectedResponseRate.add(!validResponse);
  if (response.status === 201) successfulHolds.add(1);

  check(response, {
    [`${scenario} returned an expected response`]: () => validResponse,
  });

  if (scenario === "stale-expiry" && response.status === 201) {
    sleep(holdTtlSeconds + 15);
    const retry = http.post(
      `${apiBaseUrl}/api/v1/reservations/hold`,
      JSON.stringify({ eventId, unitId }),
      {
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `demo-stale-expiry-retry-${Date.now()}`,
        },
        timeout: "5s",
      }
    );
    const recycled = retry.status === 201;
    unexpectedResponseRate.add(!recycled);
    check(retry, {
      "expired hold returned its seat to inventory": () => recycled,
    });
    if (recycled) successfulHolds.add(1);
  }
}
