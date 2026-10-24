import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceLoader } from './load-source.mjs';

const { tokenState, formatTokens, tokenWord, weeklySpending } = sourceLoader({})('src/lib/tokens.ts');

test('S$60 weekly budget is 12 tokens of S$5', () => {
  const s = tokenState(60, 0);
  assert.equal(s.total, 12);
  assert.equal(s.left, 12);
  assert.equal(s.tone, 'good');
});

test('tokens round to halves and tone follows what is left', () => {
  assert.equal(tokenState(60, 15).left, 9);
  assert.equal(tokenState(60, 17.5).partial, true);
  assert.equal(tokenState(60, 52).tone, 'low');
  assert.equal(tokenState(60, 80).left, 0);
  assert.equal(tokenState(60, 80).tone, 'empty');
});

test('formatting', () => {
  assert.equal(formatTokens(2.5), '2½');
  assert.equal(formatTokens(0.5), '½');
  assert.equal(tokenWord(1), 'token');
  assert.equal(tokenWord(3), 'tokens');
});

test('own-account moves are not counted as spending', () => {
  const now = new Date('2026-10-24T10:00:00');
  const at = new Date('2026-10-24T09:00:00').toISOString();
  const t = (id, to, amount) => ({ id, to, amount, at });
  const w = weeklySpending([t('a', 'savings', 100), t('b', 'mum', 20)], now, (id) => id);
  assert.equal(w.items.some((i) => i.id === 'a'), false);
  assert.equal(w.items[0].amount, 20);
});
