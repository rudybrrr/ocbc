"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { Mode, Preferences, TextSize } from "@/lib/types";

const demo: Preferences = {
  onboarded: true,
  mode: "guided",
  textSize: "large",
  plainLanguage: true,
  offerPerson: true,
  readAmounts: false,
};

export function Onboarding() {
  const store = useStore();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | "">("");
  const [textSize, setTextSize] = useState<TextSize | "">("");
  const [plainLanguage, setPlainLanguage] = useState(true);
  const [offerPerson, setOfferPerson] = useState(true);
  const [readAmounts, setReadAmounts] = useState(false);
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
      onboarded: true,
      mode,
      textSize,
      plainLanguage,
      offerPerson,
      readAmounts,
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
        finish();
      }}
    >
      <p className="steps">
        <span aria-current={step === 0 ? "step" : undefined}>Mode</span>
        <span aria-current={step === 1 ? "step" : undefined}>Text</span>
        <span aria-current={step === 2 ? "step" : undefined}>Help</span>
      </p>
      <ol className="track thirds" aria-hidden="true">
        {[0, 1, 2].map((index) => (
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
          <h1 id="screen-title" tabIndex={-1}>
            What kind of help do you want?
          </h1>
          <p className="lede">These stay on until you change them in Adjust.</p>
          <fieldset>
            <legend>While you bank</legend>
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
          {step === 2 ? "Open my bank" : "Continue"}
        </button>
      </div>
      {step === 0 && (
        <button type="button" className="btn btn-quiet align-start" onClick={() => store.completeOnboarding(demo)}>
          Demo path
        </button>
      )}
    </form>
  );
}
