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
  return (
    <div className="oc-transfer-screen oc-pay-real">
      <section className="oc-payto" aria-label="PayNow recipient">
        <p>Pay to</p>
        <h2>{phone}</h2>
        <span>{name}</span>
      </section>

      <section className="oc-amount-real" aria-label="Payment amount">
        <label className="oc-sr" htmlFor="oc-amount">How much would you like to send?</label>
        <div className="oc-amount-entry">
          <input
            id="oc-amount"
            data-guide="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            style={{ width: `${Math.max(4, amount.length + 1)}ch` }}
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            aria-invalid={issue ? "true" : undefined}
            aria-describedby={issue ? "oc-payment-error" : "oc-daily-limit"}
          />
          <span aria-hidden="true">SGD</span>
        </div>
        <p id="oc-daily-limit" className="oc-daily-limit">
          Daily limit remaining: <strong>1,000.00 SGD</strong>
        </p>
        {issue && (
          <p id="oc-payment-error" className="oc-inline-error" role="alert">
            {issue}
          </p>
        )}
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
        <button className="oc-balance-toggle" type="button" onClick={onToggleBalance}>
          <SpriteIcon name="eye" size={22} />
          {balanceVisible ? "Hide available balance" : "Show available balance"}
        </button>
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
