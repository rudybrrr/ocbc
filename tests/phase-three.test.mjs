import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { sourceLoader } from "./load-source.mjs";
import { harness } from "./helpers/harness.mjs";

function setup(saved = {}) {
  const h = harness(saved);
  const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
  const render = () => h.render(() => StoreProvider({ children: null }).props.value);
  return { h, render };
}
function screen(file, name, store) {
  const h = harness(); h.setStore(store);
  const Component = h.load(resolve(file))[name];
  const element = h.render(() => Component({}));
  return { element, html: renderToStaticMarkup(element) };
}
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

test("guidance is temporary, confirms exits, retains progress and never changes global mode", () => {
  for (const mode of ["standard", "guided"]) {
    const { h, render } = setup({ mode }); let store = render();
    for (const journey of ["invest", "fixed-deposit"]) {
      store.go(journey); store = render(); assert.equal(store.journeyGuidance, null);
      store.chooseJourneyGuidance(true); store = render();
      store.setInvestStep(2); store.updateFixedDeposit({ step: 2, amount: "1234" }); store = render();
      h.confirmExit(false); assert.equal(store.go("home"), false); store = render();
      assert.equal(store.snapshot.screen, journey); assert.equal(store.journeyGuidance, true);
      h.confirmExit(true); store.go("home"); store = render();
      assert.equal(store.journeyGuidance, null); assert.equal(store.snapshot.mode, mode);
      assert.equal(store.snapshot.invest.step, 2); assert.equal(store.snapshot.fixedDeposit.amount, "1234");
      store.runAction({ type: "screen", screen: journey }); store = render();
      assert.equal(store.journeyGuidance, null);
      store.chooseJourneyGuidance(false); store = render(); assert.equal(store.journeyGuidance, false);
      store.go("home"); store = render();
    }
    assert.equal(h.saved().journeyGuidance, undefined);
    assert.equal(setup(h.saved()).render().journeyGuidance, null);
  }
});

test("explicit journey completions reset guidance and retain completion across reload", () => {
  const { h, render } = setup(); let store = render();
  store.go("invest"); store.chooseJourneyGuidance(true); store.setInvestStep(5); store = render();
  store.completeInvest(); store = render();
  assert.equal(store.journeyGuidance, null); assert.equal(store.snapshot.invest.done, true);
  store.chooseJourneyGuidance(true); store = render(); assert.equal(store.journeyGuidance, null);
  store.go("fixed-deposit"); store.chooseJourneyGuidance(true);
  store.updateFixedDeposit({ amount: "1500", tenor: "6", step: 4 }); store = render();
  store.completeFixedDeposit(); store = render();
  assert.equal(store.journeyGuidance, null); assert.match(store.snapshot.fixedDeposit.reference, /^FD-DEMO-/);
  store.chooseJourneyGuidance(true); store = render(); assert.equal(store.journeyGuidance, null);
  assert.equal(setup(h.saved()).render().snapshot.fixedDeposit.reference, store.snapshot.fixedDeposit.reference);
});

test("new guided journeys have no amount, tenor or allocation preselected and invalid FD drafts cannot complete", () => {
  const { render } = setup(); let store = render();
  store.go("fixed-deposit"); store.chooseJourneyGuidance(true); store = render();
  assert.equal(store.snapshot.fixedDeposit.tenor, ""); assert.equal(store.snapshot.fixedDeposit.amount, "");
  const entry = screen("src/components/fixed-deposit.tsx", "FixedDepositApplication", { ...store, snapshot: { ...store.snapshot, fixedDeposit: { ...store.snapshot.fixedDeposit, step: 1 } } }).html;
  assert.match(entry, /<option value="" selected="">Choose a tenor/);
  assert.doesNotMatch(entry, /<option value="(?:3|6|12|24)" selected/);
  store.completeFixedDeposit(); store = render(); assert.equal(store.snapshot.fixedDeposit.reference, "");
  store.completeInvest(); store = render(); assert.equal(store.snapshot.invest.done, false);
  store.updateFixedDeposit({ step: 4, amount: "1000", tenor: "bogus" }); store = render();
  store.completeFixedDeposit(); store = render(); assert.equal(store.snapshot.fixedDeposit.reference, "");
  for (const amount of ["", "99", "50001", "NaN"]) {
    store.updateFixedDeposit({ amount, tenor: "6" }); store = render();
    store.completeFixedDeposit(); store = render(); assert.equal(store.snapshot.fixedDeposit.reference, "");
  }
  const html = screen("src/components/invest.tsx", "Invest", { ...store, snapshot: { ...store.snapshot, invest: { step: 0, done: false, monthly: null } } }).html;
  assert.doesNotMatch(html, /type="radio"|60%|40%|recommended|Horizon Balanced/i);
});

test("every guided step renders its guide target and help/exit controls; only confirm buttons complete", () => {
  const { render } = setup(); const store = render();
  const h = harness(); const { guideStep } = h.load(resolve("src/lib/companion.ts"));
  for (const [view, file, name, count] of [["invest", "invest", "Invest", 6], ["fixed-deposit", "fixed-deposit", "FixedDepositApplication", 5]]) {
    let completed = 0;
    for (let step = 0; step < count; step++) {
      const snapshot = { ...store.snapshot, screen: view, invest: { ...store.snapshot.invest, step }, fixedDeposit: { ...store.snapshot.fixedDeposit, step, amount: "1000", tenor: "6" } };
      const current = { ...store, snapshot, journeyGuidance: true, completeInvest: () => completed++, completeFixedDeposit: () => completed++ };
      const { html, element } = screen(`src/components/${file}.tsx`, name, current);
      const rule = guideStep(view, {}, { guided: true, step });
      assert.ok(rule.target); assert.ok(html.includes(`data-guide="${rule.target}"`), `${view} step ${step} missing ${rule.target}`);
      assert.match(html, /Talk to a person/); assert.match(html, />Exit</);
      if (view === "invest" && step === 4) assert.match(html, /This is not financial advice\./);
      assert.equal(guideStep(view, {}, { guided: false, step }).target, null);
      if (step === count - 1) {
        nodes(element).find((node) => node.props?.["data-guide"] === rule.target).props.onClick();
      }
    }
    assert.equal(completed, 1);
  }
});

test("FD displayed bounds, tenors and rates match typed data on entry and review", () => {
  const { render } = setup(); const store = render();
  const h = harness(); const { FIXED_DEPOSIT } = h.load(resolve("src/lib/fixed-deposit-data.ts"));
  for (const step of [1, 3, 4]) {
    const current = { ...store, journeyGuidance: true, snapshot: { ...store.snapshot, fixedDeposit: { ...store.snapshot.fixedDeposit, step, amount: "1000", tenor: "6" } } };
    const { html } = screen("src/components/fixed-deposit.tsx", "FixedDepositApplication", current);
    assert.ok(html.includes(FIXED_DEPOSIT.rateLabel));
    if (step === 1) {
      assert.ok(html.includes(`min="${FIXED_DEPOSIT.minimum}"`));
      assert.ok(html.includes(`max="${FIXED_DEPOSIT.maximum}"`));
      for (const tenor of FIXED_DEPOSIT.tenors) assert.ok(html.includes(tenor.label));
    } else assert.ok(html.includes(FIXED_DEPOSIT.tenors.find((term) => term.id === "6").label));
  }
});

test("Penny highlights only opted-in journey steps, clears on completion/exit, and stop affects only this journey", () => {
  const h = harness(); const { useCompanion } = h.load(resolve("src/lib/use-companion.ts"));
  const args = { view: "invest", amountRaw: "", amountOk: false, amount: 0, name: "", issue: "", idleHelp: false, assist: {}, pay() {}, openFixedDeposit() {}, go() {}, journey: { guided: false, step: 0 }, onJourneyGuidanceChange: (guided) => { args.journey.guided = guided; } };
  const render = () => h.render(() => useCompanion(args));
  let penny = render(); assert.equal(penny.target, null);
  args.journey.guided = true; penny = render(); assert.equal(penny.target, "invest-intro");
  args.journey.step = 3; penny = render(); assert.equal(penny.target, "invest-risks");
  penny.ask("stop"); penny = render(); assert.equal(penny.target, null); assert.equal(args.journey.guided, false);
  args.view = "fixed-deposit"; args.journey = { guided: true, step: 1 }; penny = render(); assert.equal(penny.target, "fd-tenor");
  args.journey.guided = false; penny = render(); assert.equal(penny.target, null);
  args.view = "home"; penny = render(); assert.equal(penny.target, null);
});


test("both journey screens gate all shared entry routes independently of the global preference", () => {
  const { render } = setup(); const store = render();
  for (const mode of ["standard", "guided"]) for (const view of ["invest", "fixed-deposit"]) for (const guidance of [null, false, true]) {
    const current = { ...store, journeyGuidance: guidance, snapshot: { ...store.snapshot, screen: view, mode } };
    const load = sourceLoader({
      "@/lib/store": { useStore: () => current },
      "@/lib/use-companion": { useCompanion: () => ({ target: null }) },
      "@/components/companion": { Companion: () => null },
      "@/components/penny-peek": { PennyPeek: () => null },
      "@/components/dialogs": { AssistantDialog: () => null, PersonDialog: () => null, PreferencesDialog: () => null },
    });
    const { OcbcApp } = load("src/components/ocbc-app.tsx");
    const html = renderToStaticMarkup(React.createElement(OcbcApp));
    assert.equal(html.includes("Guide me through this"), guidance === null);
    assert.equal(html.includes("I know what I&#x27;m doing"), guidance === null);
  }
});


test("starting Penny in a journey never leaves the transfer guide enabled", () => {
  const h = harness(); const { useCompanion } = h.load(resolve("src/lib/use-companion.ts"));
  const args = { view: "invest", amountRaw: "", amountOk: false, amount: 0, name: "", issue: "", idleHelp: false, assist: {}, pay() {}, openFixedDeposit() {}, go() {}, journey: { guided: true, step: 0 } };
  const render = () => h.render(() => useCompanion(args));
  let penny = render(); penny.startGuide(); penny = render();
  args.view = "home"; args.journey.guided = false; render();
  args.view = "amount"; penny = render(); assert.equal(penny.guiding, false); assert.equal(penny.target, null);
});
