#!/usr/bin/env node
/**
 * Lightweight HTTP load / stress smoke against a static or SPA host.
 * Usage:
 *   LOAD_TEST_URL=https://example.com node scripts/load-test.mjs
 *   LOAD_TEST_URL=http://127.0.0.1:4173 CONCURRENCY=30 REQUESTS=300 node scripts/load-test.mjs
 *
 * For local preview: `npm run build && npm run preview` in another terminal, then run this.
 */

const url = process.env.LOAD_TEST_URL || 'http://127.0.0.1:4173/';
const concurrency = Math.max(1, Number(process.env.CONCURRENCY || 25));
const totalRequests = Math.max(concurrency, Number(process.env.REQUESTS || 200));

async function one(clientUrl) {
  const t0 = performance.now();
  const res = await fetch(clientUrl, {
    redirect: 'follow',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  const ms = performance.now() - t0;
  return { ok: res.ok, status: res.status, ms };
}

async function worker(id, queue, stats) {
  while (queue.length) {
    const i = queue.pop();
    try {
      const r = await one(url);
      if (r.ok) stats.ok++;
      else stats.fail++;
      stats.times.push(r.ms);
    } catch {
      stats.fail++;
    }
  }
}

async function main() {
  console.log(`Load test → ${url}`);
  console.log(`Requests: ${totalRequests}, concurrency: ${concurrency}`);
  const queue = Array.from({ length: totalRequests }, (_, i) => i);
  const stats = { ok: 0, fail: 0, times: [] };
  const workers = Array.from({ length: concurrency }, (_, id) => worker(id, queue, stats));
  const t0 = performance.now();
  await Promise.all(workers);
  const elapsed = (performance.now() - t0) / 1000;
  stats.times.sort((a, b) => a - b);
  const p50 = stats.times[Math.floor(stats.times.length * 0.5)] ?? 0;
  const p95 = stats.times[Math.floor(stats.times.length * 0.95)] ?? 0;
  const rps = totalRequests / elapsed;
  console.log(`Done in ${elapsed.toFixed(2)}s (${rps.toFixed(1)} req/s)`);
  console.log(`OK: ${stats.ok}, fail: ${stats.fail}`);
  console.log(`Latency ms — p50: ${p50.toFixed(1)}, p95: ${p95.toFixed(1)}`);
  if (stats.fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
