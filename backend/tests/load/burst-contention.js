import http from 'k6/http';
import { check, Counter, Rate } from 'k6';

// Metrics
export const holdsCreated = new Counter('holds_created');
export const soldOutRejections = new Counter('sold_out_rejections');
export const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    flash_burst: {
      executor: 'constant-vus',
      vus: 125, // 125 concurrent virtual users
      duration: '15s', // 15 seconds burst -> ~5,000+ requests
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<60'], // Sub-second p95 latency under extreme contention
    error_rate: ['rate<0.01'], // <1% unexpected errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  const idempKey = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    eventId: 'evt-main',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempKey,
      'X-Client-Id': `vu-${__VU}`,
    },
    timeout: '2000ms',
  };

  const res = http.post(`${BASE_URL}/api/v1/reservations/hold`, payload, params);

  const isSuccess = res.status === 201;
  const isSoldOut = res.status === 409;
  const isRateLimited = res.status === 429;

  if (isSuccess) {
    holdsCreated.add(1);
    // Optional: Follow with simulated confirm
    const body = JSON.parse(res.body);
    if (body.reservationId && body.holdToken) {
      const confirmRes = http.post(
        `${BASE_URL}/api/v1/reservations/${body.reservationId}/confirm`,
        JSON.stringify({ holdToken: body.holdToken }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      check(confirmRes, { 'confirm succeeds': (r) => r.status === 200 });
    }
  } else if (isSoldOut) {
    soldOutRejections.add(1);
  }

  const validResponse = isSuccess || isSoldOut || isRateLimited;
  errorRate.add(!validResponse);

  check(res, {
    'valid response status (201, 409, or 429)': () => validResponse,
  });
}
