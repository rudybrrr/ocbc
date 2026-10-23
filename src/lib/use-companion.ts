"use client";

import { useEffect, useState } from "react";
import type { AssistContext } from "@/lib/assistant";
import {
  companionReply,
  FLOW_VIEWS,
  guideStep,
  type JourneyGuide,
  issueLine,
  peekLine,
  STUCK_MS,
  STUCK_VIEWS,
  stuckLine,
} from "@/lib/companion";
import type { DestinationId } from "@/lib/types";

// penny is tucked away, peeking from the corner, or showing the full panel.
// more peek moods (happy, thinking, alert) can hang off "peek" later
export type CompanionMode = "hidden" | "peek" | "panel";

// anything that shows the user is still working. scroll does not bubble, so every
// listener is attached to the document in the capture phase
const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchmove", "scroll"] as const;
const LISTEN = { capture: true, passive: true } as const;

type Args = {
  view: string;
  amountRaw: string;
  amountOk: boolean;
  amount: number;
  name: string;
  issue: string;
  idleHelp: boolean;
  journey?: JourneyGuide;
  onJourneyGuidanceChange?: (guided: boolean) => void;
  assist: AssistContext;
  pay: (to: DestinationId, amount: string) => void;
  openFixedDeposit: () => void;
  go: (view: string) => boolean | void;
};

export function useCompanion({
  view,
  amountRaw,
  amountOk,
  amount,
  name,
  issue,
  idleHelp,
  journey,
  onJourneyGuidanceChange,
  assist,
  pay,
  openFixedDeposit,
  go,
}: Args) {
  const [mode, setMode] = useState<CompanionMode>("hidden");
  // where penny was peeking when tapped, so the panel avatar can fly in from that spot
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [guiding, setGuiding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState<{
    text: string;
    key: string;
    action?: "fixed-deposit";
  } | null>(null);

  // a reply belongs to the screen state it was made for. once the user moves on or edits
  // the amount the key changes, so stale replies disappear without any cleanup code
  const journeyView = view === "invest" || view === "fixed-deposit";
  const key = `${view}|${amountRaw}${journeyView ? `|${journey?.step}|${journey?.guided}` : ""}`;
  const step = guideStep(view, { amountOk, amount, name }, journey);
  const active = journeyView ? journey?.guided === true : guiding && FLOW_VIEWS.includes(view);
  const target = active ? step.target : null;
  const line =
    (reply?.key === key && reply.text) ||
    (active && step.line) ||
    "Hi, I'm Penny. Ask for help with a payment, or tell me where to go.";

  // stuck detection: an idle timer that restarts on any activity, screen or amount change.
  // if it runs out the user has stopped, so penny peeks in. activity while she peeks means
  // the user is not stuck after all, so she tucks away and the timer starts again
  useEffect(() => {
    if (!idleHelp || !STUCK_VIEWS.includes(view) || mode === "panel" || guiding || muted) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMode("peek"), STUCK_MS);
    };
    const onActivity = (event: Event) => {
      // taps on penny herself are handled by her own buttons
      if (event.target instanceof Element && event.target.closest("[data-penny-peek]")) return;
      if (mode === "peek") setMode("hidden");
      else arm();
    };
    if (mode === "hidden") arm();
    for (const type of ACTIVITY) document.addEventListener(type, onActivity, LISTEN);
    return () => {
      window.clearTimeout(timer);
      for (const type of ACTIVITY) document.removeEventListener(type, onActivity, LISTEN);
    };
  }, [idleHelp, view, key, mode, guiding, muted]);

  // bring the highlighted control into view, since the contact list and form can scroll
  useEffect(() => {
    if (!target) return;
    document
      .querySelector(`[data-guide="${target}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [target]);

  const startGuide = () => {
    if (journeyView) onJourneyGuidanceChange?.(true);
    setMode("panel");
    setGuiding(!journeyView);
    setReply(null);
  };

  const close = () => {
    setMode("hidden");
    setOrigin(null);
    setGuiding(false);
    setReply(null);
  };

  return {
    open: mode === "panel",
    peeking: idleHelp && mode === "peek",
    peekLine: peekLine(view),
    origin,
    guiding: active,
    target,
    line,
    showFixedDepositAction: reply?.key === key && reply.action === "fixed-deposit",
    openFixedDeposit: () => {
      close();
      openFixedDeposit();
    },
    startGuide,
    close,
    // the always-visible penny button opens the panel so the mic is one tap away
    openPanel: () => setMode("panel"),
    // tapping penny while she peeks opens the full panel with the stuck offer
    expand: (from: DOMRect) => {
      setOrigin(from);
      setMode("panel");
      setReply({ text: stuckLine(view), key });
    },
    // "not now" keeps penny quiet until the user changes screen
    dismiss: () => {
      close();
      setMuted(true);
    },
    // called by the app on every screen change
    navigate: (next: string) => {
      setMuted(false);
      setMode((current) => (current === "peek" ? "hidden" : current));
      if (!FLOW_VIEWS.includes(next)) close();
    },
    // show a one-off line, for example when the mic could not hear anything
    notify: (text: string) => {
      setMode("panel");
      setReply({ text, key });
    },
    // an error is the clearest sign of being stuck, so penny explains it straight away
    explain: (text: string) => {
      setMode("panel");
      setReply({ text: issueLine(text), key });
    },
    ask: (text: string) => {
      const result = companionReply(text, { issue, guiding: active, view, assist });
      if (result.kind === "go") {
        // navigating can close the panel, so reopen it after and key the reply to the new
        // screen. react applies these updates together, so the confirmation survives
        if (go(result.view) === false) return;
        setMode("panel");
        setReply({ text: result.text, key: `${result.view}|${amountRaw}` });
        return;
      }
      if (result.kind === "stop") {
        if (journeyView) onJourneyGuidanceChange?.(false);
        setGuiding(false);
        setReply({ text: result.text, key });
        return;
      }
      if (result.kind === "say") {
        setMode("panel");
        setReply({ text: result.text, key });
        return;
      }
      if (result.kind === "fixed-deposit") {
        setMode("panel");
        setReply({ text: result.text, key, action: "fixed-deposit" });
        return;
      }
      startGuide();
      if (result.kind === "pay") pay(result.to, result.amount);
    },
  };
}
