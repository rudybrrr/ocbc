"use client";

import { activity, CARD, CUSTOMER } from "@/lib/data";
import { sgd, spokenSgd } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/icons";

function hear(text: string) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-SG";
  window.speechSynthesis.speak(utterance);
  return true;
}

export function Home() {
  const store = useStore();
  const { snapshot, balances } = store;
  const guided = snapshot.mode === "guided";
  const rows = activity(snapshot.transfers).slice(0, guided ? 2 : 5);
  const plan = snapshot.invest.done ? snapshot.invest.monthly : null;

  const walkLabel = plan
    ? "View practice plan"
    : snapshot.invest.step > 0
      ? "Continue the walk"
      : "Start the walk";

  return (
    <div className="screen">
      {guided ? (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            {CUSTOMER.split(" ")[0]}, you can use{" "}
            <span className="balance">{sgd(balances.everyday)}</span> today.
          </h1>
          <p className="lede">
            That is your Everyday Account. Savings holds {sgd(balances.savings)}, separate from spending.
          </p>
          {snapshot.readAmounts && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                hear(
                  `${CUSTOMER.split(" ")[0]}, you can use ${spokenSgd(balances.everyday)} today. Savings holds ${spokenSgd(balances.savings)}.`,
                )
              }
            >
              <Icon name="hear" />
              Hear this amount
            </button>
          )}
          <section className="band" aria-labelledby="next-title">
            <h2 id="next-title">{plan ? "Practice plan saved" : "Practice investing walk"}</h2>
            <p>
              {plan
                ? `${sgd(plan)} a month into the sample Horizon Balanced mix. Nothing has been invested.`
                : "Four short screens on a sample fund. You can stop at any point. Nothing is invested."}
            </p>
            <button type="button" className="btn btn-light" onClick={() => store.go("invest")}>
              {walkLabel}
            </button>
          </section>
          <div className="stack-actions">
            <button type="button" className="btn btn-primary" onClick={() => store.go("move")}>
              Move money
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => store.go("activity")}>
              Review activity
            </button>
            <button type="button" className="btn btn-secondary" onClick={store.openHelp}>
              Ask a question
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            Accounts
          </h1>
          <p className="lede">{CUSTOMER}</p>
          <ul className="ledger">
            <li>
              <span>
                <span className="row-title">Everyday Account</span>
                <span className="row-detail">Ready to use</span>
              </span>
              <span className="balance num">{sgd(balances.everyday)}</span>
            </li>
            <li>
              <span>
                <span className="row-title">Savings Account</span>
                <span className="row-detail">Set aside</span>
              </span>
              <span className="num">{sgd(balances.savings)}</span>
            </li>
            <li>
              <span>
                <span className="row-title">{CARD.name}</span>
                <span className="row-detail">Due {CARD.dueLabel}</span>
              </span>
              <span className="num">{sgd(CARD.due)}</span>
            </li>
            {plan && (
              <li>
                <button type="button" className="ledger-link" onClick={() => store.go("invest")}>
                  <span>
                    <span className="row-title">Practice plan</span>
                    <span className="row-detail">Sample Horizon Balanced · not invested</span>
                  </span>
                  <span className="num">{sgd(plan)}/mo</span>
                </button>
              </li>
            )}
          </ul>
          {snapshot.readAmounts && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                hear(
                  `Everyday ${spokenSgd(balances.everyday)}. Savings ${spokenSgd(balances.savings)}. Sample Visa due ${spokenSgd(CARD.due)}.`,
                )
              }
            >
              <Icon name="hear" />
              Hear the balances
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => store.go("move")}>
            Move money
          </button>
        </>
      )}

      <section className="latest" aria-labelledby="latest-title">
        <div className="section-head">
          <h2 id="latest-title">Latest</h2>
          {guided ? null : (
            <button type="button" className="text-link" onClick={() => store.go("activity")}>
              All activity
            </button>
          )}
        </div>
        <ActivityList rows={rows} />
      </section>

      <details className="presenter">
        <summary>Presenter path</summary>
        <ol>
          <li>Ask: explain a unit trust simply.</li>
          <li>Finish the walk, then switch to Standard. The plan stays.</li>
          <li>Try to move 20000. Use the recovery, or ask why it was blocked.</li>
        </ol>
      </details>
    </div>
  );
}

export function ActivityList({
  rows,
}: {
  rows: { id: string; title: string; detail: string; amount: number; at: string }[];
}) {
  return (
    <ul className="activity">
      {rows.map((row) => (
        <li key={row.id}>
          <span>
            <span className="row-title">{row.title}</span>
            <span className="row-detail">{row.detail}</span>
          </span>
          <span className={row.amount < 0 ? "num out" : "num in"}>
            {row.amount < 0 ? "−" : "+"}
            {sgd(Math.abs(row.amount))}
          </span>
        </li>
      ))}
    </ul>
  );
}
