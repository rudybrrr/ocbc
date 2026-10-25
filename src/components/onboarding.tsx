"use client";

import { useEffect, useRef, useState } from "react";
import { useContentMotion } from "@/lib/use-content-motion";
import { DEFAULT_PREFERENCES, useStore } from "@/lib/store";
import type { EverydayAction, Mode, TextSize } from "@/lib/types";
import { CuteToken } from "@/components/cute-token";
import { clampBudget, DEFAULT_WEEKLY_BUDGET, MAX_WEEKLY_BUDGET, MIN_WEEKLY_BUDGET, TOKEN_VALUE } from "@/lib/tokens";

const BUDGET_PRESETS = [30, 60, 100];

// One tappable row: the whole row is the label, the control sits on the right like the real app's question lists.
function Row({ type, name, value, checked, disabled, onChange, title, detail, visual, children }: {
  type: "radio" | "checkbox"; name: string; value?: string; checked: boolean; disabled?: boolean;
  onChange: (checked: boolean) => void; title: string; detail?: string; visual?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <label className={`ob-row${checked ? " is-on" : ""}${disabled ? " is-off" : ""}`}>
      {visual}
      <span className="ob-row-text">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
        {children}
      </span>
      <input type={type} name={name} value={value} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function ModePreview({ guided }: { guided: boolean }) {
  return (
    <svg className="ob-mode-preview" viewBox="0 0 64 80" aria-hidden="true" focusable="false">
      <rect x="5" y="2" width="54" height="76" rx="12" fill="#fff" stroke="#54616b" strokeWidth="2" />
      <path d="M26 8h12" stroke="#54616b" strokeWidth="3" strokeLinecap="round" />
      {guided ? (
        <>
          <circle cx="32" cy="29" r="10" fill="#fce4e4" />
          <path d="m28 29 3 3 6-7" fill="none" stroke="#b71920" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 47h22M25 54h14" stroke="#73808a" strokeWidth="3" strokeLinecap="round" />
          <rect x="16" y="63" width="32" height="7" rx="3.5" fill="#b71920" />
        </>
      ) : (
        <>
          <rect x="14" y="20" width="36" height="15" rx="4" fill="#fce4e4" />
          {[17, 32, 47].map((x) => <circle key={x} cx={x} cy="46" r="4" fill="#73808a" />)}
          <path d="M15 59h34M15 66h24" stroke="#73808a" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Hero() {
  return (
    <div className="ob-brand">
      <svg className="ob-ball" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
        <circle cx="40" cy="40" r="38" fill="#e61e25" />
        <ellipse cx="29" cy="20" rx="13" ry="6.5" fill="#fff" opacity=".4" transform="rotate(-28 29 20)" />
        <rect x="31" y="26" width="9" height="22" rx="4.5" fill="#fff" transform="rotate(-18 35.5 37)" />
        <rect x="47" y="24.5" width="9" height="22" rx="4.5" fill="#fff" transform="rotate(-18 51.5 35.5)" />
      </svg>
      <p className="ob-welcome">Make it yours.</p>
    </div>
  );
}


export function Onboarding() {
  const store = useStore();
  const saved = store.snapshot;
  const [step, setStep] = useState(0);
  const contentRef = useContentMotion<HTMLDivElement>(step);
  const [mode, setMode] = useState<Mode | "">(saved.onboarded ? saved.mode : "");
  const [textSize, setTextSize] = useState<TextSize | "">(saved.onboarded ? saved.textSize : "");
  const [plainLanguage, setPlainLanguage] = useState(saved.plainLanguage);
  const [offerPerson, setOfferPerson] = useState(saved.offerPerson);
  const [readAmounts, setReadAmounts] = useState(saved.readAmounts);
  const [everydayActions] = useState<EverydayAction[]>(saved.everydayActions);
  const [idleHelp, setIdleHelp] = useState(saved.idleHelp);
  const [budget, setBudget] = useState(saved.weeklyBudget || DEFAULT_WEEKLY_BUDGET);
  const [budgetOn, setBudgetOn] = useState(saved.weeklyBudget > 0);
  const [customBudget, setCustomBudget] = useState(saved.weeklyBudget > 0 && !BUDGET_PRESETS.includes(saved.weeklyBudget));
  const [missing, setMissing] = useState(false);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    document.getElementById("screen-title")?.focus();
  }, [step]);

  const finish = () => {
    if (mode === "" || textSize === "") return;
    store.completeOnboarding({
      homeLayout: saved.homeLayout,
      onboarded: true,
      mode,
      textSize,
      plainLanguage,
      offerPerson,
      readAmounts,
      everydayActions,
      idleHelp,
      weeklyBudget: budgetOn ? budget : 0,
    });
  };

  const ids = ["mode", "text", "tokens", ...(budgetOn ? ["amount"] : []), "help"] as const;
  const total = ids.length;
  const id = ids[Math.min(step, total - 1)];
  const last = step >= total - 1;
  const nextLabel = last ? "Open my bank" : "Next";

  return (
    <form
      className="ob"
      method="post"
      action="#setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (id === "mode" && mode === "") { setMissing(true); return; }
        if (id === "text" && textSize === "") { setMissing(true); return; }
        setMissing(false);
        if (last) finish();
        else setStep(step + 1);
      }}
    >
      <header className="ob-hero">
        <div className="ob-topbar">
        {step > 0 ? (
          <button type="button" className="ob-back" aria-label="Back to the previous question" onClick={() => { setMissing(false); setStep((current) => current - 1); }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        ) : (
          <span className="ob-back-gap" aria-hidden="true" />
        )}
        </div>
        <Hero />
      </header>

      <div className="ob-body" ref={contentRef}>
        <p className="ob-kicker">{step + 1} of {total}</p>
        <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="Setup progress">
          {Array.from({ length: total }, (_, index) => <i key={index} className={index <= step ? "on" : ""} />)}
        </div>

        {id === "mode" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How much guidance?</h1>
            {missing && <p className="ob-error" role="alert">Choose one to continue.</p>}
            <fieldset className="ob-list ob-mode-list">
              <legend className="sr-only">Assistance mode</legend>
              <Row type="radio" name="mode" value="standard" checked={mode === "standard"} onChange={() => { setMode("standard"); setMissing(false); }} title="Standard" detail="Explore on your own" visual={<ModePreview guided={false} />} />
              <Row type="radio" name="mode" value="guided" checked={mode === "guided"} onChange={() => { setMode("guided"); setMissing(false); }} title="Guided" detail="One step at a time" visual={<ModePreview guided />} />
            </fieldset>
          </>
        )}

        {id === "text" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>Choose a text size</h1>
            {missing && <p className="ob-error" role="alert">Choose a size to continue.</p>}
            <div className={`ob-sample sample-${textSize || "default"}`} aria-live="polite">Your banking, clearly.</div>
            <fieldset className="ob-list">
              <legend className="sr-only">Text size</legend>
              {([["default", "Default"], ["large", "Large"], ["largest", "Largest"]] as const).map(([value, label]) => (
                <Row key={value} type="radio" name="textSize" value={value} checked={textSize === value} onChange={() => { setTextSize(value); setMissing(false); }} title={label} />
              ))}
            </fieldset>
          </>
        )}

        {id === "tokens" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>Show spending as tokens?</h1>
            <p className="ob-lede">A guide. Payments stay available.</p>
            <div className="ob-tokens" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => <CuteToken key={index} state={index < 4 ? "full" : "empty"} size={38} />)}
            </div>
            <p className="ob-lede">1 token = S$5</p>
            <fieldset className="ob-list">
              <legend className="sr-only">Weekly tokens</legend>
              <Row type="radio" name="tokens" value="on" checked={budgetOn} onChange={() => setBudgetOn(true)} title="Yes, show tokens" />
              <Row type="radio" name="tokens" value="off" checked={!budgetOn} onChange={() => setBudgetOn(false)} title="Not now" />
            </fieldset>
          </>
        )}

        {id === "amount" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How much each week?</h1>
            <p className="ob-lede">Your guide, not an account limit.</p>
            <fieldset className="ob-list">
              <legend className="sr-only">Weekly spending</legend>
              {BUDGET_PRESETS.map((amount) => (
                <Row key={amount} type="radio" name="budget" value={String(amount)} checked={!customBudget && budget === amount} onChange={() => { setCustomBudget(false); setBudget(amount); }} title={`S$${amount}`} detail={`${amount / TOKEN_VALUE} tokens`} />
              ))}
              <Row type="radio" name="budget" value="custom" checked={customBudget} onChange={() => setCustomBudget(true)} title="My own amount" />
              {customBudget && (
                <div className="ob-stepper" role="group" aria-label="Weekly amount">
                  <button type="button" aria-label="Lower weekly amount by 5 dollars" disabled={budget <= MIN_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget - TOKEN_VALUE))}>−</button>
                  <output aria-live="polite">S${budget} · {Math.round(budget / TOKEN_VALUE)} tokens</output>
                  <button type="button" aria-label="Raise weekly amount by 5 dollars" disabled={budget >= MAX_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget + TOKEN_VALUE))}>+</button>
                </div>
              )}
            </fieldset>
          </>
        )}

        {id === "help" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How can we help?</h1>
            <p className="ob-lede">Optional. Change these anytime.</p>
            <fieldset className="ob-list">
              <legend className="sr-only">While you bank</legend>
              <Row type="checkbox" name="idleHelp" checked={idleHelp} onChange={setIdleHelp} title="Offer help if I pause" />
              <Row type="checkbox" name="plainLanguage" checked={plainLanguage} onChange={setPlainLanguage} title="Use plain language" />
              <Row type="checkbox" name="offerPerson" checked={offerPerson} onChange={setOfferPerson} title="Human help if a payment fails" />
              <Row type="checkbox" name="readAmounts" checked={readAmounts} onChange={setReadAmounts} title="Read amounts aloud" />
            </fieldset>
          </>
        )}
      </div>

      <footer className="ob-foot">
        <button type="submit" className="ob-next">{nextLabel}</button>
        <button type="button" className="ob-skip" onClick={() => store.completeOnboarding(saved.onboarded ? saved : DEFAULT_PREFERENCES)}>Set up later</button>
      </footer>
    </form>
  );
}
