import { useEffect, useRef } from "react";
import { OcbcButton, SpriteIcon } from "@/components/ocbc-ui";
import { sgd } from "@/lib/format";

export function TransferForm({
  name,
  phone,
  amount,
  amountValid,
  note,
  showNote,
  availableBalance,
  balanceVisible,
  issue,
  onAmountChange,
  onNoteChange,
  onToggleNote,
  onToggleBalance,
  onContinue,
}: {
  name: string;
  phone: string;
  amount: string;
  amountValid: boolean;
  note: string;
  showNote: boolean;
  availableBalance: number;
  balanceVisible: boolean;
  issue: string;
  onAmountChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onToggleNote: () => void;
  onToggleBalance: () => void;
  onContinue: () => void;
}) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  // on short screens the error sits below the fold, so bring it into view when it appears
  useEffect(() => {
    if (issue) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [issue]);
  return (
    <div className="oc-transfer-screen oc-pay-real">
      <section className="oc-payto" aria-label="PayNow recipient">
        <p>Pay to</p>
        <h2>{name}</h2>
        <span>{phone}</span>
      </section>

      <section className="oc-amount-real" aria-label="Payment amount">
        <label className="oc-sr" htmlFor="oc-amount">How much would you like to send?</label>
        <div className="oc-amount-entry">
          <span className="oc-amount-field">
            <span className="oc-amount-sizer" aria-hidden="true">{amount || "0.00"}</span>
            <input
              id="oc-amount"
              data-guide="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              aria-invalid={issue ? "true" : undefined}
              aria-describedby={issue ? "oc-payment-error" : "oc-daily-limit"}
            />
          </span>
          <span className="oc-amount-currency" aria-hidden="true">SGD</span>
        </div>
        <p id="oc-daily-limit" className="oc-daily-limit">
          Daily limit remaining: <strong>1,000.00 SGD</strong>
        </p>
        <button
          className="oc-add-note"
          type="button"
          aria-expanded={showNote}
          onClick={onToggleNote}
        >
          {showNote ? "Remove message" : "Add a message"}
        </button>
        {showNote && (
          <div className="oc-note-field">
            <label htmlFor="oc-message">Message (optional)</label>
            <input
              id="oc-message"
              value={note}
              maxLength={140}
              placeholder="Add a note for your recipient"
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </div>
        )}
      </section>

      <section className="oc-from-real" aria-label="Payment source account">
        <p>From</p>
        <strong>OCBC FRANK Account</strong>
        <span>•••-••••••-•••</span>
        {balanceVisible && <span className="oc-from-balance">{sgd(availableBalance)} available</span>}
        {issue ? (
          <p id="oc-payment-error" ref={errorRef} className="oc-pay-error" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4.5M12 17.2v.1" /></svg>
            <span>{issue}</span>
          </p>
        ) : (
          <button className="oc-balance-toggle" type="button" onClick={onToggleBalance}>
            <SpriteIcon name="eye" size={22} />
            {balanceVisible ? "Hide available balance" : "Show available balance"}
          </button>
        )}
      </section>

      <p className="oc-safe-note">This is a practice transfer. No money will move.</p>
      <OcbcButton
        className="oc-transfer-next"
        data-guide="next"
        type="button"
        disabled={!amountValid}
        onClick={onContinue}
      >
        Next
      </OcbcButton>
    </div>
  );
}
