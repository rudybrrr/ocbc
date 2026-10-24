"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PREFERENCES, useStore } from "@/lib/store";
import { EVERYDAY_ACTIONS, type EverydayAction, type Mode, type TextSize } from "@/lib/types";
import { CuteToken } from "@/components/cute-token";
import { clampBudget, DEFAULT_WEEKLY_BUDGET, MAX_WEEKLY_BUDGET, MIN_WEEKLY_BUDGET, TOKEN_VALUE } from "@/lib/tokens";

const BUDGET_PRESETS = [30, 60, 100];
const LAST_STEP = 4;
const TOTAL = LAST_STEP + 1;

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
  const [everydayActions, setEverydayActions] = useState<EverydayAction[]>(DEFAULT_PREFERENCES.everydayActions);
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
      homeLayout: "calm",
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

  const nextLabel = step === LAST_STEP ? "Open my bank" : "Next";
  const toggleAction = (id: EverydayAction, on: boolean) =>
    setEverydayActions(on ? [...everydayActions, id] : everydayActions.filter((action) => action !== id));

  return (
    <form
      className="ob"
      method="post"
      action="#setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (step === 0) {
          if (mode === "") { setMissing(true); return; }
          setMissing(false);
          setStep(1);
          return;
        }
        if (step === 1) {
          if (textSize === "") { setMissing(true); return; }
          setMissing(false);
          setStep(2);
          return;
        }
        if (step < LAST_STEP) {
          setStep(step + 1);
          return;
        }
        finish();
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
        <p className="ob-kicker" aria-label={`Question ${step + 1} of ${TOTAL}`}>Question {step + 1} of {TOTAL}</p>
        <div className="ob-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1} aria-label="Setup progress">
          {Array.from({ length: TOTAL }, (_, index) => <i key={index} className={index <= step ? "on" : ""} />)}
        </div>

        {step === 0 && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How should your bank look?</h1>
            <p className="ob-lede">Pick a layout to start with. You can switch any time without losing your place. Nothing here is real money.</p>
            {missing && <p className="ob-error" role="alert">Please choose one option to continue.</p>}
            <fieldset className="ob-list">
              <legend className="sr-only">Assistance mode</legend>
              <Row type="radio" name="mode" value="standard" checked={mode === "standard"} onChange={() => { setMode("standard"); setMissing(false); }} title="Standard" detail="Accounts and activity together, like a usual banking home." />
              <Row type="radio" name="mode" value="guided" checked={mode === "guided"} onChange={() => { setMode("guided"); setMissing(false); }} title="Guided" detail="One next step at a time, larger buttons and plainer words." />
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How large should the text be?</h1>
            <p className="ob-lede">The sample uses the size you pick. The rest of the bank will match it.</p>
            {missing && <p className="ob-error" role="alert">Please choose a text size to continue.</p>}
            <div className={`ob-sample sample-${textSize || "default"}`} aria-live="polite">You can use $12,480.35 today.</div>
            <fieldset className="ob-list">
              <legend className="sr-only">Text size</legend>
              {(
                [
                  ["default", "Default", "Usual reading size."],
                  ["large", "Large", "Easier at arm’s length."],
                  ["largest", "Largest", "The biggest text in this demo."],
                ] as const
              ).map(([value, label, detail]) => (
                <Row key={value} type="radio" name="textSize" value={value} checked={textSize === value} onChange={() => { setTextSize(value); setMissing(false); }} title={label} detail={detail} />
              ))}
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <h1 id="screen-title" tabIndex={-1}>What do you do most often?</h1>
            <p className="ob-lede">These become big buttons on your home screen. Choose up to 4. {everydayActions.length} chosen.</p>
            <fieldset className="ob-list">
              <legend className="sr-only">Everyday actions</legend>
              {EVERYDAY_ACTIONS.map(([id, label]) => (
                <Row key={id} type="checkbox" name="everyday" checked={everydayActions.includes(id)} disabled={everydayActions.length >= 4 && !everydayActions.includes(id)} onChange={(on) => toggleAction(id, on)} title={label} />
              ))}
            </fieldset>
          </>
        )}

        {step === 3 && (
          <>
            <h1 id="screen-title" tabIndex={-1}>How much do you want to spend each week?</h1>
            <p className="ob-lede">We turn it into tokens so you can see what is left at a glance. 1 token is S$5. It is only a guide and never stops a payment.</p>
            <div className="ob-tokens" role="img" aria-label={budgetOn ? `${Math.round(budget / TOKEN_VALUE)} tokens a week` : "Weekly tokens are off"}>
              {Array.from({ length: budgetOn ? Math.min(20, Math.round(budget / TOKEN_VALUE)) : 6 }, (_, index) => (
                <CuteToken key={index} state={budgetOn ? "full" : "empty"} size={28} />
              ))}
            </div>
            <fieldset className="ob-list">
              <legend className="sr-only">Weekly spending</legend>
              {BUDGET_PRESETS.map((amount) => (
                <Row key={amount} type="radio" name="budget" value={String(amount)} checked={budgetOn && !customBudget && budget === amount} onChange={() => { setBudgetOn(true); setCustomBudget(false); setBudget(amount); }} title={`S$${amount} a week`} detail={`${amount / TOKEN_VALUE} tokens`} />
              ))}
              <Row type="radio" name="budget" value="custom" checked={budgetOn && customBudget} onChange={() => { setBudgetOn(true); setCustomBudget(true); }} title="My own amount" detail="Pick a number that fits you." />
              {budgetOn && customBudget && (
                <div className="ob-stepper" role="group" aria-label="Weekly amount">
                  <button type="button" aria-label="Lower weekly amount by 5 dollars" disabled={budget <= MIN_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget - TOKEN_VALUE))}>−</button>
                  <output aria-live="polite">S${budget} · {Math.round(budget / TOKEN_VALUE)} tokens</output>
                  <button type="button" aria-label="Raise weekly amount by 5 dollars" disabled={budget >= MAX_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget + TOKEN_VALUE))}>+</button>
                </div>
              )}
              <Row type="radio" name="budget" value="off" checked={!budgetOn} onChange={() => setBudgetOn(false)} title="Not now" detail="You can turn tokens on later from the home screen." />
            </fieldset>
          </>
        )}

        {step === 4 && (
          <>
            <h1 id="screen-title" tabIndex={-1}>What kind of help do you want?</h1>
            <p className="ob-lede">Choose any that suit you. You can change these later in Adjust.</p>
            <fieldset className="ob-list">
              <legend className="sr-only">While you bank</legend>
              <Row type="checkbox" name="idleHelp" checked={idleHelp} onChange={setIdleHelp} title="Offer help if I pause" detail="A gentle prompt if you stay on a screen for a while." />
              <Row type="checkbox" name="plainLanguage" checked={plainLanguage} onChange={setPlainLanguage} title="Plain language" detail="Shorter, simpler explanations." />
              <Row type="checkbox" name="offerPerson" checked={offerPerson} onChange={setOfferPerson} title="Offer a person if a payment fails" detail="A button to reach someone who can help." />
              <Row type="checkbox" name="readAmounts" checked={readAmounts} onChange={setReadAmounts} title="Read amounts aloud" detail="Adds buttons to hear amounts." />
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
