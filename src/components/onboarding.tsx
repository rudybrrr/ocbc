"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_PREFERENCES, useStore } from "@/lib/store";
import type { EverydayAction, Mode, TextSize } from "@/lib/types";
import { EverydayActions } from "@/components/everyday-actions";
import { CuteToken } from "@/components/cute-token";
import { clampBudget, DEFAULT_WEEKLY_BUDGET, MAX_WEEKLY_BUDGET, MIN_WEEKLY_BUDGET, TOKEN_VALUE } from "@/lib/tokens";

const BUDGET_PRESETS = [30, 60, 100];
const LAST_STEP = 4;

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

  return (
    <form
      className="screen setup"
      method="post"
      action="#setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (step === 0) {
          if (mode === "") {
            setMissing(true);
            return;
          }
          setMissing(false);
          setStep(1);
          return;
        }
        if (step === 1) {
          if (textSize === "") {
            setMissing(true);
            return;
          }
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
      <p className="steps">
        <span aria-current={step === 0 ? "step" : undefined}>Mode</span>
        <span aria-current={step === 1 ? "step" : undefined}>Text</span>
        <span aria-current={step === 2 ? "step" : undefined}>Actions</span>
        <span aria-current={step === 3 ? "step" : undefined}>Budget</span>
        <span aria-current={step === 4 ? "step" : undefined}>Help</span>
      </p>
      <ol className="track track-five" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <li key={index} className={index < step ? "done" : index === step ? "now" : ""} />
        ))}
      </ol>

      {step === 0 && (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            How should this bank behave?
          </h1>
          <p className="lede">
            Pick the layout you want to start with. You can switch later without losing your place. Nothing here is real money.
          </p>
          {missing && (
            <p className="error-summary" role="alert">
              Choose Standard or Guided to continue.
            </p>
          )}
          <fieldset>
            <legend>Assistance mode</legend>
            <div className="choice-list">
              <label className="choice">
                <input
                  type="radio"
                  name="mode"
                  value="standard"
                  checked={mode === "standard"}
                  onChange={() => {
                    setMode("standard");
                    setMissing(false);
                  }}
                />
                <span>
                  <strong>Standard</strong>
                  <span>Accounts and activity together, like a usual banking home.</span>
                  <span className="mini" aria-hidden="true">
                    <span className="mini-block" />
                    <span className="mini-row" />
                    <span className="mini-row" />
                  </span>
                </span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="mode"
                  value="guided"
                  checked={mode === "guided"}
                  onChange={() => {
                    setMode("guided");
                    setMissing(false);
                  }}
                />
                <span>
                  <strong>Guided</strong>
                  <span>One next step, larger controls, and plainer explanations.</span>
                  <span className="mini" aria-hidden="true">
                    <span className="mini-coach" />
                    <span className="mini-btn" />
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        </>
      )}

      {step === 1 && (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            How large should the text be?
          </h1>
          <p className="lede">The sample below uses the size you pick. The rest of the bank will match it.</p>
          {missing && (
            <p className="error-summary" role="alert">
              Choose a text size to continue.
            </p>
          )}
          <div className={`preview-pane sample-${textSize || "default"}`} aria-live="polite">
            You can use $12,480.35 today.
          </div>
          <fieldset>
            <legend>Text size</legend>
            <div className="choice-list">
              {(
                [
                  ["default", "Default", "Usual reading size."],
                  ["large", "Large", "Easier at arm’s length."],
                  ["largest", "Largest", "Largest text in this demo."],
                ] as const
              ).map(([value, label, detail]) => (
                <label className="choice" key={value}>
                  <input
                    type="radio"
                    name="textSize"
                    value={value}
                    checked={textSize === value}
                    onChange={() => {
                      setTextSize(value);
                      setMissing(false);
                    }}
                  />
                  <span>
                    <strong>{label}</strong>
                    <span>{detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {step === 2 && (
        <>
          <h1 id="screen-title" tabIndex={-1}>What do you do most often?</h1>
          <EverydayActions value={everydayActions} onChange={setEverydayActions} />
        </>
      )}

      {step === 3 && (
        <>
          <h1 id="screen-title" tabIndex={-1}>How much do you want to spend each week?</h1>
          <p className="lede">We turn it into tokens so you can see what is left at a glance. 1 token is S$5. It is only a guide and never stops a payment.</p>
          <div className="token-setup-preview" role="img" aria-label={budgetOn ? `${Math.round(budget / TOKEN_VALUE)} tokens a week` : "Weekly tokens are off"}>
            {Array.from({ length: budgetOn ? Math.min(20, Math.round(budget / TOKEN_VALUE)) : 6 }, (_, index) => (
              <CuteToken key={index} state={budgetOn ? "full" : "empty"} size={30} />
            ))}
          </div>
          <fieldset>
            <legend>Weekly spending</legend>
            <div className="choice-list">
              {BUDGET_PRESETS.map((amount) => (
                <label className="choice" key={amount}>
                  <input
                    type="radio"
                    name="budget"
                    value={amount}
                    checked={budgetOn && !customBudget && budget === amount}
                    onChange={() => { setBudgetOn(true); setCustomBudget(false); setBudget(amount); }}
                  />
                  <span>
                    <strong>S${amount} a week</strong>
                    <span>{amount / TOKEN_VALUE} tokens</span>
                  </span>
                </label>
              ))}
              <label className="choice">
                <input type="radio" name="budget" value="custom" checked={budgetOn && customBudget} onChange={() => { setBudgetOn(true); setCustomBudget(true); }} />
                <span>
                  <strong>My own amount</strong>
                  <span>Pick a number that fits you.</span>
                </span>
              </label>
              {budgetOn && customBudget && (
                <div className="token-setup-stepper" role="group" aria-label="Weekly amount">
                  <button type="button" className="btn btn-secondary" aria-label="Lower weekly amount by 5 dollars" disabled={budget <= MIN_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget - TOKEN_VALUE))}>−</button>
                  <output aria-live="polite">S${budget} · {Math.round(budget / TOKEN_VALUE)} tokens</output>
                  <button type="button" className="btn btn-secondary" aria-label="Raise weekly amount by 5 dollars" disabled={budget >= MAX_WEEKLY_BUDGET} onClick={() => setBudget(clampBudget(budget + TOKEN_VALUE))}>+</button>
                </div>
              )}
              <label className="choice">
                <input type="radio" name="budget" value="off" checked={!budgetOn} onChange={() => setBudgetOn(false)} />
                <span>
                  <strong>Not now</strong>
                  <span>You can turn tokens on later from the Home screen.</span>
                </span>
              </label>
            </div>
          </fieldset>
        </>
      )}

      {step === 4 && (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            What kind of help do you want?
          </h1>
          <p className="lede">You can change these choices later in Adjust.</p>
          <fieldset>
            <legend>While you bank</legend>
            <label className="check">
              <input
                type="checkbox"
                name="idleHelp"
                checked={idleHelp}
                onChange={(event) => setIdleHelp(event.target.checked)}
              />
              <span>Offer help if I pause on a screen</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="plainLanguage"
                checked={plainLanguage}
                onChange={(event) => setPlainLanguage(event.target.checked)}
              />
              <span>Plain language in explanations</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="offerPerson"
                checked={offerPerson}
                onChange={(event) => setOfferPerson(event.target.checked)}
              />
              <span>Offer a person if a payment fails</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="readAmounts"
                checked={readAmounts}
                onChange={(event) => setReadAmounts(event.target.checked)}
              />
              <span>Buttons to hear amounts</span>
            </label>
          </fieldset>
        </>
      )}

      <div className="row-actions">
        {step > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMissing(false);
              setStep((current) => current - 1);
            }}
          >
            Back
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {step === LAST_STEP ? "Open my bank" : "Continue"}
        </button>
      </div>
      <button type="button" className="btn btn-quiet align-start" onClick={() => store.completeOnboarding(DEFAULT_PREFERENCES)}>
        Skip
      </button>
    </form>
  );
}
