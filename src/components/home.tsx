"use client";

import { activity, CARD, CUSTOMER } from "@/lib/data";
import { sgd, spokenSgd } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/icons";
import { speak as hear } from "@/lib/speech-client";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const store = useStore();
  const { snapshot, balances } = store;
  const guided = snapshot.mode === "guided";
  const rows = activity(snapshot.transfers).slice(0, guided ? 2 : 6);
  const plan = snapshot.invest.done ? snapshot.invest.monthly : null;
  const first = CUSTOMER.split(" ")[0];

  const walkLabel = plan
    ? "View practice plan"
    : snapshot.invest.step > 0
      ? "Continue the walk"
      : "Start the walk";

  return (
    <div className={guided ? "screen guided-home" : "screen dash"}>
      {guided ? (
        <>
          <h1 id="screen-title" tabIndex={-1}>
            {first}, you can use <span className="balance">{sgd(balances.everyday)}</span> today.
          </h1>
          <p className="lede">That figure is OCBC FRANK Account, the money ready to spend.</p>
          {snapshot.readAmounts && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                hear(
                  `${first}, you can use ${spokenSgd(balances.everyday)} today. Savings holds ${spokenSgd(balances.savings)}.`,
                )
              }
            >
              <Icon name="hear" />
              Hear this amount
            </button>
          )}
          <section className="coach" aria-labelledby="next-title">
            <h2 id="next-title">{plan ? "Your practice plan is saved" : "Next: a practice investing walk"}</h2>
            <p>
              {plan
                ? `${sgd(plan)} a month into the sample Horizon Balanced mix. Nothing has been invested.`
                : snapshot.invest.step > 0
                  ? `You left the walk on screen ${snapshot.invest.step + 1} of 4. Your place is saved.`
                  : "This walk teaches a sample fund. It does not invest your money."}
            </p>
            {!plan && snapshot.invest.step === 0 && (
              <ol className="coach-steps">
                <li>See how many people share one pool</li>
                <li>Check what a fall in value would mean</li>
                <li>Save a practice amount on this phone</li>
              </ol>
            )}
            <button type="button" className="btn btn-light" onClick={() => store.go("invest")}>
              {walkLabel}
            </button>
          </section>
          <button type="button" className="btn btn-secondary" onClick={() => store.go("move")}>
            Move money
          </button>
          <details className="other-money">
            <summary>Other money</summary>
            <ul className="ledger">
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
            </ul>
          </details>
        </>
      ) : (
        <>
          <h1 id="screen-title" className="dash-title" tabIndex={-1}>
            {greeting()}, {first}
          </h1>
          <section className="statement" aria-labelledby="everyday-title">
            <h2 id="everyday-title">OCBC FRANK Account</h2>
            <p className="statement-amount balance">{sgd(balances.everyday)}</p>
            <p className="row-detail">Ready to use</p>
            <div className="tool-row">
              <button type="button" className="btn btn-primary" onClick={() => store.go("move")}>
                Move
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => store.go("activity")}>
                Activity
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => store.go("invest")}>
                {plan ? "Plan" : "Invest"}
              </button>
            </div>
          </section>
          <div className="account-stack">
            <div className="account-row">
              <span>
                <span className="row-title">Savings Account</span>
                <span className="row-detail">Set aside</span>
              </span>
              <span className="num">{sgd(balances.savings)}</span>
            </div>
            <div className="account-row">
              <span>
                <span className="row-title">{CARD.name}</span>
                <span className="row-detail">Due {CARD.dueLabel}</span>
              </span>
              <span className="num">{sgd(CARD.due)}</span>
            </div>
            {plan && (
              <button type="button" className="account-row" onClick={() => store.go("invest")}>
                <span>
                  <span className="row-title">Practice plan</span>
                  <span className="row-detail">Horizon Balanced · not invested</span>
                </span>
                <span className="num">{sgd(plan)}/mo</span>
              </button>
            )}
          </div>
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
        </>
      )}

      <section className="latest" aria-labelledby="latest-title">
        <div className="section-head">
          <h2 id="latest-title">Latest</h2>
          <button type="button" className="text-link" onClick={() => store.go("activity")}>
            All activity
          </button>
        </div>
        <ActivityList rows={rows} />
      </section>
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
