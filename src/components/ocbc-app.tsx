"use client";

/* eslint-disable @next/next/no-img-element -- supplied raster artwork is already sized for the mobile reference. */
import { useState } from "react";
import { useStore } from "@/lib/store";
import { activity, DESTINATIONS } from "@/lib/data";
import { sgd } from "@/lib/format";
import { parseAmount, validateMove } from "@/lib/move";
import type { DestinationId } from "@/lib/types";
import {
  AssistantDialog,
  PersonDialog,
  PreferencesDialog,
} from "@/components/dialogs";
import { Invest } from "@/components/invest";

function Art({ name, className = "" }: { name: string; className?: string }) {
  return (
    <img className={`oc-art ${className}`} src={`/ocbc/${name}.webp`} alt="" />
  );
}

type View =
  | "welcome"
  | "login"
  | "home"
  | "plan"
  | "pay"
  | "amount"
  | "review"
  | "invest"
  | "rewards"
  | "more"
  | "receipt";

export function OcbcApp() {
  const store = useStore();
  const [localView, setView] = useState<View>("welcome");
  const view =
    localView !== "welcome" &&
    localView !== "login" &&
    store.snapshot.screen === "invest"
      ? "invest"
      : localView !== "welcome" &&
          localView !== "login" &&
          store.snapshot.screen === "move"
        ? "pay"
        : localView;
  const [category, setCategory] = useState("Accounts");
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(false);
  const [message, setMessage] = useState(false);
  const [balance, setBalance] = useState(false);
  const [issue, setIssue] = useState("");
  const [notice, setNotice] = useState("");
  const [oneView, setOneView] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [recipient, setRecipient] = useState<DestinationId>("mum");
  const money = store.balances.everyday;
  const contacts = DESTINATIONS.filter((item) => item.detail === "PayNow");
  const contact = DESTINATIONS.find((item) => item.id === recipient);
  const name = contact?.name;
  const nav = (next: View) => {
    store.go(next === "invest" ? "invest" : "home");
    setView(next === "invest" ? "plan" : next);
    setNotice("");
    setIssue("");
  };
  const login = () => {
    if (!store.snapshot.onboarded)
      store.completeOnboarding({
        onboarded: true,
        mode: "standard",
        textSize: "default",
        plainLanguage: true,
        offerPerson: true,
        readAmounts: false,
      });
    nav("home");
  };
  const choose = (id: DestinationId) => {
    setRecipient(id);
    store.updateDraft({ from: "everyday", to: id, amount: "", note: "" });
    setBalance(false);
    setMessage(false);
    nav("amount");
  };
  const amount = parseAmount(store.snapshot.draft.amount);
  const payment = ["pay", "amount", "review", "receipt"].includes(view);
  const welcome = view === "welcome" || view === "login";
  const info = (text: string) => setNotice(text);

  if (!store.ready)
    return (
      <div className="oc-splash">
        <Art name="logo" />
      </div>
    );

  return (
    <div className={`oc-app ${welcome ? "oc-welcome-app" : ""}`}>
      <a className="skip" href="#oc-main">
        Skip to content
      </a>
      <main id="oc-main" className="oc-main" key={view}>
        {welcome ? (
          <>
            <div className="oc-welcome-hero">
              <Art name={view === "login" ? "login-hero" : "welcome"} />
              <button
                className="oc-language"
                aria-label="Chinese language"
                onClick={() =>
                  info(
                    "中文服务将在正式版本提供。This demo is available in English.",
                  )
                }
              ></button>
              {view === "login" && (
                <button
                  className="oc-back"
                  aria-label="Back"
                  onClick={() => nav("welcome")}
                >
                  ‹
                </button>
              )}
            </div>
            <div
              className={`oc-welcome-actions ${view === "login" ? "expanded" : ""}`}
            >
              {(view === "welcome"
                ? [
                    ["token", "Easy Q"],
                    ["insights", "Wealth Insights"],
                    ["location", "Locate OCBC"],
                  ]
                : [
                    ["token", "OneToken"],
                    ["scan", "Scan & Pay"],
                    ["paynow", "PayNow"],
                    ["insights", "Wealth Insights"],
                    ["fx", "Foreign Exchange"],
                    ["more", "More"],
                  ]
              ).map(([icon, label]) => (
                <button
                  key={label}
                  onClick={() =>
                    info(
                      `${label} is unavailable in this local hackathon demo.`,
                    )
                  }
                >
                  <span>
                    <Art name={icon} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <div className="oc-welcome-buttons">
              {view === "welcome" ? (
                <>
                  <button
                    className="oc-primary"
                    onClick={() =>
                      info(
                        "New customer registration is unavailable in the demo. Use existing customer login to explore.",
                      )
                    }
                  >
                    Sign up as a new customer
                  </button>
                  <button className="oc-outline" onClick={() => nav("login")}>
                    Log in as existing customer
                  </button>
                </>
              ) : (
                <button className="oc-primary" onClick={login}>
                  Log in to OCBC Singapore
                </button>
              )}
            </div>
            <p className="oc-maintenance">
              <strong>Scheduled maintenance:</strong> Various services will not
              be available on 24 Oct (10pm) to 25 Oct (8am).{" "}
              <button
                onClick={() =>
                  info(
                    "Maintenance notice reproduced from the supplied design reference.",
                  )
                }
              >
                Learn more
              </button>
            </p>
          </>
        ) : view === "home" ? (
          <>
            <header className="oc-toolbar">
              <button
                className="oc-tokens"
                onClick={() => info("You have no OCBC Tokens in this demo.")}
              >
                OCBC Tokens
              </button>
              <button
                aria-label="Notifications"
                className="oc-bell"
                onClick={() =>
                  info("You're all caught up. No new notifications.")
                }
              >
                <Art name="bell" />
              </button>
              <button className="oc-link" onClick={() => nav("login")}>
                Logout
              </button>
            </header>
            <section className="oc-home-hero">
              <Art name="home-banner" />
              <div className="oc-shortcuts">
                {[
                  ["paynow", "PayNow"],
                  ["scan", "Scan & Pay"],
                  ["fx", "Foreign Exchange"],
                  ["settings", "Customise"],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    onClick={() =>
                      label === "PayNow"
                        ? nav("pay")
                        : label === "Customise"
                          ? store.openPrefs()
                          : info(`${label} is unavailable in this demo.`)
                    }
                  >
                    <Art name={icon} />
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <div className="oc-categories">
              <button
                aria-label={hidden ? "Show balances" : "Hide balances"}
                onClick={() => setHidden(!hidden)}
              >
                <Art name="eye" />
              </button>
              {["Accounts", "Cards", "Investments", "Loans", "Insurance"].map(
                (item) => (
                  <button
                    key={item}
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            {category === "Accounts" ? (
              <section className="oc-account">
                <button
                  className="oc-account-heading"
                  onClick={() =>
                    info(
                      `360 Account · Available balance ${sgd(money)}. Fictional demo account.`,
                    )
                  }
                >
                  <span className="oc-360">360</span>
                  <strong>360 Account</strong>
                  <span className="oc-chevron">›</span>
                </button>
                <div className="oc-account-balance">
                  <span>Available balance</span>
                  <strong>
                    {hidden
                      ? "••••••"
                      : `${money.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SGD`}
                  </strong>
                </div>
                <div className="oc-debit">Debit card no.</div>
              </section>
            ) : (
              <section className="oc-account oc-empty">
                <h2>{category}</h2>
                <p>No {category.toLowerCase()} to display.</p>
                {category === "Investments" && (
                  <button className="oc-link" onClick={() => nav("invest")}>
                    Start investing
                  </button>
                )}
              </section>
            )}
            <div className="oc-promo-row">
              <button onClick={() => nav("plan")}>
                <small>SAVINGS GOAL</small>
                <strong>Stay on track and make your dreams a reality</strong>
                <span>View/manage goals</span>
              </button>
              <button onClick={() => nav("plan")}>
                <small>MONEY INSIGHTS</small>
                <strong>Set budgets and see your spending breakdown</strong>
                <span>Take control</span>
              </button>
            </div>
            <section className="oc-transactions">
              <h1>Recent transactions</h1>
              <p>Up to 50 (last 7 days only)</p>
              {activity(store.snapshot.transfers)
                .slice(0, 4)
                .map((row) => (
                  <div className="oc-transaction" key={row.id}>
                    <span>
                      {row.title}
                      <small>{row.detail}</small>
                    </span>
                    <strong>{sgd(row.amount)}</strong>
                  </div>
                ))}
            </section>
          </>
        ) : view === "plan" ? (
          <section className="oc-plan">
            <div className="oc-plan-heading">
              <h1>Plan your finances</h1>
              <button
                className="oc-link"
                onClick={() =>
                  info(
                    "Manage, protect, build and grow your wealth with a complete view of your finances.",
                  )
                }
              >
                Learn more
              </button>
            </div>
            <p>Manage, protect, build and grow your wealth.</p>
            <section className="oc-networth">
              <div className="oc-card-label">
                NET WORTH
                <button
                  aria-label="About net worth"
                  onClick={() =>
                    info(
                      "Net worth is what you have minus what you owe. All balances are fictional.",
                    )
                  }
                >
                  ⓘ
                </button>
              </div>
              <div className="oc-networth-tabs">
                <button
                  aria-pressed={!oneView}
                  onClick={() => setOneView(false)}
                >
                  OCBC
                </button>
                <button aria-pressed={oneView} onClick={() => setOneView(true)}>
                  Your Financial OneView
                </button>
              </div>
              {oneView ? (
                <p>
                  Connect your other accounts to see your full financial
                  picture. Unavailable in this demo.
                </p>
              ) : (
                <>
                  <div className="oc-money-row">
                    <span>What you have (SGD)</span>
                    <strong>
                      {(money + store.balances.savings).toLocaleString(
                        "en-SG",
                        { minimumFractionDigits: 2 },
                      )}
                    </strong>
                  </div>
                  <div className="oc-money-row">
                    <span>What you owe (SGD)</span>
                    <strong>0.00</strong>
                  </div>
                </>
              )}
              <button
                className="oc-link"
                onClick={() =>
                  info(
                    "What you have includes your available demo account and savings balances. No external accounts are connected.",
                  )
                }
              >
                How did we calculate this?
              </button>
            </section>
            <div className="oc-plan-grid">
              {[
                ["TRACK", "Money in (SGD)", "0.00", "track-art"],
                [
                  "INVEST",
                  "Check out our products and insights",
                  "Start investing",
                  "invest-art",
                ],
                [
                  "GOALS",
                  "Save regularly for your needs and wants",
                  "Create new goal",
                  "goal-art",
                ],
                [
                  "INSURE",
                  "Find policies to fill the gaps in your insurance",
                  "Calculate your needs",
                  "insure-art",
                ],
              ].map(([title, description, action, art]) => (
                <section key={title}>
                  <h2>{title}</h2>
                  <p>{description}</p>
                  {title === "TRACK" ? (
                    <>
                      <strong>0.00</strong>
                      <p>Money out (SGD)</p>
                      <strong>0.00</strong>
                      <button
                        className="oc-card-arrow"
                        aria-label="View transactions"
                        onClick={() => {
                          nav("home");
                          setTimeout(
                            () =>
                              document
                                .querySelector(".oc-transactions")
                                ?.scrollIntoView(),
                            0,
                          );
                        }}
                      >
                        ›
                      </button>
                    </>
                  ) : (
                    <button
                      className="oc-link"
                      onClick={() =>
                        title === "INVEST"
                          ? nav("invest")
                          : info(
                              `${title === "GOALS" ? "Savings goals" : "Insurance planning"} is unavailable in this demo.`,
                            )
                      }
                    >
                      {action}
                    </button>
                  )}
                  <Art name={art} />
                </section>
              ))}
            </div>
          </section>
        ) : view === "pay" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("home")}>
                ‹
              </button>
              <h1>PayNow</h1>
            </header>
            <div className="oc-pay-types">
              <button
                onClick={() =>
                  info(
                    "NRIC/FIN payments are unavailable in this demo. Select a demo contact below.",
                  )
                }
              >
                <Art name="nric" />
                NRIC/FIN
              </button>
              <button
                onClick={() =>
                  info(
                    "UEN/VPA payments are unavailable in this demo. Select a demo contact below.",
                  )
                }
              >
                <Art name="uen" />
                UEN/VPA
              </button>
            </div>
            <section className="oc-contacts">
              <label className="oc-search">
                <Art name="search" />
                <input
                  aria-label="Search by name or mobile number"
                  placeholder="Search by name or mobile number"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="oc-contact-tabs">
                <button aria-pressed={recent} onClick={() => setRecent(true)}>
                  Recent
                </button>
                <button aria-pressed={!recent} onClick={() => setRecent(false)}>
                  Contacts
                </button>
              </div>
              {contacts
                .filter(
                  (item) =>
                    (item.name.toLowerCase().includes(query.toLowerCase()) ||
                      item.phone
                        ?.replace(/ /g, "")
                        .includes(query.replace(/ /g, ""))) &&
                    (!recent ||
                      store.snapshot.transfers.some(
                        (transfer) => transfer.to === item.id,
                      )),
                )
                .map((item) => (
                  <button
                    className="oc-contact"
                    key={item.id}
                    onClick={() => choose(item.id)}
                  >
                    <span className="oc-avatar">
                      {item.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.phone ?? "Demo PayNow contact"}</small>
                    </span>
                  </button>
                ))}
              {((recent && !store.snapshot.transfers.length) ||
                !contacts.some(
                  (item) =>
                    item.name.toLowerCase().includes(query.toLowerCase()) ||
                    item.phone
                      ?.replace(/ /g, "")
                      .includes(query.replace(/ /g, "")),
                )) && <p className="oc-empty">No contacts found.</p>}
            </section>
          </>
        ) : view === "amount" ? (
          <div className="oc-payment">
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("pay")}>
                ‹
              </button>
            </header>
            <section className="oc-pay-to">
              <p>Pay to</p>
              <h1>
                {name}
              </h1>
              <p>{contact?.phone ?? "Demo PayNow recipient"}</p>
              <label className="oc-amount">
                <input
                  aria-label="Amount in SGD"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={store.snapshot.draft.amount}
                  onChange={(event) => {
                    store.updateDraft({ amount: event.target.value });
                    setIssue("");
                  }}
                />
                <span>SGD</span>
              </label>
              <p>
                Daily limit remaining:{" "}
                <span className="oc-link">1,000.00 SGD</span>
              </p>
              <button
                className="oc-message-toggle"
                onClick={() => setMessage(!message)}
              >
                Add a message
              </button>
              {message && (
                <input
                  className="oc-note"
                  aria-label="Payment message"
                  placeholder="Message (optional)"
                  maxLength={140}
                  value={store.snapshot.draft.note}
                  onChange={(event) =>
                    store.updateDraft({ note: event.target.value })
                  }
                />
              )}
              {issue && (
                <p role="alert" className="oc-error">
                  {issue}
                </p>
              )}
            </section>
            <section className="oc-pay-from">
              <p>From</p>
              <h2>360 Account</h2>
              <button className="oc-link" onClick={() => setBalance(!balance)}>
                <Art name="eye" />
                {balance ? `${sgd(money)} available` : "Show available balance"}
              </button>
            </section>
            <button
              className="oc-next"
              disabled={!amount.ok}
              onClick={() => {
                const result = validateMove(
                  store.snapshot.draft,
                  store.snapshot.transfers,
                );
                if (!result.ok) {
                  setIssue(`${result.title} ${result.recovery}`);
                  return;
                }
                if (result.amount > 1000) {
                  setIssue(
                    "This amount exceeds the 1,000.00 SGD demo daily limit.",
                  );
                  return;
                }
                nav("review");
              }}
            >
              Next
            </button>
          </div>
        ) : view === "review" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("amount")}>
                ‹
              </button>
              <h1>Review payment</h1>
            </header>
            <section className="oc-review">
              <h2>{sgd(amount.ok ? amount.amount : 0)}</h2>
              <p>
                To <strong>{name}</strong>
              </p>
              <p>From 360 Account</p>
              {store.snapshot.draft.note && (
                <p>Message: {store.snapshot.draft.note}</p>
              )}
              <p className="oc-demo-label">
                Practice payment. No bank is contacted and no real money moves.
              </p>
              {issue && (
                <p className="oc-error" role="alert">
                  {issue}
                </p>
              )}
              <button
                className="oc-primary"
                onClick={() => {
                  const result = validateMove(
                    store.snapshot.draft,
                    store.snapshot.transfers,
                  );
                  if (!result.ok) {
                    setIssue(result.title);
                    return;
                  }
                  if (result.amount > 1000) {
                    setIssue("Daily demo limit exceeded.");
                    return;
                  }
                  store.submitMove({
                    id: crypto.randomUUID(),
                    from: store.snapshot.draft.from,
                    to: recipient,
                    amount: result.amount,
                    note: store.snapshot.draft.note.trim(),
                    at: new Date().toISOString(),
                  });
                  setReceipt(`${sgd(result.amount)} to ${name}`);
                  nav("receipt");
                }}
              >
                Confirm practice payment
              </button>
              <button className="oc-link" onClick={() => nav("amount")}>
                Change payment
              </button>
            </section>
          </>
        ) : view === "receipt" ? (
          <section className="oc-review">
            <h1>Payment recorded</h1>
            <h2>{receipt}</h2>
            <p>This is a practice payment. No real money moved.</p>
            <button className="oc-primary" onClick={() => nav("home")}>
              Back to Home
            </button>
          </section>
        ) : view === "invest" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("plan")}>
                ‹
              </button>
              <h1>Invest</h1>
            </header>
            <Invest />
          </>
        ) : (
          <section className="oc-menu">
            <h1>{view === "more" ? "More" : "Rewards"}</h1>
            {view === "more" ? (
              <>
                <button onClick={store.openPrefs}>
                  Accessibility & preferences
                </button>
                <button onClick={store.openHelp}>
                  Ask OCBC Adaptive Assist
                </button>
                <button onClick={store.openPerson}>Speak to a person</button>
                <button onClick={() => nav("login")}>Logout</button>
              </>
            ) : (
              <>
                <p>Enjoy more with OCBC.</p>
                <p>No rewards available in this demo.</p>
              </>
            )}
          </section>
        )}
        {notice && (
          <div className="oc-notice" role="status">
            <p>{notice}</p>
            <button onClick={() => setNotice("")}>Dismiss</button>
          </div>
        )}
      </main>
      {!welcome && !payment && (
        <nav className="oc-nav" aria-label="Primary">
          {[
            ["home", "Home", "home"],
            ["plan", "Plan", "plan"],
            ["pay", "Pay & Transfer", "transfer"],
            ["rewards", "Rewards", "rewards"],
            ["more", "More", "more"],
          ].map(([target, label, icon]) => (
            <button
              key={target}
              aria-current={view === target ? "page" : undefined}
              onClick={() => nav(target as View)}
            >
              <Art
                name={
                  view === target && (target === "home" || target === "plan")
                    ? `${icon}-active`
                    : icon
                }
              />
              {label}
            </button>
          ))}
        </nav>
      )}
      <AssistantDialog />
      <PreferencesDialog />
      <PersonDialog />
    </div>
  );
}
