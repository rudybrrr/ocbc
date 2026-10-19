"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SAMPLE_FUND } from "@/lib/data";
import { sgd } from "@/lib/format";
import { useStore } from "@/lib/store";

const PEOPLE = ["Aisha", "Ben", "Mei", "Omar"] as const;
const LABELS = ["Pool", "Risk", "Mix", "Plan"] as const;

export function Invest() {
  const store = useStore();
  const { snapshot } = store;
  const plain = snapshot.plainLanguage;
  const guided = snapshot.mode === "guided";
  const [reviewing, setReviewing] = useState(false);
  const step = snapshot.invest.step;
  const showSummary = snapshot.invest.done && !reviewing;
  const screen = showSummary ? 3 : Math.min(step, 3);

  return (
    <div className="screen">
      <button type="button" className="back" onClick={() => store.go("home")}>
        <Icon name="back" />
        Today
      </button>
      <p className="steps">
        {LABELS.map((label, index) => (
          <span key={label} aria-current={index === screen ? "step" : undefined}>
            {label}
          </span>
        ))}
      </p>
      <ol className="track" aria-label="Walk progress">
        {LABELS.map((label, index) => (
          <li key={label} className={index < screen ? "done" : index === screen ? "now" : ""}>
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>
      {guided && !showSummary && (
        <p className="lede">This is a lesson. Leave and come back whenever you want. No money moves.</p>
      )}
      {showSummary ? (
        <Summary
          monthly={snapshot.invest.monthly}
          onReview={() => {
            setReviewing(true);
            store.setInvestStep(0);
          }}
          onClear={() => {
            store.clearPlan();
            setReviewing(false);
          }}
          onHome={() => store.go("home")}
          onPerson={store.openPerson}
        />
      ) : step === 0 ? (
        <PoolStep plain={plain} onNext={() => store.setInvestStep(1)} />
      ) : step === 1 ? (
        <RiskStep plain={plain} onBack={() => store.setInvestStep(0)} onNext={() => store.setInvestStep(2)} />
      ) : step === 2 ? (
        <MixStep plain={plain} onBack={() => store.setInvestStep(1)} onNext={() => store.setInvestStep(3)} />
      ) : (
        <PlanStep
          selected={snapshot.invest.monthly}
          onSave={(monthly) => {
            store.savePlan(monthly);
            setReviewing(false);
          }}
          onBack={() => store.setInvestStep(2)}
        />
      )}
    </div>
  );
}

function PoolStep({ plain, onNext }: { plain: boolean; onNext: () => void }) {
  const [person, setPerson] = useState<(typeof PEOPLE)[number] | "">("");

  return (
    <article>
      <h1 id="screen-title" tabIndex={-1}>
        Many people, one pool
      </h1>
      <p className="lede">
        {plain
          ? "Tap a person. Their money joins the same pool, and they receive units of that pool."
          : "A unit trust pools contributions. Tap a person to see their money become units in the pool."}
      </p>
      <div className="pool">
        {PEOPLE.map((name) => (
          <button
            key={name}
            type="button"
            className="person"
            aria-pressed={person === name}
            onClick={() => setPerson(name)}
          >
            {name}
          </button>
        ))}
        <div className="pot">{person ? `${person}'s money is in the pool` : "The pool"}</div>
      </div>
      <p className="disclaimer">
        {person
          ? `${person} would own units, not a private pile of the underlying investments. The unit price can rise or fall.`
          : "Educational only. Not personal financial advice, and not an offer to invest."}
      </p>
      <button type="button" className="btn btn-primary" onClick={onNext}>
        Continue
      </button>
    </article>
  );
}

function RiskStep({
  plain,
  onBack,
  onNext,
}: {
  plain: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const [when, setWhen] = useState<"soon" | "year" | "later" | "">("");
  const copy = {
    soon: "Money needed soon is a poor fit for a fund that can fall. Everyday Account is the place for that.",
    year: "A year can still be a short time. The sample mix can be down when you need it.",
    later: "Several years gives a fall more time to recover. It still can be worth less than you put in.",
  } as const;

  return (
    <article>
      <h1 id="screen-title" tabIndex={-1}>
        When would you need it?
      </h1>
      <p className="lede">
        {plain
          ? "The same fund is a better or worse fit depending on when you need the money."
          : "Time horizon changes the risk. Choose one and read what that means for a fund that can fall."}
      </p>
      <div
        className="meter"
        data-level={when || "none"}
        role="img"
        aria-label={
          when
            ? `Lesson only. A fund that can fall is a poorer fit when the money is needed ${when === "soon" ? "soon" : when === "year" ? "this year" : "in several years"}. Not a score for you.`
            : "Lesson only. Not a risk score and not a suggestion to invest."
        }
      >
        <span />
      </div>
      <p className="disclaimer">This bar is a lesson about timing. It is not a risk score and not a suggestion to invest.</p>
      <fieldset>
        <legend>Need the money</legend>
        <div className="choice-list">
          {(
            [
              ["soon", "Soon"],
              ["year", "This year"],
              ["later", "In several years"],
            ] as const
          ).map(([value, label]) => (
            <label className="choice" key={value}>
              <input type="radio" name="horizon" checked={when === value} onChange={() => setWhen(value)} />
              <span>
                <strong>{label}</strong>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="disclaimer" aria-live="polite">
        {when ? copy[when] : "Choose one. This is a general explanation, not advice for you."}
      </p>
      <div className="row-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </article>
  );
}

function MixStep({
  plain,
  onBack,
  onNext,
}: {
  plain: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const [part, setPart] = useState<"bonds" | "shares" | "">("");

  return (
    <article>
      <h1 id="screen-title" tabIndex={-1}>
        Sample mix: {SAMPLE_FUND}
      </h1>
      <p className="lede">
        {plain
          ? "This fictional sample is 60% bonds and 40% shares. Tap a part to see what it is."
          : "Horizon Balanced is fictional. Tap bonds or shares to read what that slice means."}
      </p>
      <div className="mix" aria-label="60 percent bonds and 40 percent shares">
        <button
          type="button"
          className="mix-bonds"
          aria-pressed={part === "bonds"}
          aria-label="Bonds, 60 percent"
          onClick={() => setPart("bonds")}
        >
          Bonds
        </button>
        <button
          type="button"
          className="mix-shares"
          aria-pressed={part === "shares"}
          aria-label="Shares, 40 percent"
          onClick={() => setPart("shares")}
        >
          Shares
        </button>
      </div>
      <p className="disclaimer">
        {part === "bonds"
          ? "Bonds are loans to governments and companies. They can still fall in price."
          : part === "shares"
            ? "Shares are slices of companies. Their prices move more than bonds."
            : "Tap the bar. This mix is for learning. It is not a pick for you."}
      </p>
      <div className="row-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </article>
  );
}

function PlanStep({
  selected,
  onSave,
  onBack,
}: {
  selected: 50 | 100 | 200 | null;
  onSave: (monthly: 50 | 100 | 200) => void;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState<50 | 100 | 200 | "">(selected ?? "");
  const [missing, setMissing] = useState(false);
  const months = amount === "" ? 0 : 12;

  return (
    <form
      method="post"
      action="#plan"
      onSubmit={(event) => {
        event.preventDefault();
        if (amount === "") {
          setMissing(true);
          document.getElementById("plan-error")?.focus();
          return;
        }
        onSave(amount);
      }}
    >
      <h1 id="screen-title" tabIndex={-1}>
        Save a practice amount
      </h1>
      <p className="lede">Each block is one month. The figure is stored on this phone. It does not invest money.</p>
      <div className={`year-strip${amount === "" ? "" : ` amt-${amount}`}`} aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className={index < months ? "on" : ""} />
        ))}
      </div>
      <p className="row-detail">{amount === "" ? "Choose a monthly figure." : `${sgd(amount)} × 12 months, practice only.`}</p>
      {missing && (
        <p id="plan-error" className="error-summary" role="alert" tabIndex={-1}>
          Choose $50, $100, or $200 a month to save the practice plan.
        </p>
      )}
      <fieldset>
        <legend>Practice amount each month</legend>
        <div className="amount-picks">
          {([50, 100, 200] as const).map((value) => (
            <label className="choice" key={value}>
              <input
                type="radio"
                name="monthly"
                value={value}
                checked={amount === value}
                onChange={() => {
                  setAmount(value);
                  setMissing(false);
                }}
                required
              />
              <span>
                <strong>{sgd(value)} a month</strong>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="disclaimer">Educational only. Not personal financial advice, and not an offer to invest.</p>
      <div className="row-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Save practice plan
        </button>
      </div>
    </form>
  );
}

function Summary({
  monthly,
  onReview,
  onClear,
  onHome,
  onPerson,
}: {
  monthly: 50 | 100 | 200 | null;
  onReview: () => void;
  onClear: () => void;
  onHome: () => void;
  onPerson: () => void;
}) {
  return (
    <article>
      <h1 id="screen-title" tabIndex={-1}>
        Practice plan saved
      </h1>
      <div className="plan-card">
        <p className="statement-amount">{monthly ? sgd(monthly) : "—"}</p>
        <p>a month into the sample {SAMPLE_FUND} mix</p>
        <div className="mix" aria-hidden="true">
          <span className="mix-bonds">Bonds</span>
          <span className="mix-shares">Shares</span>
        </div>
        <p>Stored on this phone. No money moved. Not a recommendation.</p>
      </div>
      <div className="stack-actions">
        <button type="button" className="btn btn-primary" onClick={onHome}>
          Back to today
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReview}>
          Read it again
        </button>
        <button type="button" className="btn btn-secondary" onClick={onPerson}>
          Talk to a person
        </button>
        <button type="button" className="btn btn-quiet align-start" onClick={onClear}>
          Clear practice plan
        </button>
      </div>
    </article>
  );
}
