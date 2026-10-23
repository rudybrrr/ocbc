import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { sourceLoader } from '../tests/load-source.mjs';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd(), true);
const { routeIntent } = sourceLoader()('src/lib/intent-server.ts');
const cases = JSON.parse(readFileSync(new URL('../tests/intent-eval.json', import.meta.url), 'utf8'));
const counts = new Map();
let correct = 0, liveCalls = 0, fallbacks = 0;
console.log(process.env.GROQ_API_KEY ? 'Mode: live Groq with rule fallback' : 'Mode: fallback (no GROQ_API_KEY)');
for (const item of cases) {
  assert.ok(item.category && typeof item.utterance === 'string' && item.journey);
  let live = false;
  const result = await routeIntent(item.utterance, { fetcher: async (...args) => {
    liveCalls++;
    const response = await fetch(...args);
    if (response.ok) {
      const { validateIntent } = sourceLoader()('src/lib/intent.ts');
      try { live = !!validateIntent(JSON.parse((await response.clone().json()).choices?.[0]?.message?.content)); } catch { /* Report fallback use below. */ }
    }
    return response;
  } });
  if (!live) fallbacks++;
  const match = result.journey === item.journey;
  const category = counts.get(item.category) ?? { correct: 0, total: 0 };
  category.total++;
  if (match) { correct++; category.correct++; }
  else console.log(`MISS [${item.category}] ${JSON.stringify(item.utterance)} → ${result.journey}; expected ${item.journey}`);
  counts.set(item.category, category);
}
const score = (n, total) => `${n}/${total} (${(100 * n / total).toFixed(1)}%)`;
assert.equal([...counts.values()].reduce((sum, n) => sum + n.total, 0), cases.length);
console.log(`Overall: ${score(correct, cases.length)}`);
for (const [category, n] of counts) console.log(`${category}: ${score(n.correct, n.total)}`);
console.log(`Live requests: ${liveCalls}; fallback results: ${fallbacks}`);
