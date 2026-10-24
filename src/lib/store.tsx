"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { respond, type AssistContext } from "@/lib/assistant";
import { validFixedDeposit } from "@/lib/fixed-deposit-data";
import { balances } from "@/lib/data";
import { withTransition } from "@/lib/transition";
import { EVERYDAY_ACTIONS } from "@/lib/types";
import type {
  BankerRequest,
  ChatAction,
  ChatMessage,
  Draft,
  EverydayAction,
  FixedDepositState,
  Mode,
  Preferences,
  Screen,
  Snapshot,
  TextSize,
  Transfer,
} from "@/lib/types";

const KEY = "ocbc-adaptive-assist-v1";

export const DEFAULT_PREFERENCES: Preferences = {
  homeLayout: "calm",
  onboarded: false,
  mode: "standard",
  textSize: "default",
  plainLanguage: true,
  offerPerson: true,
  readAmounts: false,
  everydayActions: ["paynow", "scan-pay", "transfer"],
  idleHelp: false,
};

const defaultDraft: Draft = {
  from: "everyday",
  to: "mum",
  amount: "",
  note: "",
};

function fresh(): Snapshot {
  return {
    ...DEFAULT_PREFERENCES,
    // Keep the existing pre-login appearance; Skip uses the login defaults above.
    mode: "guided",
    textSize: "large",
    screen: "login",
    helpOpen: false,
    invest: { step: 0, monthly: null, done: false },
    fixedDeposit: { step: 0, amount: "", tenor: "", account: "everyday", reference: "" },
    transfers: [],
    messages: [],
    draft: defaultDraft,
    lastIssue: null,
    bankerRequests: [],
  };
}

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    return {
      ...fresh(),
      ...parsed,
      // Preserve the login entry point; saved task state is still available after login.
      screen: "login",
      helpOpen: false,
      everydayActions: Array.isArray(parsed.everydayActions)
        ? [...new Set(parsed.everydayActions)].filter((action) => EVERYDAY_ACTIONS.some(([id]) => id === action)).slice(0, 4)
        : DEFAULT_PREFERENCES.everydayActions,
      homeLayout: parsed.homeLayout === "classic" ? "classic" : "calm",
      idleHelp: parsed.idleHelp === true,
      draft: { ...defaultDraft, ...parsed.draft },
      invest: {
        ...fresh().invest,
        ...parsed.invest,
        step: Number.isInteger(parsed.invest?.step) ? Math.max(0, Math.min(parsed.invest!.step, 5)) : 0,
      },
      fixedDeposit: {
        ...fresh().fixedDeposit,
        ...parsed.fixedDeposit,
        step: Number.isInteger(parsed.fixedDeposit?.step) ? Math.max(0, Math.min(parsed.fixedDeposit!.step, 4)) : 0,
      },
    };
  } catch {
    return fresh();
  }
}

type Store = {
  ready: boolean;
  snapshot: Snapshot;
  announce: string;
  balances: { everyday: number; savings: number };
  assistContext: AssistContext;
  completeOnboarding: (prefs: Preferences) => void;
  setMode: (mode: Mode) => void;
  setTextSize: (textSize: TextSize) => void;
  setToggle: (key: "plainLanguage" | "offerPerson" | "readAmounts" | "idleHelp", value: boolean) => void;
  setHomeLayout: (layout: Preferences["homeLayout"]) => void;
  setEverydayActions: (actions: EverydayAction[]) => void;
  go: (screen: Screen) => boolean;
  journeyGuidance: boolean | null;
  chooseJourneyGuidance: (guided: boolean) => void;
  updateFixedDeposit: (patch: Partial<FixedDepositState>) => void;
  completeFixedDeposit: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openPrefs: (section?: "everyday-actions") => void;
  closePrefs: () => void;
  prefsOpen: boolean;
  personOpen: boolean;
  openPerson: () => void;
  closePerson: () => void;
  updateDraft: (patch: Partial<Draft>) => void;
  submitMove: (transfer: Transfer, issueClear?: boolean) => void;
  setIssue: (issue: string | null) => void;
  setInvestStep: (step: number) => void;
  completeInvest: () => void;
  clearPlan: () => void;
  ask: (text: string) => void;
  runAction: (action: ChatAction) => void;
  logBanker: (request: BankerRequest) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<Store | null>(null);

function applyRoot(prefs: Pick<Snapshot, "mode" | "textSize">) {
  document.documentElement.dataset.mode = prefs.mode;
  document.documentElement.dataset.text = prefs.textSize;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(fresh);
  const [ready, setReady] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [journeyGuidance, setJourneyGuidance] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = read();
    applyRoot(saved);
    // localStorage is empty during SSR. The splash covers this first client update.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate preferences after mount
    setSnapshot(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyRoot(snapshot);
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...snapshot, helpOpen: false }));
    } catch {
      // Keep this session usable when storage is blocked or full.
    }
  }, [ready, snapshot]);

  const money = useMemo(() => balances(snapshot.transfers), [snapshot.transfers]);

  const assistContext: AssistContext = {
    mode: snapshot.mode,
    plainLanguage: snapshot.plainLanguage,
    screen: snapshot.screen,
    everyday: money.everyday,
    savings: money.savings,
    investStep: snapshot.invest.step,
    monthly: snapshot.invest.monthly,
    investDone: snapshot.invest.done,
    lastIssue: snapshot.lastIssue,
    lastTopic: snapshot.messages.at(-1)?.topic ?? null,
  };

  const patch = (partial: Partial<Snapshot>) => {
    setSnapshot((current) => ({ ...current, ...partial }));
  };

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSnapshot((current) => {
      const reply = respond(trimmed, {
        ...assistContext,
        everyday: balances(current.transfers).everyday,
        savings: balances(current.transfers).savings,
        lastIssue: current.lastIssue,
        investStep: current.invest.step,
        monthly: current.invest.monthly,
        investDone: current.invest.done,
        mode: current.mode,
        plainLanguage: current.plainLanguage,
        screen: current.screen,
        lastTopic: current.messages.at(-1)?.topic ?? null,
      });
      const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.text,
        actions: reply.actions,
        topic: reply.topic,
      };
      return { ...current, messages: [...current.messages, user, assistant].slice(-40) };
    });
  };

  const go = (screen: Screen) => {
    if (screen !== snapshot.screen) {
      if (journeyGuidance === true && !window.confirm("Exit this journey? Your progress will be saved.")) return false;
      setJourneyGuidance(null);
    }
    withTransition(() => patch({ screen, helpOpen: false }), "screen-title");
    return true;
  };

  const value: Store = {
    ready,
    snapshot,
    announce,
    balances: money,
    assistContext,
    prefsOpen,
    personOpen,
    completeOnboarding: (prefs) => {
      withTransition(() => {
        patch({ ...prefs, onboarded: true, screen: "home", helpOpen: false });
      }, "screen-title");
    },
    setMode: (mode) => {
      withTransition(() => patch({ mode }));
      setAnnounce(
        mode === "guided"
          ? "Guided mode. Larger controls and one next step."
          : "Standard mode. Accounts and activity together.",
      );
    },
    setHomeLayout: (homeLayout) => patch({ homeLayout }),
    setTextSize: (textSize) => patch({ textSize }),
    setToggle: (key, value) => patch({ [key]: value }),
    setEverydayActions: (actions) => patch({ everydayActions: [...new Set(actions)].slice(0, 4) }),
    go,
    journeyGuidance,
    chooseJourneyGuidance: (guided) => {
      if (snapshot.screen !== "invest" && snapshot.screen !== "fixed-deposit") return;
      if (snapshot.screen === "invest" ? snapshot.invest.done : snapshot.fixedDeposit.reference) return;
      setJourneyGuidance(guided);
      if (snapshot.screen === "fixed-deposit" && !guided && snapshot.fixedDeposit.step === 0) {
        setSnapshot((current) => ({ ...current, fixedDeposit: { ...current.fixedDeposit, step: 1 } }));
      }
    },
    updateFixedDeposit: (draftPatch) => {
      setSnapshot((current) => ({ ...current, fixedDeposit: { ...current.fixedDeposit, ...draftPatch } }));
    },
    completeFixedDeposit: () => {
      if (snapshot.fixedDeposit.step !== 4 || !validFixedDeposit(snapshot.fixedDeposit)) return;
      setSnapshot((current) => ({ ...current, fixedDeposit: { ...current.fixedDeposit, reference: `FD-DEMO-${crypto.randomUUID()}` } }));
      setJourneyGuidance(null);
      setAnnounce("Application simulated. No fixed deposit was opened and no money moved.");
    },
    openHelp: () => {
      setPrefsOpen(false);
      setPersonOpen(false);
      patch({ helpOpen: true });
    },
    closeHelp: () => {
      patch({ helpOpen: false });
      requestAnimationFrame(() => document.getElementById("screen-title")?.focus());
    },
    openPrefs: (section) => {
      setPersonOpen(false);
      setPrefsOpen(true);
      if (section) requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".sheet .everyday-actions input")?.focus());
    },
    closePrefs: () => setPrefsOpen(false),
    openPerson: () => {
      setPrefsOpen(false);
      setPersonOpen(true);
    },
    closePerson: () => setPersonOpen(false),
    updateDraft: (draftPatch) => {
      setSnapshot((current) => ({ ...current, draft: { ...current.draft, ...draftPatch } }));
    },
    submitMove: (transfer) => {
      setSnapshot((current) => ({
        ...current,
        transfers: [transfer, ...current.transfers],
        draft: { ...current.draft, amount: "", note: "" },
        lastIssue: null,
      }));
    },
    setIssue: (lastIssue) => patch({ lastIssue }),
    setInvestStep: (step) => {
      setSnapshot((current) => ({ ...current, invest: { ...current.invest, step } }));
    },
    completeInvest: () => {
      if (snapshot.invest.step !== 5) return;
      setSnapshot((current) => ({ ...current, invest: { ...current.invest, done: true } }));
      setJourneyGuidance(null);
      setAnnounce("Investing process completed. No investment was made and no money moved.");
    },
    clearPlan: () => {
      patch({ invest: { step: 0, monthly: null, done: false } });
      setAnnounce("Practice plan cleared.");
    },
    ask,
    runAction: (action) => {
      if (action.type === "ask") {
        ask(action.query);
        return;
      }
      if (action.type === "screen") {
        go(action.screen);
        return;
      }
      if (action.type === "navigate" && action.actionId === "fixed_deposit.start") {
        go("fixed-deposit");
        return;
      }
      if (action.type === "person") {
        patch({ helpOpen: false });
        setPersonOpen(true);
        return;
      }
      patch({ helpOpen: false });
      setPrefsOpen(true);
    },
    logBanker: (request) => {
      setSnapshot((current) => ({
        ...current,
        bankerRequests: [request, ...current.bankerRequests],
      }));
      setAnnounce(`Practice request ${request.id} saved. Nobody will call.`);
    },
    resetDemo: () => {
      try {
        localStorage.removeItem(KEY);
      } catch {
        // Reset in memory even when storage is unavailable.
      }
      const next = fresh();
      applyRoot(next);
      setSnapshot(next);
      setJourneyGuidance(null);
      setPrefsOpen(false);
      setPersonOpen(false);
      setAnnounce("Demo reset.");
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}
