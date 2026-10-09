import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '5s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // 1. Health Probe
  const healthRes = http.get(`${BASE_URL}/health/live`);
  check(healthRes, {
    'health live is 200': (r) => r.status === 200,
  });

  // 2. Claim Hold
  const holdPayload = JSON.stringify({ eventId: 'evt-main' });
  const holdParams = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `smoke-${Date.now()}-${__VU}-${__ITER}`,
    },
  };

  const holdRes = http.post(`${BASE_URL}/api/v1/reservations/hold`, holdPayload, holdParams);
  check(holdRes, {
    'hold returns 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  sleep(1);
}
