import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sourceLoader } from './load-source.mjs';

function render(homeLayout, actions = ['paynow', 'transfer']) {
  const store = { ready: true, balances: { everyday: 256.05, savings: 0 }, snapshot: { homeLayout, screen: 'home', everydayActions: actions, transfers: [], draft: { amount: '' }, invest: { step: 0 }, fixedDeposit: { step: 0 } }, assistContext: {} };
  const load = sourceLoader({
    '@/lib/store': { useStore: () => store },
    '@/lib/use-companion': { useCompanion: () => ({ target: null }) },
    '@/lib/use-voice': { useListen: () => ({ supported: false, state: 'idle' }) },
    '@/components/companion': { Companion: () => null },
    '@/components/penny-peek': { PennyPeek: () => null },
    '@/components/dialogs': { AssistantDialog: () => null, PersonDialog: () => null, PreferencesDialog: () => null },
  });
  const { OcbcApp } = load('src/components/ocbc-app.tsx');
  return renderToStaticMarkup(React.createElement(OcbcApp));
}

test('calm home renders only chosen actions, intent, balance and correctly labelled recent transactions', () => {
  const html = render('calm');
  for (const text of ['360 Account', '256.05 SGD', 'PayNow', 'Transfer', 'I want to…', 'Speak your request', 'Explore offers', 'Your everyday actions, chosen during setup', '4 most recent transactions']) assert.ok(html.includes(text), text);
  for (const text of ['oc-home-promo', 'oc-promo-tile', 'SAVINGS GOAL', 'MONEY INSIGHTS', 'Scan &amp; Pay', 'Foreign Exchange', 'Related offer', 'last 7 days']) assert.ok(!html.includes(text), text);
});

test('classic home keeps original banner, shortcuts and promo tiles', () => {
  const html = render('classic');
  for (const text of ['oc-home-promo', 'oc-promo-tile', 'SAVINGS GOAL', 'MONEY INSIGHTS', 'Scan &amp; Pay', 'Foreign Exchange', 'Up to 50 (last 7 days only)']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('oc-intent'));
});

test('an empty everyday action choice stays empty and still offers Edit and intent', () => {
  const html = render('calm', []);
  assert.ok(html.includes('chosen during setup'));
  assert.ok(html.includes('I want to…'));
  assert.ok(!html.includes('class="oc-quick-action"'));
});
