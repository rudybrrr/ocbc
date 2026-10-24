"use client";

import { useEffect, useRef } from "react";
import { CuteToken } from "@/components/cute-token";
import { useStore } from "@/lib/store";
import {
  clampBudget,
  formatTokens,
  MAX_WEEKLY_BUDGET,
  MIN_WEEKLY_BUDGET,
  TOKEN_VALUE,
  tokenWord,
  type SpendItem,
  type TokenState,
} from "@/lib/tokens";

const money = (value: number) => `S$${value.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function TokenSheet({ state, items, onClose }: { state: TokenState; items: SpendItem[]; onClose: () => void }) {
  const store = useStore();
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    done.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const budget = state.budget;
  const moneyLeft = Math.max(0, budget - state.spent);
  const coins = Array.from({ length: state.total }, (_, index) => (index < state.full ? "full" : index === state.full && state.partial ? "half" : "empty") as "full" | "half" | "empty");
  const message =
    state.tone === "empty"
      ? "You've used this week's spending money. Your account still works as normal, this is just a guide."
      : state.tone === "low"
        ? "Getting low. Plenty of days left, so spend gently."
        : "You're doing well this week.";

  return (
    <div className="oc-token-scrim" onClick={onClose}>
      <section className="oc-token-sheet" role="dialog" aria-modal="true" aria-labelledby="token-title" onClick={(event) => event.stopPropagation()}>
        <span className="oc-token-grip" aria-hidden="true" />
        <p id="token-title" className="oc-token-kicker">Your weekly spending</p>
        <p className="oc-token-count">
          <strong>{formatTokens(state.left)}</strong>
          <span>of {state.total} {tokenWord(state.total)} left</span>
        </p>
        <p className={`oc-token-money oc-token-${state.tone}`}>{money(moneyLeft)} left of {money(budget)}</p>
        <div className="oc-token-grid" role="img" aria-label={`${formatTokens(state.left)} of ${state.total} tokens left`}>
          {coins.map((kind, index) => (
            <CuteToken key={index} state={kind} size={38} className={kind === "full" ? "is-bouncy" : ""} />
          ))}
        </div>
        <p className="oc-token-rate">1 token = {money(TOKEN_VALUE).replace(".00", "")} · refills Monday</p>
        <p className="oc-token-message">{message}</p>

        <h2>Spent this week</h2>
        {items.length === 0 ? (
          <p className="oc-token-empty">Nothing spent yet.</p>
        ) : (
          <ul className="oc-token-list">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <span>{money(item.amount)} · {formatTokens(Math.round((item.amount / TOKEN_VALUE) * 2) / 2)} {tokenWord(item.amount / TOKEN_VALUE)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="oc-token-stepper">
          <span id="token-budget-label">Weekly amount</span>
          <div role="group" aria-labelledby="token-budget-label">
            <button type="button" aria-label="Lower weekly amount by 5 dollars" disabled={budget <= MIN_WEEKLY_BUDGET} onClick={() => store.setWeeklyBudget(clampBudget(budget - TOKEN_VALUE))}>−</button>
            <output aria-live="polite">{money(budget).replace(".00", "")}</output>
            <button type="button" aria-label="Raise weekly amount by 5 dollars" disabled={budget >= MAX_WEEKLY_BUDGET} onClick={() => store.setWeeklyBudget(clampBudget(budget + TOKEN_VALUE))}>+</button>
          </div>
        </div>
        <button ref={done} type="button" className="oc-button oc-button-primary" onClick={onClose}>Done</button>
        <button className="oc-token-off" type="button" onClick={() => { store.setWeeklyBudget(0); onClose(); }}>
          Turn off weekly tokens
        </button>
      </section>
    </div>
  );
}
