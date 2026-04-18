/**
 * k6 load smoke against the FastAPI surface (install k6: https://k6.io/docs/get-started/installation/).
 *
 * Usage:
 *   k6 run scripts/k6-api-smoke.js
 *   k6 run -e API_BASE=https://your-api.example.com scripts/k6-api-smoke.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE || 'http://127.0.0.1:8000';

export const options = {
  vus: 10,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const r1 = http.get(`${BASE}/`);
  check(r1, { 'root 200': (r) => r.status === 200 });

  const r2 = http.get(`${BASE}/api/health`);
  check(r2, { 'health 200': (r) => r.status === 200 });

  const r3 = http.get(`${BASE}/api/public/compliance/subprocessors`);
  check(r3, { 'subprocessors 200': (r) => r.status === 200 });

  const r4 = http.get(`${BASE}/api/public/enterprise-config`);
  check(r4, { 'enterprise-config 200': (r) => r.status === 200 });

  sleep(0.3);
}
