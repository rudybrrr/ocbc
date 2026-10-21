import { OcbcButton, SectionCard, SpriteIcon } from "@/components/ocbc-ui";
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
    <div className="oc-transfer-screen">
      <div className="oc-transfer-progress" aria-label="Step 1 of 3">
        <span className="is-current" />
        <span />
        <span />
      </div>
      <SectionCard className="oc-recipient-card" label="PayNow recipient">
        <div className="oc-recipient-topline">
          <span className="oc-recipient-mark">
            <SpriteIcon name="transfer-accent" size={22} />
          </span>
          <span>PayNow</span>
        </div>
        <h2>{name}</h2>
        <p>{phone}</p>
      </SectionCard>

      <SectionCard className="oc-amount-card" label="Payment amount">
        <label htmlFor="oc-amount">How much would you like to send?</label>
        <div className="oc-amount-entry">
          <span aria-hidden="true">S$</span>
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
        </div>
        <p id="oc-daily-limit" className="oc-daily-limit">
          Daily limit remaining <strong>S$1,000.00</strong>
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
          <span>{showNote ? "Remove message" : "Add a message"}</span>
          <span aria-hidden="true">{showNote ? "−" : "+"}</span>
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
      </SectionCard>

      <SectionCard className="oc-from-card" label="Payment source account">
        <div className="oc-from-icon">
          <SpriteIcon name="wallet" size={22} />
        </div>
        <div className="oc-from-copy">
          <small>Paying from</small>
          <strong>360 Account</strong>
          {balanceVisible && <span>{sgd(availableBalance)} available</span>}
        </div>
        <button
          className="oc-balance-toggle"
          type="button"
          onClick={onToggleBalance}
          aria-label={balanceVisible ? "Hide available balance" : "Show available balance"}
        >
          <SpriteIcon name="eye" size={21} />
        </button>
      </SectionCard>

      <p className="oc-safe-note">
        <SpriteIcon name="shield-check" size={17} />
        This is a practice transfer. No money will move.
      </p>
      <OcbcButton
        className="oc-transfer-next"
        data-guide="next"
        type="button"
        disabled={!amountValid}
        onClick={onContinue}
      >
        Review transfer
      </OcbcButton>
    </div>
  );
}
