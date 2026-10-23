import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceLoader } from './load-source.mjs';
const load = sourceLoader();
const { validateIntent, fallbackIntent } = load('src/lib/intent.ts');
const { routeIntent } = load('src/lib/intent-server.ts');
const valid = { journey: 'transfer', confidence: 0.9, slots: { amount: 50, recipient: 'Mum' } };

test('intent validation rejects malformed and unknown values at every level', () => {
  assert.deepEqual(validateIntent(valid), valid);
  for (const input of [null, [], {}, { ...valid, journey: 'buy_stock' }, { ...valid, confidence: 1.1 }, { ...valid, confidence: NaN }, { ...valid, slots: null }, { ...valid, slots: { amount: -1 } }, { ...valid, slots: { amount: '50' } }, { ...valid, slots: { recipient: '' } }, { ...valid, slots: { execute: true } }, { ...valid, execute: true }, { ...valid, options: ['hack'] }, { ...valid, options: Array(4).fill('transfer') }, { ...valid, confidence: 0.5 }, { ...valid, clarify_question: 4 }]) {
    assert.equal(validateIntent(input), null, JSON.stringify(input));
  }
  assert.ok(validateIntent({ ...valid, confidence: 0.5, clarify_question: 'Transfer or PayNow?', options: ['transfer', 'paynow'] }));
});

test('missing key never calls network and reuses rule matching and amount parsing', async () => {
  const result = await routeIntent('pay Mum ten dollars', { key: '', fetcher: () => { throw Error('must not fetch'); } });
  assert.equal(result.journey, 'transfer');
  assert.deepEqual(result.slots, { amount: 10, recipient: 'Mum · Tan Mei Ling' });
});

test('timeout, failed request and malformed model output fall back', async () => {
  const text = 'open a fixed deposit';
  const expected = fallbackIntent(text);
  const fetchers = [
    () => Promise.reject(Error('network')),
    async () => new Response('', { status: 503 }),
    async () => Response.json({ choices: [{ message: { content: '{bad json' } }] }),
    async () => Response.json({ choices: [{ message: { content: JSON.stringify({ ...valid, journey: 'buy_stock' }) } }] }),
    (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(Error('timeout')))),
  ];
  for (const fetcher of fetchers) assert.deepEqual(await routeIntent(text, { key: 'test', fetcher, timeoutMs: 10 }), expected);
});

test('valid Groq JSON uses the configured model and never executes a payment', async () => {
  const result = await routeIntent('send 50 to Mum', { key: 'test', model: 'configured-model', fetcher: async (_, init) => {
    const body = JSON.parse(init.body);
    assert.equal(body.model, 'configured-model');
    assert.deepEqual(body.response_format, { type: 'json_object' });
    return Response.json({ choices: [{ message: { content: JSON.stringify(valid) } }] });
  } });
  assert.deepEqual(result, valid);
});

test('ambiguous transfers clarify, and advice gets safe alternative journeys', () => {
  const ambiguous = fallbackIntent('send money to mum');
  assert.equal(ambiguous.journey, 'transfer');
  assert.ok(ambiguous.confidence < 0.75);
  assert.ok(ambiguous.clarify_question);
  const advice = fallbackIntent('should I buy Tesla stock');
  assert.equal(advice.journey, 'out_of_scope');
  assert.deepEqual(advice.options, ['start_investing', 'talk_to_person']);
});

test('plural unit trusts route to the guided investing process', () => {
  assert.equal(fallbackIntent('learn about unit trusts').journey, 'start_investing');
});

test('PayNow without an amount clarifies too', () => {
  const result = fallbackIntent('paynow to Jamie');
  assert.ok(result.confidence < 0.75);
  assert.ok(result.clarify_question);
});

test('API rejects invalid input and serves fallback without credentials', async () => {
  const { POST } = load('src/app/api/intent/route.ts');
  for (const body of ['{bad', '{}', JSON.stringify({ text: '' }), JSON.stringify({ text: 'x'.repeat(501) }), 'null']) {
    const response = await POST(new Request('http://localhost/api/intent', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
  const old = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const response = await POST(new Request('http://localhost/api/intent', { method: 'POST', body: JSON.stringify({ text: 'explore offers' }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).journey, 'explore_offers');
  } finally {
    if (old === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = old;
  }
});

test('intent recipients prefer exact names and never resolve a different contact by surname', () => {
  const { findIntentContact } = load('src/lib/intent.ts');
  assert.equal(findIntentContact('Mum · Tan Mei Ling')?.id, 'mum');
  assert.equal(findIntentContact('Mum')?.id, 'mum');
  assert.equal(findIntentContact('mom')?.id, 'mum');
  assert.equal(findIntentContact('Alex Tan')?.id, 'alicia');
  assert.equal(findIntentContact('Alex Smith'), undefined);
  assert.equal(findIntentContact('my brother'), undefined);
  assert.equal(fallbackIntent('send 50 to Mum Tan Mei Ling').slots.recipient, 'Mum · Tan Mei Ling');
});

test('fixed-deposit fallback extracts an amount for form prefill', () => {
  assert.equal(fallbackIntent('open a fixed deposit for 2000').slots.amount, 2000);
});

test('fallback does not turn negative or over-precision amounts into a different payment', () => {
  for (const text of ['send -50 to Mum', 'send $-50 to Mum', 'send 10.999 to Mum']) {
    const result = fallbackIntent(text);
    assert.equal(result.slots.amount, undefined);
    assert.ok(result.confidence < 0.75);
  }
});
