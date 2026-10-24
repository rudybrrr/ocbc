"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons";
import { accountName, balances, DESTINATIONS } from "@/lib/data";
import { sgd } from "@/lib/format";
import { receiptLine, validateMove } from "@/lib/move";
import { useStore } from "@/lib/store";
import type { DestinationId, Transfer } from "@/lib/types";

export function MoveMoney() {
  const store = useStore();
  const { snapshot } = store;
  const money = balances(snapshot.transfers);
  const [error, setError] = useState<{ title: string; recovery: string; field: "amount" | "to"; fill?: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [pending, setPending] = useState<Transfer | null>(null);
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const draftSignature = `${snapshot.draft.from}|${snapshot.draft.to}|${snapshot.draft.amount}|${snapshot.draft.note}`;
  const ready = pending && pendingFor === draftSignature ? pending : null;
  const errorId = useId();
  const guided = snapshot.mode === "guided";
  const destinations = DESTINATIONS.filter((item) => item.id !== snapshot.draft.from);

  const clearError = () => {
    if (error) setError(null);
  };

  if (receipt) {
    return (
      <div className="screen">
        <h1 id="screen-title" tabIndex={-1}>
          Payment recorded
        </h1>
        <p className="lede">{receipt} This is a practice payment. No bank was contacted.</p>
        <div className="stack-actions">
          <button type="button" className="btn btn-primary" onClick={() => store.go("home")}>
            Back to today
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setReceipt(null)}>
            Move more money
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="screen"
      method="post"
      action="#move"
      onSubmit={(event) => {
        event.preventDefault();
        const result = validateMove(snapshot.draft, snapshot.transfers);
        if (!result.ok) {
          setError(result);
          store.setIssue(`${result.title} ${result.recovery}`);
          requestAnimationFrame(() => document.getElementById("move-error")?.focus());
          return;
        }
        setError(null);
        setPendingFor(`${snapshot.draft.from}|${snapshot.draft.to}|${snapshot.draft.amount}|${snapshot.draft.note}`);
        setPending({
          id: crypto.randomUUID(),
          from: snapshot.draft.from,
          to: snapshot.draft.to,
          amount: result.amount,
          note: snapshot.draft.note.trim(),
          at: new Date().toISOString(),
        });
      }}
    >
      <button type="button" className="back" onClick={() => store.go("home")}>
        <Icon name="back" />
        Today
      </button>
      <h1 id="screen-title" tabIndex={-1}>
        Move money
      </h1>
      {guided ? (
        <div className="coach">
          <p>Pick the account, the recipient, then the amount. If the amount is too high, you can fix it on this screen.</p>
          <button type="button" className="btn btn-light" onClick={store.openHelp}>
            Ask about this payment
          </button>
        </div>
      ) : (
        <p className="lede">Practice payments stay on this phone. They do not leave the demo.</p>
      )}

      {error && (
        <div id="move-error" className="error-summary" role="alert" tabIndex={-1}>
          <p className="error-title">
            <Icon name="alert" />
            {error.title}
          </p>
          <p>{error.recovery}</p>
          <div className="row-actions">
            {error.fill && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  store.updateDraft({ amount: error.fill ?? "" });
                  setError(null);
                  store.setIssue(null);
                  document.getElementById("amount")?.focus();
                }}
              >
                Use available
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                store.ask("Why was that payment blocked?");
                store.openHelp();
              }}
            >
              Ask why
            </button>
            {snapshot.offerPerson && (
              <button type="button" className="btn btn-secondary" onClick={store.openPerson}>
                Talk to someone
              </button>
            )}
          </div>
        </div>
      )}

      <fieldset>
        <legend>From</legend>
        <div className="choice-list">
          {(
            [
              ["everyday", "OCBC FRANK Account", money.everyday],
              ["savings", "Savings Account", money.savings],
            ] as const
          ).map(([id, name, available]) => (
            <label className="choice" key={id}>
              <input
                type="radio"
                name="from"
                value={id}
                checked={snapshot.draft.from === id}
                onChange={() => {
                  const to = snapshot.draft.to === id ? firstDestination(id) : snapshot.draft.to;
                  store.updateDraft({ from: id, to });
                  clearError();
                }}
              />
              <span>
                <strong>{name}</strong>
                <span>{sgd(available)} available</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby={error?.field === "to" ? errorId : undefined}>
        <legend>To</legend>
        <div className="choice-list">
          {destinations.map((item) => (
            <label className="choice" key={item.id}>
              <input
                type="radio"
                name="to"
                value={item.id}
                checked={snapshot.draft.to === item.id}
                onChange={() => {
                  store.updateDraft({ to: item.id });
                  clearError();
                }}
              />
              <span>
                <strong>{item.name}</strong>
                <span>{item.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="amount">Amount</label>
        {guided && (
          <p id="amount-hint" className="hint">
            {accountName(snapshot.draft.from)} can cover up to {sgd(money[snapshot.draft.from])}.
          </p>
        )}
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={snapshot.draft.amount}
          aria-invalid={error?.field === "amount" || undefined}
          aria-describedby={
            [guided ? "amount-hint" : "", error?.field === "amount" ? errorId : ""].filter(Boolean).join(" ") ||
            undefined
          }
          onChange={(event) => {
            store.updateDraft({ amount: event.target.value });
            clearError();
          }}
        />
        {error?.field === "amount" && (
          <p id={errorId} className="field-error">
            {error.recovery}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="note">Note, if you want one</label>
        <input
          id="note"
          name="note"
          value={snapshot.draft.note}
          maxLength={40}
          onChange={(event) => store.updateDraft({ note: event.target.value })}
        />
      </div>

      {ready && (
        <div className="confirm-pay" role="region" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Confirm this practice payment</h2>
          <p>
            {receiptLine(
              { from: ready.from, to: ready.to, amount: "", note: ready.note },
              ready.amount,
            )}{" "}
            Nothing leaves this phone, and no bank is contacted.
          </p>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              aria-busy={saving}
              onClick={() => {
                const transfer = ready;
                setSaving(true);
                window.setTimeout(() => {
                  store.submitMove(transfer);
                  setReceipt(
                    receiptLine(
                      { from: transfer.from, to: transfer.to, amount: "", note: transfer.note },
                      transfer.amount,
                    ),
                  );
                  setPending(null);
                  setPendingFor(null);
                  setSaving(false);
                }, 350);
              }}
            >
              {saving ? "Recording…" : "Confirm practice payment"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setPending(null);
                setPendingFor(null);
              }}
              disabled={saving}
            >
              Change it
            </button>
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={saving || ready !== null}>
        Review payment
      </button>
    </form>
  );
}

function firstDestination(from: "everyday" | "savings"): DestinationId {
  return from === "everyday" ? "mum" : "everyday";
}
