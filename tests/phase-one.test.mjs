import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { harness } from "./helpers/harness.mjs";

const defaults = ["paynow", "scan-pay", "transfer"];


test("legacy snapshots retain data and receive preference defaults", () => {
  const h = harness({ onboarded: true, mode: "standard", textSize: "default", draft: { amount: "12" }, bankerRequests: [{ id: "keep" }] });
  const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
  const store = h.render(() => StoreProvider({ children: null }).props.value);
  assert.deepEqual(store.snapshot.everydayActions, defaults);
  assert.equal(store.snapshot.homeLayout, "classic");
  assert.equal(store.snapshot.idleHelp, false);
  assert.equal(store.snapshot.draft.amount, "12");
  assert.equal(store.snapshot.bankerRequests[0].id, "keep");
  assert.equal(h.saved().onboarded, true);
});

test("onboarding, navigation actions, shared errors and preferences persist", () => {
  const h = harness();
  const { StoreProvider, DEFAULT_PREFERENCES } = h.load(resolve("src/lib/store.tsx"));
  const render = () => h.render(() => StoreProvider({ children: null }).props.value);
  let store = render();
  assert.equal(store.snapshot.onboarded, false);
  assert.equal(store.snapshot.screen, "login");
  store.login(); store = render();
  assert.equal(store.snapshot.screen, "onboarding");
  store.completeOnboarding(DEFAULT_PREFERENCES);
  store = render();
  assert.equal(store.snapshot.screen, "home");
  assert.equal(store.snapshot.mode, "standard");
  assert.equal(store.snapshot.textSize, "default");
  store.go("plan"); store = render();
  assert.equal(store.assistContext.screen, "plan");
  store.runAction({ type: "screen", screen: "move", label: "Pay" }); store = render();
  assert.equal(store.snapshot.screen, "move");
  store.setIssue("Daily demo limit exceeded."); store = render();
  assert.equal(store.assistContext.lastIssue, store.snapshot.lastIssue);
  store.ask("Why did my payment fail?"); store = render();
  assert.match(store.snapshot.messages.at(-1).text, /Daily demo limit exceeded/);
  store.setEverydayActions(["invest", "paynow"]);
  store.setToggle("idleHelp", true); store = render();
  assert.deepEqual(h.saved().everydayActions, ["invest", "paynow"]);
  assert.equal(h.saved().idleHelp, true);
  store.resetDemo(); store = render();
  assert.equal(store.snapshot.screen, "login");
  assert.equal(store.snapshot.onboarded, false);
  assert.deepEqual(store.snapshot.everydayActions, defaults);
  store.login(); store = render();
  assert.equal(store.snapshot.screen, "onboarding");
});

test("setup is offered on first login per page load while saved banking state survives", () => {
  const h = harness({
    onboarded: true, screen: "home", mode: "standard", textSize: "largest",
    homeLayout: "calm", weeklyBudget: 35, idleHelp: true,
    draft: { amount: "12" }, bankerRequests: [{ id: "keep" }],
  });
  const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
  const render = () => h.render(() => StoreProvider({ children: null }).props.value);
  let store = render();
  assert.equal(store.snapshot.screen, "login");
  assert.equal(store.snapshot.textSize, "largest");
  assert.equal(store.snapshot.weeklyBudget, 35);
  store.login(); store = render();
  assert.equal(store.snapshot.screen, "onboarding");
  // The skip path also completes setup with the existing preferences.
  store.completeOnboarding(store.snapshot);
  store = render();
  assert.equal(store.snapshot.screen, "home");
  store.go("login"); store = render();
  assert.equal(store.snapshot.screen, "login");
  store.login();
  store = render();
  assert.equal(store.snapshot.screen, "home");
  assert.equal(store.snapshot.homeLayout, "calm");
  assert.equal(store.snapshot.idleHelp, true);
  assert.equal(store.snapshot.draft.amount, "12");
  assert.equal(store.snapshot.bankerRequests[0].id, "keep");

  const reloaded = harness(h.saved());
  const ReloadedProvider = reloaded.load(resolve("src/lib/store.tsx")).StoreProvider;
  const renderReload = () => reloaded.render(() => ReloadedProvider({ children: null }).props.value);
  let next = renderReload();
  assert.equal(next.snapshot.screen, "login");
  assert.equal(next.snapshot.onboarded, true);
  assert.equal(next.snapshot.draft.amount, "12");
  next.login(); next = renderReload();
  assert.equal(next.snapshot.screen, "onboarding");
  assert.equal(next.snapshot.textSize, "largest");
  assert.equal(next.snapshot.bankerRequests[0].id, "keep");
});

test("blocked storage does not prevent startup, changes or reset", () => {
  const h = harness(undefined, true);
  const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
  const render = () => h.render(() => StoreProvider({ children: null }).props.value);
  let store = render();
  store.setMode("standard"); store = render();
  assert.equal(store.snapshot.mode, "standard");
  store.resetDemo(); store = render();
  assert.equal(store.snapshot.onboarded, false);
});

test("saved actions are validated, deduplicated and capped without replacing other preferences", () => {
  const h = harness({ onboarded: true, mode: "guided", textSize: "largest", everydayActions: ["invest", "invest", "unknown", "paynow", "transfer", "scan-pay", "fixed-deposit"], idleHelp: "yes" });
  const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
  const render = () => h.render(() => StoreProvider({ children: null }).props.value);
  let store = render();
  assert.deepEqual(store.snapshot.everydayActions, ["invest", "paynow", "transfer", "scan-pay"]);
  assert.equal(store.snapshot.idleHelp, false);
  assert.equal(store.snapshot.mode, "guided");
  assert.equal(store.snapshot.textSize, "largest");
  store.setEverydayActions(["paynow", "scan-pay", "transfer", "invest", "fixed-deposit"]);
  store = render();
  assert.equal(store.snapshot.everydayActions.length, 4);
  store.setEverydayActions([]); store = render();
  assert.deepEqual(h.saved().everydayActions, []);
});

test("idle timer is opt-in, cancels on opt-out, and errors still open immediately", () => {
  const h = harness();
  const { useCompanion } = h.load(resolve("src/lib/use-companion.ts"));
  const args = { view: "pay", amountRaw: "", amountOk: false, amount: 0, name: "Mum", issue: "", assist: {}, pay() {}, openFixedDeposit() {}, go() {}, idleHelp: false };
  const render = () => h.render(() => useCompanion(args));
  let companion = render();
  assert.equal(h.timers.size, 0);
  args.idleHelp = true; companion = render();
  assert.equal(h.timers.size, 1);
  h.timers.values().next().value(); companion = render();
  assert.equal(companion.peeking, true);
  args.idleHelp = false; companion = render();
  assert.equal(h.timers.size, 0);
  assert.equal(companion.peeking, false);
  companion.explain("Daily demo limit exceeded."); companion = render();
  assert.equal(companion.open, true);
  assert.match(companion.line, /Daily demo limit exceeded/);
});

test("home layout persists, defaults invalid values to classic and retains an existing calm choice", () => {
  for (const [saved, expected] of [[undefined, "classic"], ["invalid", "classic"], ["calm", "calm"]]) {
    const h = harness({ homeLayout: saved, onboarded: true, draft: { amount: "25" } });
    const { StoreProvider } = h.load(resolve("src/lib/store.tsx"));
    const render = () => h.render(() => StoreProvider({ children: null }).props.value);
    let store = render();
    assert.equal(store.snapshot.homeLayout, expected);
    store.setHomeLayout("classic"); store = render();
    assert.equal(h.saved().homeLayout, "classic");
    assert.equal(store.snapshot.draft.amount, "25");
  }
});
