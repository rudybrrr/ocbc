"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Mode, Preferences, TextSize } from "@/lib/types";

const empty: Preferences = {
  onboarded: true,
  mode: "guided",
  textSize: "large",
  plainLanguage: true,
  offerPerson: true,
  readAmounts: false,
};

export function Onboarding() {
  const store = useStore();
  const [mode, setMode] = useState<Mode | "">("");
  const [textSize, setTextSize] = useState<TextSize | "">("");
  const [plainLanguage, setPlainLanguage] = useState(true);
  const [offerPerson, setOfferPerson] = useState(true);
  const [readAmounts, setReadAmounts] = useState(false);

  return (
    <form
      className="screen setup"
      method="post"
      action="#setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (mode === "" || textSize === "") return;
        store.completeOnboarding({
          onboarded: true,
          mode,
          textSize,
          plainLanguage,
          offerPerson,
          readAmounts,
        });
      }}
    >
      <h1 id="screen-title" tabIndex={-1}>
        How should this bank behave?
      </h1>
      <p className="lede">
        Choose a mode and a text size. You can change both later without losing your place. Nothing here is real money.
      </p>

      <fieldset>
        <legend>Assistance mode</legend>
        <div className="choice-list">
          <label className="choice">
            <input
              type="radio"
              name="mode"
              value="standard"
              required
              checked={mode === "standard"}
              onChange={() => setMode("standard")}
            />
            <span>
              <strong>Standard</strong>
              <span>Accounts, balances, and recent activity on one screen.</span>
            </span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="mode"
              value="guided"
              checked={mode === "guided"}
              onChange={() => setMode("guided")}
            />
            <span>
              <strong>Guided</strong>
              <span>One task at a time, larger controls, and a next step.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Text size</legend>
        <div className="choice-list">
          {(
            [
              ["default", "Default", "Aa"],
              ["large", "Large", "Aa"],
              ["largest", "Largest", "Aa"],
            ] as const
          ).map(([value, label]) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                name="textSize"
                value={value}
                required
                checked={textSize === value}
                onChange={() => setTextSize(value)}
              />
              <span>
                <strong className={`sample sample-${value}`}>{label}</strong>
                <span>{value === "default" ? "Usual reading size." : value === "large" ? "Easier at arm’s length." : "Largest text in this demo."}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

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

      <div className="stack-actions">
        <button type="submit" className="btn btn-primary">
          Open my bank
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => store.completeOnboarding(empty)}
        >
          Demo path
        </button>
      </div>
    </form>
  );
}
