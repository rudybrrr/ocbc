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
import { balances } from "@/lib/data";
import { withTransition } from "@/lib/transition";
import type {
  BankerRequest,
  ChatAction,
  ChatMessage,
  Draft,
  Mode,
  Preferences,
  Screen,
  Snapshot,
  TextSize,
  Transfer,
} from "@/lib/types";

const KEY = "ocbc-adaptive-assist-v1";

const defaultDraft: Draft = {
  from: "everyday",
  to: "mum",
  amount: "",
  note: "",
};

function fresh(): Snapshot {
  return {
    onboarded: false,
    mode: "guided",
    textSize: "large",
    plainLanguage: true,
    offerPerson: true,
    readAmounts: false,
    screen: "home",
    helpOpen: false,
    invest: { step: 0, monthly: null, done: false },
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
    return { ...fresh(), ...parsed, helpOpen: false, draft: { ...defaultDraft, ...parsed.draft } };
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
  setToggle: (key: "plainLanguage" | "offerPerson" | "readAmounts", value: boolean) => void;
  go: (screen: Screen) => void;
  openHelp: () => void;
  closeHelp: () => void;
  openPrefs: () => void;
  closePrefs: () => void;
  prefsOpen: boolean;
  personOpen: boolean;
  openPerson: () => void;
  closePerson: () => void;
  updateDraft: (patch: Partial<Draft>) => void;
  submitMove: (transfer: Transfer, issueClear?: boolean) => void;
  setIssue: (issue: string | null) => void;
  setInvestStep: (step: number) => void;
  savePlan: (monthly: 50 | 100 | 200) => void;
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
    localStorage.setItem(KEY, JSON.stringify({ ...snapshot, helpOpen: false }));
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
      });
      const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: reply.text,
        actions: reply.actions,
      };
      return { ...current, messages: [...current.messages, user, assistant].slice(-40) };
    });
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
    setTextSize: (textSize) => patch({ textSize }),
    setToggle: (key, value) => patch({ [key]: value }),
    go: (screen) => {
      withTransition(() => patch({ screen, helpOpen: false }), "screen-title");
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
    openPrefs: () => {
      setPersonOpen(false);
      setPrefsOpen(true);
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
    savePlan: (monthly) => {
      setSnapshot((current) => ({
        ...current,
        invest: { step: current.invest.step, monthly, done: true },
      }));
      setAnnounce(`Practice plan saved. ${monthly} dollars a month. No money moved.`);
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
        withTransition(() => patch({ screen: action.screen, helpOpen: false }), "screen-title");
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
      localStorage.removeItem(KEY);
      const next = fresh();
      applyRoot(next);
      setSnapshot(next);
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
