"use client";

import { useEffect, useState } from "react";
import type { AssistContext } from "@/lib/assistant";
import {
  companionReply,
  FLOW_VIEWS,
  guideStep,
  issueLine,
  STUCK_MS,
  STUCK_VIEWS,
  stuckLine,
} from "@/lib/companion";
import type { DestinationId } from "@/lib/types";

type Args = {
  view: string;
  amountRaw: string;
  amountOk: boolean;
  amount: number;
  name: string;
  issue: string;
  assist: AssistContext;
  pay: (to: DestinationId, amount: string) => void;
  openFixedDeposit: () => void;
};

export function useCompanion({
  view,
  amountRaw,
  amountOk,
  amount,
  name,
  issue,
  assist,
  pay,
  openFixedDeposit,
}: Args) {
  const [open, setOpen] = useState(false);
  const [guiding, setGuiding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState<{
    text: string;
    key: string;
    action?: "fixed-deposit";
  } | null>(null);

  // a reply belongs to the screen state it was made for. once the user moves on or edits
  // the amount the key changes, so stale replies disappear without any cleanup code
  const key = `${view}|${amountRaw}`;
  const step = guideStep(view, { amountOk, amount, name });
  const active = guiding && FLOW_VIEWS.includes(view);
  const target = active ? step.target : null;
  const line =
    (reply?.key === key && reply.text) ||
    (active && step.line) ||
    "Hi, I'm Penny. Ask me anything about this payment.";

  // stuck detection: a timer that restarts whenever the screen or the amount changes.
  // if it runs out the user has not made progress, so penny offers help on her own
  useEffect(() => {
    if (!STUCK_VIEWS.includes(view) || open || guiding || muted) return;
    const timer = window.setTimeout(() => {
      setOpen(true);
      setReply({ text: stuckLine(view), key });
    }, STUCK_MS);
    return () => window.clearTimeout(timer);
  }, [view, key, open, guiding, muted]);

  // bring the highlighted control into view, since the contact list and form can scroll
  useEffect(() => {
    if (!target) return;
    document
      .querySelector(`[data-guide="${target}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [target]);

  const startGuide = () => {
    setOpen(true);
    setGuiding(true);
    setReply(null);
  };

  const close = () => {
    setOpen(false);
    setGuiding(false);
    setReply(null);
  };

  return {
    open,
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
    // "not now" keeps penny quiet until the user changes screen
    dismiss: () => {
      close();
      setMuted(true);
    },
    // called by the app on every screen change
    navigate: (next: string) => {
      setMuted(false);
      if (!FLOW_VIEWS.includes(next)) close();
    },
    // an error is the clearest sign of being stuck, so penny explains it straight away
    explain: (text: string) => {
      setOpen(true);
      setReply({ text: issueLine(text), key });
    },
    ask: (text: string) => {
      const result = companionReply(text, { issue, guiding: active, assist });
      if (result.kind === "stop") {
        setGuiding(false);
        setReply({ text: result.text, key });
        return;
      }
      if (result.kind === "say") {
        setOpen(true);
        setReply({ text: result.text, key });
        return;
      }
      if (result.kind === "fixed-deposit") {
        setOpen(true);
        setReply({ text: result.text, key, action: "fixed-deposit" });
        return;
      }
      startGuide();
      if (result.kind === "pay") pay(result.to, result.amount);
    },
  };
}
