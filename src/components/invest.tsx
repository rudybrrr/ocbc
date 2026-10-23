"use client";

import { OcbcButton } from "@/components/ocbc-ui";
import { JourneyHelp } from "@/components/journey-guidance";
import { useStore } from "@/lib/store";

const LABELS = ["Before you begin", "Key terms", "Fees", "Risks", "Review", "Confirm"];
const TARGETS = ["invest-intro", "invest-terms", "invest-fees", "invest-risks", "invest-review", "invest-confirm"];

export function Invest() {
  const store = useStore();
  const { invest, plainLanguage: plain } = store.snapshot;
  const step = invest.step;

  if (invest.done) return (
    <section className="fd-screen">
      <h2 id="screen-title" tabIndex={-1}>Investing process completed</h2>
      <p>Your progress is saved on this device. No product, amount or allocation was selected, and no money moved.</p>
      <OcbcButton onClick={() => store.go("home")}>Back to Home</OcbcButton>
      <OcbcButton variant="secondary" onClick={store.clearPlan}>Read the process again</OcbcButton>
      <JourneyHelp />
    </section>
  );

  return (
    <section className="fd-screen">
      <p className="oc-demo-label">Step {step + 1} of {LABELS.length} · {LABELS[step]}</p>
      <h2 id="screen-title" tabIndex={-1}>{LABELS[step]}</h2>
      {step === 0 ? <>
        <p>You are about to walk through the investing process: read the terms, check fees and risks, then review before confirming.</p>
        <p>This demo saves your place only. It does not select a product, amount or allocation, open an investment account or place an order.</p>
      </> : step === 1 ? <dl>
        <dt>Units</dt><dd>{plain ? "Your portions of a fund. Their price can go up or down." : "Units represent holdings in a pooled investment; their value changes with the fund's assets."}</dd>
        <dt>Dealing price</dt><dd>{plain ? "The price used when buying or selling. You may not know the final price when you place an order." : "The execution price may be determined at a subsequent valuation point."}</dd>
        <dt>Settlement</dt><dd>{plain ? "The time it takes for payment and ownership to be completed." : "The completion of payment and delivery after a transaction."}</dd>
      </dl> : step === 2 ? <>
        <p>{plain ? "Check what you pay to buy, hold and sell before placing an order." : "Review subscription, ongoing management, platform and redemption charges before submitting an order."}</p>
        <p>Some fees are deducted from the investment; others may be charged separately. Currency conversion may also cost money.</p>
        <p>No product is selected here, so no fee is quoted. Read the specific fee schedule in a real application.</p>
      </> : step === 3 ? <>
        <p>{plain ? "The value can fall. You could get back less than you put in. Returns are not guaranteed." : "Capital is at risk. Market movements can cause losses, and past performance does not guarantee future returns."}</p>
        <p>Currency movements can affect value. Selling may take time, and access to your money may be restricted.</p>
        <p>Read the product documents for its risks and withdrawal conditions. Ask a person if anything is unclear.</p>
      </> : step === 4 ? <>
        <p>You have reached the review: check the terms, fees, risks and any details you enter in a real application before confirming.</p>
        <p>No product, amount or allocation has been selected in this process. You can go back to read each step.</p>
        <p className="disclaimer">This is not financial advice.</p>
        <p>Continuing opens the final confirmation. It does not place an order.</p>
      </> : <>
        <p>Confirm that you want to mark this process as completed and save your progress on this device.</p>
        <p>No investment order will be submitted and no money will move.</p>
      </>}
      {step > 0 && <OcbcButton variant="secondary" onClick={() => store.setInvestStep(step - 1)}>Back</OcbcButton>}
      <OcbcButton data-guide={TARGETS[step]} onClick={() => step === 5 ? store.completeInvest() : store.setInvestStep(step + 1)}>
        {step === 5 ? "Confirm process completion" : "Continue"}
      </OcbcButton>
      <JourneyHelp />
    </section>
  );
}
