"use client";

import { useState } from "react";
import { OcbcButton, SectionCard, SpriteIcon } from "@/components/ocbc-ui";
import { JourneyHelp } from "@/components/journey-guidance";
import { ACCOUNTS } from "@/lib/data";
import { FIXED_DEPOSIT, validFixedDeposit } from "@/lib/fixed-deposit-data";
import { sgd } from "@/lib/format";
import { useStore } from "@/lib/store";

const LABELS = ["What it is", "Tenor options", "Early withdrawal", "Review", "Confirm"];

export function FixedDepositApplication() {
  const store = useStore();
  const { fixedDeposit: draft, plainLanguage: plain } = store.snapshot;
  const guided = store.journeyGuidance === true;
  const { step, amount, tenor, account, reference } = draft;
  const [issue, setIssue] = useState("");
  const valid = validFixedDeposit(draft);
  const term = FIXED_DEPOSIT.tenors.find((option) => option.id === tenor);
  const selectedAccount = ACCOUNTS.find((item) => item.id === account);
  const bounds = `${sgd(FIXED_DEPOSIT.minimum)} to ${sgd(FIXED_DEPOSIT.maximum)}`;
  const advance = (next: number) => {
    if (step > 0 && !valid) {
      setIssue(`Enter an amount from ${bounds} and choose a tenor and funding account.`);
      store.updateFixedDeposit({ step: 1 });
      return;
    }
    setIssue("");
    store.updateFixedDeposit({ step: next });
  };

  if (reference) return (
    <section className="oc-review-screen oc-receipt-screen fd-success">
      <span className="oc-receipt-icon"><SpriteIcon name="check-circle" size={42} /></span>
      <h2 id="screen-title" tabIndex={-1}>Application simulated</h2>
      <p>Your sample fixed-deposit application {reference} is complete.</p>
      <p className="oc-demo-label">No fixed deposit was opened and no money moved. This prototype does not submit a real application.</p>
      <OcbcButton onClick={() => store.go("home")}>Back to Home</OcbcButton>
    </section>
  );

  return (
    <section className="fd-screen">
      {guided && <p className="oc-demo-label">Step {step + 1} of {LABELS.length} · {LABELS[step]}</p>}
      <h2 id="screen-title" tabIndex={-1}>{LABELS[step]}</h2>
      {step === 0 ? <>
        <p>{plain ? "A fixed deposit holds your money with a bank for a time you choose. That time is called the tenor. Maturity is when that time ends." : "A fixed deposit places funds for an agreed tenor until a maturity date, subject to the deposit terms."}</p>
        <p>You will enter your own amount, choose a tenor, read the early-withdrawal conditions and review before confirming a simulation.</p>
        <p>Interest rate: {FIXED_DEPOSIT.rateLabel}. Sample amount range: {bounds}.</p>
        <OcbcButton data-guide="fd-intro" onClick={() => advance(1)}>Continue</OcbcButton>
      </> : step === 1 ? <>
        <SectionCard className="oc-amount-card fd-form-card" label="Sample fixed-deposit details">
          <label htmlFor="fd-amount">Deposit amount</label>
          <div className="oc-amount-entry">
            <span aria-hidden="true">S$</span>
            <input id="fd-amount" type="number" inputMode="decimal" min={FIXED_DEPOSIT.minimum} max={FIXED_DEPOSIT.maximum} step="any"
              value={amount} onChange={(event) => { store.updateFixedDeposit({ amount: event.target.value }); setIssue(""); }}
              aria-invalid={issue ? true : undefined} aria-describedby="fd-hint" />
          </div>
          <p id="fd-hint" className="oc-daily-limit">Choose {bounds} for this simulation.</p>
          <label className="fd-label" htmlFor="fd-tenure">Tenor</label>
          <select id="fd-tenure" data-guide="fd-tenor" value={tenor} onChange={(event) => { store.updateFixedDeposit({ tenor: event.target.value }); setIssue(""); }}>
            <option value="">Choose a tenor</option>
            {FIXED_DEPOSIT.tenors.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <p>{plain ? "Tenor means how long the deposit stays in place. Choose for yourself; none is suggested." : "Select the contractual deposit term. No tenor is recommended."}</p>
          <p>Interest rate: {FIXED_DEPOSIT.rateLabel}.</p>
          <label className="fd-label" htmlFor="fd-account">Funding account</label>
          <select id="fd-account" value={account} onChange={(event) => {
            if (event.target.value === "everyday" || event.target.value === "savings") store.updateFixedDeposit({ account: event.target.value });
          }}>
            {ACCOUNTS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
        </SectionCard>
        <OcbcButton disabled={!valid} onClick={() => advance(guided ? 2 : 3)}>{guided ? "Continue" : "Review application"}</OcbcButton>
        {guided && <OcbcButton variant="secondary" onClick={() => store.updateFixedDeposit({ step: 0 })}>Back</OcbcButton>}
      </> : step === 2 ? <>
        <p>{plain ? "Taking money out before the tenor ends may not be allowed. If it is allowed, you may lose some or all of the interest." : "Premature withdrawal may be restricted and may reduce or forfeit accrued interest."}</p>
        <p>Check the deposit terms for withdrawal charges, fees and when funds would be returned. No fees are quoted in this demo.</p>
        <p>While the money is locked away, you may be unable to use it. A fixed rate also stays unchanged if other rates rise. Inflation can reduce what the money can buy.</p>
        <OcbcButton data-guide="fd-withdrawal" onClick={() => advance(3)}>Continue to review</OcbcButton>
        <OcbcButton variant="secondary" onClick={() => store.updateFixedDeposit({ step: 1 })}>Back</OcbcButton>
      </> : <>
        <SectionCard className="oc-review-card" label="Fixed-deposit application summary">
          <h3>{step === 3 ? "Review your details" : "Confirm your simulation"}</h3>
          <div className="oc-review-amount"><small>Deposit amount</small><strong>{sgd(Number(amount))}</strong></div>
          <div className="oc-review-row"><span>Tenor</span><strong>{term?.label ?? "Not selected"}</strong></div>
          <div className="oc-review-row"><span>Funding account</span><strong>{selectedAccount?.name ?? "Not selected"}</strong></div>
          <div className="oc-review-row"><span>Interest rate</span><strong>{FIXED_DEPOSIT.rateLabel}</strong></div>
        </SectionCard>
        <p>Early withdrawal may be restricted or reduce or remove interest. Check the actual terms and charges before a real application.</p>
        <p className="oc-demo-label">Demo only. Confirming here will not open an account or move money. This is not financial advice.</p>
        <OcbcButton data-guide={step === 3 ? "fd-review" : "fd-confirm"} disabled={!valid} onClick={() => {
          if (step === 3) advance(4);
          else if (valid) store.completeFixedDeposit();
        }}>{step === 3 ? "Continue to confirmation" : "Confirm simulated application"}</OcbcButton>
        <OcbcButton variant="secondary" onClick={() => store.updateFixedDeposit({ step: step === 4 ? 3 : 1 })}>{step === 4 ? "Back to review" : "Change details"}</OcbcButton>
      </>}
      {issue && <p className="oc-error" role="alert">{issue}</p>}
      <JourneyHelp />
    </section>
  );
}
