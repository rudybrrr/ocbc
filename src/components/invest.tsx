"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { SAMPLE_FUND } from "@/lib/data";
import { sgd } from "@/lib/format";
import { useStore } from "@/lib/store";

const STEPS = [
  {
    title: "A unit trust, in plain words",
    plain: "A unit trust pools money from many people and buys a mix of investments. You own units of that mix. The price of a unit can go up or down.",
    full: "A unit trust is a pooled fund. The manager buys the mix described in the fund documents, and you own units of that pool. The unit price moves with the mix, so it can fall as well as rise.",
  },
  {
    title: "What can go wrong",
    plain: "If the mix falls in value, your units are worth less. You might get back less than you put in. Money you need soon should stay in Everyday Account.",
    full: "Market prices move. A fall means the units are worth less than you paid, and selling then locks that in. Time horizon matters: money needed soon is a poor fit for a fund that can drop.",
  },
  {
    title: `A sample mix: ${SAMPLE_FUND}`,
    plain: "This fictional sample is 60% bonds and 40% shares. Bonds are loans. Shares are slices of companies. It shows the shape of a balanced fund. It is not a pick for you.",
    full: "Horizon Balanced is a fictional sample: 60% bonds, 40% shares. Bonds are loans to governments and companies. Shares are ownership in companies. The split is here so you can see a balanced mix. It is not a recommendation.",
  },
] as const;

export function Invest() {
  const store = useStore();
  const { snapshot } = store;
  const plain = snapshot.plainLanguage;
  const [reviewing, setReviewing] = useState(false);
  const step = snapshot.invest.step;
  const showSummary = snapshot.invest.done && !reviewing;

  return (
    <div className="screen">
      <button type="button" className="back" onClick={() => store.go("home")}>
        <Icon name="back" />
        Today
      </button>
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
      ) : step < STEPS.length ? (
        <article>
          <p className="step-count">Screen {step + 1} of 4</p>
          <h1 id="screen-title" tabIndex={-1}>
            {STEPS[step].title}
          </h1>
          <p className="lede">{plain ? STEPS[step].plain : STEPS[step].full}</p>
          <p className="disclaimer">Educational only. Not personal financial advice, and not an offer to invest.</p>
          <div className="row-actions">
            {step > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => store.setInvestStep(step - 1)}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => store.setInvestStep(step + 1)}>
              Continue
            </button>
          </div>
        </article>
      ) : (
        <PlanStep
          selected={snapshot.invest.monthly}
          onSave={(monthly) => {
            store.savePlan(monthly);
            setReviewing(false);
          }}
          onBack={() => store.setInvestStep(STEPS.length - 1)}
        />
      )}
    </div>
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
      <p className="step-count">Screen 4 of 4</p>
      <h1 id="screen-title" tabIndex={-1}>
        Save a practice amount
      </h1>
      <p className="lede">
        Pick a monthly figure for the sample {SAMPLE_FUND} mix. This writes a plan on this phone. It does not invest money.
      </p>
      {missing && (
        <p id="plan-error" className="error-summary" role="alert" tabIndex={-1}>
          Choose $50, $100, or $200 a month to save the practice plan.
        </p>
      )}
      <fieldset>
        <legend>Practice amount each month</legend>
        <div className="choice-list">
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
                <span>{value === 50 ? "A small practice figure." : value === 100 ? "A middle practice figure." : "A larger practice figure."}</span>
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
      <p className="lede">
        {monthly ? sgd(monthly) : "A figure"} a month into the sample {SAMPLE_FUND} mix, stored on this phone. No money moved.
      </p>
      <dl className="plan">
        <div>
          <dt>Sample mix</dt>
          <dd>{SAMPLE_FUND}, 60% bonds and 40% shares</dd>
        </div>
        <div>
          <dt>What this is</dt>
          <dd>A learning plan. Not a recommendation and not an investment.</dd>
        </div>
      </dl>
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
