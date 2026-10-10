import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '5s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const EVENT_ID = __ENV.EVENT_ID || 'evt-flight-ai101';

export default function () {
  // 1. Health Probe
  const healthRes = http.get(`${BASE_URL}/health/live`);
  check(healthRes, {
    'health live is 200': (r) => r.status === 200,
  });

  // 2. Claim Hold
  const holdPayload = JSON.stringify({ eventId: EVENT_ID });
  const holdParams = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `smoke-${Date.now()}-${__VU}-${__ITER}`,
    },
  };

  const holdRes = http.post(`${BASE_URL}/api/v1/reservations/hold`, holdPayload, holdParams);
  check(holdRes, {
    'hold returns an expected status': (r) => [201, 409, 429].includes(r.status),
  });

  sleep(1);
}
