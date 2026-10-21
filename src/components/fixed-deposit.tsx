"use client";

import { useState } from "react";
import { OcbcButton, SectionCard, SpriteIcon } from "@/components/ocbc-ui";
import { ACCOUNTS } from "@/lib/data";
import { sgd } from "@/lib/format";
import type { AccountId } from "@/lib/types";

type Stage = "application" | "review" | "success";

export function FixedDepositApplication({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>("application");
  const [amount, setAmount] = useState("1000");
  const [tenure, setTenure] = useState("6 months");
  const [account, setAccount] = useState<AccountId>("everyday");
  const [issue, setIssue] = useState("");
  const [reference, setReference] = useState("");
  const parsedAmount = Number(amount);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount >= 100 && parsedAmount <= 50000;
  const selectedAccount = ACCOUNTS.find((item) => item.id === account);

  if (stage === "success") {
    return (
      <section className="oc-review-screen oc-receipt-screen fd-success">
        <span className="oc-receipt-icon"><SpriteIcon name="check-circle" size={42} /></span>
        <p className="fd-eyebrow">SIMULATION COMPLETE</p>
        <h1>Application simulated</h1>
        <p>Your sample fixed-deposit application {reference} is complete.</p>
        <p className="oc-demo-label">
          No fixed deposit was opened and no money moved. This prototype does not submit a real application.
        </p>
        <OcbcButton onClick={onBack}>Back to Home</OcbcButton>
      </section>
    );
  }

  if (stage === "review") {
    return (
      <section className="oc-review-screen fd-screen">
        <div className="fd-progress" aria-label="Step 2 of 2">
          <span className="is-current" /><span className="is-current" />
        </div>
        <SectionCard className="oc-review-card" label="Fixed-deposit application summary">
          <div className="oc-review-recipient">
            <span className="oc-review-check"><SpriteIcon name="calendar" size={23} /></span>
            <span><small>Fixed-deposit application</small><strong>Review your details</strong></span>
          </div>
          <div className="oc-review-amount"><small>Deposit amount</small><strong>{sgd(parsedAmount)}</strong></div>
          <div className="oc-review-row"><span>Tenure</span><strong>{tenure}</strong></div>
          <div className="oc-review-row"><span>Funding account</span><strong>{selectedAccount?.name}</strong></div>
          <div className="oc-review-row"><span>Interest rate</span><strong>Not quoted in this demo</strong></div>
        </SectionCard>
        <p className="oc-demo-label">
          Demo only. Terms and rates shown by a real bank may differ. Confirming here will not open an account or move money.
        </p>
        {issue && <p className="oc-error" role="alert">{issue}</p>}
        <OcbcButton
          onClick={() => {
            if (!amountValid) {
              setIssue("Enter a sample amount from S$100 to S$50,000.");
              setStage("application");
              return;
            }
            setIssue("");
            setReference(`FD-DEMO-${Math.floor(1000 + Math.random() * 9000)}`);
            setStage("success");
          }}
        >
          Confirm simulated application
        </OcbcButton>
        <OcbcButton variant="secondary" onClick={() => setStage("application")}>
          Change details
        </OcbcButton>
      </section>
    );
  }

  return (
    <section className="fd-screen">
      <div className="fd-progress" aria-label="Step 1 of 2">
        <span className="is-current" /><span />
      </div>
      <SectionCard className="fd-intro-card" label="Fixed deposit information">
        <div className="fd-intro-icon"><SpriteIcon name="calendar" size={24} /></div>
        <div>
          <h2>Choose your sample deposit</h2>
          <p>Explore how an application might look. This demo does not provide a live rate or open an account.</p>
        </div>
      </SectionCard>
      <SectionCard className="oc-amount-card fd-form-card" label="Sample fixed-deposit details">
        <label htmlFor="fd-amount">Deposit amount</label>
        <div className="oc-amount-entry">
          <span aria-hidden="true">S$</span>
          <input
            id="fd-amount"
            type="number"
            inputMode="decimal"
            min="100"
            max="50000"
            step="100"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setIssue("");
            }}
            aria-invalid={issue ? "true" : undefined}
            aria-describedby={issue ? "fd-error" : "fd-hint"}
          />
        </div>
        <p id="fd-hint" className="oc-daily-limit">Choose S$100 to S$50,000 for this simulation.</p>
        <label className="fd-label" htmlFor="fd-tenure">Tenure</label>
        <select id="fd-tenure" value={tenure} onChange={(event) => setTenure(event.target.value)}>
          {["3 months", "6 months", "12 months", "24 months"].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <label className="fd-label" htmlFor="fd-account">Funding account</label>
        <select
          id="fd-account"
          value={account}
          onChange={(event) => setAccount(event.target.value as AccountId)}
        >
          {ACCOUNTS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
        {issue && <p id="fd-error" className="oc-inline-error" role="alert">{issue}</p>}
      </SectionCard>
      <p className="oc-demo-label">Illustrative application only. No real banking details are requested or submitted.</p>
      <OcbcButton
        className="fd-primary-action"
        disabled={!amountValid}
        onClick={() => {
          if (!amountValid) {
            setIssue("Enter a sample amount from S$100 to S$50,000.");
            return;
          }
          setIssue("");
          setStage("review");
        }}
      >
        Review application
      </OcbcButton>
      <OcbcButton variant="secondary" onClick={onBack}>Cancel and return Home</OcbcButton>
    </section>
  );
}
