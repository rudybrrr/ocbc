"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PREFERENCES, useStore } from "@/lib/store";
import type { EverydayAction, Mode, TextSize } from "@/lib/types";
import { CuteToken } from "@/components/cute-token";
import { clampBudget, DEFAULT_WEEKLY_BUDGET, MAX_WEEKLY_BUDGET, MIN_WEEKLY_BUDGET, TOKEN_VALUE } from "@/lib/tokens";

const BUDGET_PRESETS = [30, 60, 100];

// One tappable row: the whole row is the label, the control sits on the right like the real app's question lists.
function Row({ type, name, value, checked, disabled, onChange, title, detail, children }: {
  type: "radio" | "checkbox"; name: string; value?: string; checked: boolean; disabled?: boolean;
  onChange: (checked: boolean) => void; title: string; detail?: string; children?: React.ReactNode;
}) {
  return (
    <label className={`ob-row${checked ? " is-on" : ""}${disabled ? " is-off" : ""}`}>
      <span className="ob-row-text">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
        {children}
      </span>
      <input type={type} name={name} value={value} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Hero() {
  return (
    <svg className="ob-art" viewBox="0 0 360 130" aria-hidden="true" focusable="false">
      <ellipse cx="86" cy="96" rx="132" ry="46" fill="#cfe5e0" />
      <ellipse cx="288" cy="104" rx="110" ry="40" fill="#e3e9ef" />
      <circle cx="262" cy="44" r="20" fill="#fff" opacity=".9" /><circle cx="286" cy="52" r="14" fill="#fff" opacity=".9" /><circle cx="244" cy="54" r="12" fill="#fff" opacity=".9" />
      <circle cx="180" cy="66" r="42" fill="#e61e25" />
      <ellipse cx="164" cy="42" rx="17" ry="8" fill="#fff" opacity=".4" transform="rotate(-28 164 42)" />
      <rect x="166" y="48" width="12" height="28" rx="6" fill="#fff" transform="rotate(-18 172 62)" />
      <rect x="188" y="46" width="12" height="28" rx="6" fill="#fff" transform="rotate(-18 194 60)" />
    </svg>
  );
}


export function Onboarding() {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | "">("");
  const [textSize, setTextSize] = useState<TextSize | "">("");
  const [plainLanguage, setPlainLanguage] = useState(true);
  const [offerPerson, setOfferPerson] = useState(true);
  const [readAmounts, setReadAmounts] = useState(false);
  const [everydayActions] = useState<EverydayAction[]>(DEFAULT_PREFERENCES.everydayActions);
  const [idleHelp, setIdleHelp] = useState(false);
  const [budget, setBudget] = useState(DEFAULT_WEEKLY_BUDGET);
  const [budgetOn, setBudgetOn] = useState(true);
  const [customBudget, setCustomBudget] = useState(false);
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
      homeLayout: "classic",
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
        {step > 0 ? (
          <button type="button" className="ob-back" aria-label="Back to the previous question" onClick={() => { setMissing(false); setStep((current) => current - 1); }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        ) : (
          <span className="ob-back-gap" aria-hidden="true" />
        )}
        <Hero />
      </header>

      <div className="ob-body">
        <p className="ob-kicker">Question {step + 1} of {total}</p>
        <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="Setup progress">
          {Array.from({ length: total }, (_, index) => <i key={index} className={index <= step ? "on" : ""} />)}
        </div>

        {id === "mode" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>Pick your home screen</h1>
            {missing && <p className="ob-error" role="alert">Choose one to continue.</p>}
            <fieldset className="ob-list">
              <legend className="sr-only">Assistance mode</legend>
              <Row type="radio" name="mode" value="standard" checked={mode === "standard"} onChange={() => { setMode("standard"); setMissing(false); }} title="Standard" detail="Everything on one screen." />
              <Row type="radio" name="mode" value="guided" checked={mode === "guided"} onChange={() => { setMode("guided"); setMissing(false); }} title="Guided" detail="One step at a time." />
            </fieldset>
          </>
        )}

        {id === "text" && (
          <>
            <h1 id="screen-title" tabIndex={-1}>Choose your text size</h1>
            {missing && <p className="ob-error" role="alert">Choose a size to continue.</p>}
            <div className={`ob-sample sample-${textSize || "default"}`} aria-live="polite">You can use $12,480.35 today.</div>
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
            <h1 id="screen-title" tabIndex={-1}>Track your weekly spending?</h1>
            <p className="ob-lede">See what is left as tokens. It never blocks a payment.</p>
            <div className="ob-tokens" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <CuteToken key={index} state={budgetOn ? "full" : "empty"} size={30} />)}
            </div>
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
            <p className="ob-lede">1 token is S$5.</p>
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
            <p className="ob-lede">Choose any. You can change these later.</p>
            <fieldset className="ob-list">
              <legend className="sr-only">While you bank</legend>
              <Row type="checkbox" name="idleHelp" checked={idleHelp} onChange={setIdleHelp} title="Offer help if I pause" />
              <Row type="checkbox" name="plainLanguage" checked={plainLanguage} onChange={setPlainLanguage} title="Use plain language" />
              <Row type="checkbox" name="offerPerson" checked={offerPerson} onChange={setOfferPerson} title="Offer a person if a payment fails" />
              <Row type="checkbox" name="readAmounts" checked={readAmounts} onChange={setReadAmounts} title="Read amounts aloud" />
            </fieldset>
          </>
        )}
      </div>

      <footer className="ob-foot">
        <button type="submit" className="ob-next">{nextLabel}</button>
        <button type="button" className="ob-skip" onClick={() => store.completeOnboarding(DEFAULT_PREFERENCES)}>Skip setup for now</button>
      </footer>
    </form>
  );
}
