"use client";

import { useEffect, useState } from "react";
import type { DemoSlide } from "@/lib/demo-slides";
import {
  ContactRow,
  IgniteImage,
  OcbcButton,
  QuickAction,
  SectionCard,
  SpriteIcon,
  BottomNavigation,
  type SpriteName,
} from "@/components/ocbc-ui";
import { TransferForm } from "@/components/ocbc-transfer";
import { useStore } from "@/lib/store";
import { activity, DESTINATIONS } from "@/lib/data";
import { sgd } from "@/lib/format";
import { parseAmount, validateMove } from "@/lib/move";
import type { DestinationId } from "@/lib/types";
import { AssistantDialog, PersonDialog, PreferencesDialog } from "@/components/dialogs";
import { Invest } from "@/components/invest";
import { FixedDepositApplication } from "@/components/fixed-deposit";
import { Companion } from "@/components/companion";
import { PennyPeek } from "@/components/penny-peek";
import { useCompanion } from "@/lib/use-companion";

type View =
  | "welcome"
  | "login"
  | "home"
  | "plan"
  | "pay"
  | "amount"
  | "review"
  | "invest"
  | "fixed-deposit"
  | "rewards"
  | "more"
  | "receipt";

function Art({ name, className = "" }: { name: string; className?: string }) {
  return (
    <IgniteImage
      src={`/ocbc/${name}.webp`}
      alt=""
      width={160}
      height={160}
      className={className}
    />
  );
}

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
        : localView !== "welcome" &&
            localView !== "login" &&
            store.snapshot.screen === "fixed-deposit"
          ? "fixed-deposit"
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
  const visibleContacts = contacts.filter(
    (item) =>
      (item.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        item.phone?.replace(/\s/g, "").includes(query.replace(/\s/g, ""))) &&
      (!recent || store.snapshot.transfers.some((transfer) => transfer.to === item.id)),
  );
  const contact = DESTINATIONS.find((item) => item.id === recipient);
  const name = contact?.name;
  const nav = (next: View) => {
    store.go(
      next === "invest"
        ? "invest"
        : next === "fixed-deposit"
          ? "fixed-deposit"
          : "home",
    );
    setView(next === "invest" ? "plan" : next);
    setNotice("");
    setIssue("");
    companion.navigate(next);
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
  const choose = (id: DestinationId, amountValue = "") => {
    setRecipient(id);
    store.updateDraft({ from: "everyday", to: id, amount: amountValue, note: "" });
    setBalance(false);
    setMessage(false);
    nav("amount");
  };
  const amount = parseAmount(store.snapshot.draft.amount);
  const companion = useCompanion({
    view,
    amountRaw: store.snapshot.draft.amount,
    amountOk: amount.ok,
    amount: amount.ok ? amount.amount : 0,
    name: name ?? "them",
    issue,
    assist: store.assistContext,
    pay: choose,
    openFixedDeposit: () => nav("fixed-deposit"),
  });
  // every error also goes to penny, because a blocked payment is the moment people get stuck
  const flag = (text: string) => {
    setIssue(text);
    companion.explain(text);
  };
  const payment = ["pay", "amount", "review", "receipt", "fixed-deposit"].includes(view);
  const welcome = view === "welcome" || view === "login";
  const info = (text: string) => setNotice(text);

  const presentation: DemoSlide = store.prefsOpen
    ? "preferences"
    : store.personOpen
      ? "person"
      : store.snapshot.helpOpen
        ? "assistant"
        : welcome
          ? "welcome"
          : issue
            ? "recovery"
            : view;

  useEffect(() => {
    if (!store.ready || window.parent === window) return;
    const publish = () => window.parent.postMessage(
      { type: "ocbc:demo-slide", slide: presentation },
      window.location.origin,
    );
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === "ocbc:request-demo-slide") publish();
    };
    window.addEventListener("message", receive);
    publish();
    return () => window.removeEventListener("message", receive);
  }, [presentation, store.ready]);

  if (!store.ready)
    return (
      <div className="oc-splash">
        <IgniteImage
          src="/ignite/brand/ocbc-logo-transparent-3x.png"
          alt="OCBC"
          className="oc-splash-logo"
          width={624}
          height={189}
          eager
        />
      </div>
    );

  return (
    <div
      className={`oc-app ${welcome ? "oc-welcome-app" : ""}`}
      data-guide-active={companion.target ?? undefined}
    >
      <a className="skip" href="#oc-main">
        Skip to content
      </a>
      <main id="oc-main" className="oc-main" key={view}>
        {welcome ? (
          <>
            <div className="oc-welcome-hero">
              <IgniteImage
                src="/ignite/auth/login-hero-artwork.webp"
                alt="OCBC staff and customers together"
                className="oc-welcome-artwork"
                fill
                eager
              />
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
                  <SpriteIcon name="arrow-left" size={22} />
                </button>
              )}
            </div>
            <div
              className={`oc-welcome-actions ${view === "login" ? "expanded" : ""}`}
            >
              {(view === "welcome"
                ? ([
                    ["volume", "Easy Q"],
                    ["lightbulb", "Wealth Insights"],
                    ["map-pin", "Locate OCBC"],
                  ] as [SpriteName, string][])
                : ([
                    ["token", "OneToken"],
                    ["scan", "Scan & Pay"],
                    ["transfer-accent", "PayNow"],
                    ["lightbulb", "Wealth Insights"],
                    ["exchange", "Foreign Exchange"],
                    ["more", "More"],
                  ] as [SpriteName, string][])
              ).map(([icon, label]) => (
                <QuickAction
                  key={label}
                  icon={icon}
                  label={label}
                  onClick={() =>
                    info(
                      `${label} is unavailable in this local hackathon demo.`,
                    )
                  }
                />
              ))}
            </div>
            <div className="oc-welcome-buttons">
              {view === "welcome" ? (
                <>
                  <OcbcButton
                    onClick={() =>
                      info(
                        "New customer registration is unavailable in the demo. Use existing customer login to explore.",
                      )
                    }
                  >
                    Sign up as a new customer
                  </OcbcButton>
                  <OcbcButton variant="secondary" onClick={() => nav("login")}>
                    Log in as existing customer
                  </OcbcButton>
                </>
              ) : (
                <OcbcButton onClick={login}>
                  Log in to OCBC Singapore
                </OcbcButton>
              )}
            </div>
            <p className="oc-education-label">Educational prototype · Dummy data only</p>
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
                <SpriteIcon name="bell" size={23} />
              </button>
              <button className="oc-link" onClick={() => nav("login")}>
                Logout
              </button>
            </header>
            <section className="oc-home-hero">
              <div className="oc-home-promo">
                <div className="oc-home-promo-copy">
                  <span>Welcome</span>
                  <p>Enhance your cancer coverage, and enjoy up to S$2,250 in rewards.</p>
                  <button
                    className="oc-promo-link"
                    onClick={() => info("Important information is unavailable in this local demo.")}
                  >
                    Important information <SpriteIcon name="chevron-right" size={17} />
                  </button>
                </div>
                <div className="oc-home-promo-photo">
                  <IgniteImage
                    src="/ignite/home/family-banner-photo.webp"
                    alt="A family walking together outdoors"
                    className="oc-family-photo"
                    fill
                    eager
                  />
                </div>
              </div>
              <div className="oc-shortcuts" aria-label="Quick actions">
                {[
                  ["transfer-accent", "PayNow"],
                  ["scan", "Scan & Pay"],
                  ["exchange", "Foreign Exchange"],
                  ["settings", "Customise"],
                ].map(([icon, label]) => (
                  <QuickAction
                    key={label}
                    icon={icon as SpriteName}
                    label={label}
                    onClick={() =>
                      label === "PayNow"
                        ? nav("pay")
                        : label === "Customise"
                          ? store.openPrefs()
                          : info(`${label} is unavailable in this demo.`)
                    }
                  />
                ))}
              </div>
            </section>
            <div className="oc-categories">
              <button
                aria-label={hidden ? "Show balances" : "Hide balances"}
                onClick={() => setHidden(!hidden)}
              >
                <SpriteIcon name="eye" size={17} />
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
                  <span className="oc-360"><SpriteIcon name="wallet" size={21} /></span>
                  <strong>360 Account</strong>
                  <span className="oc-chevron"><SpriteIcon name="chevron-right" size={20} /></span>
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
              <SectionCard className="oc-promo-tile">
                <small>SAVINGS GOAL</small>
                <strong>Stay on track and make your dreams a reality</strong>
                <span>View/manage goals</span>
                <button className="oc-card-hit-area" aria-label="View savings goals" onClick={() => nav("plan")} />
              </SectionCard>
              <SectionCard className="oc-promo-tile">
                <small>MONEY INSIGHTS</small>
                <strong>Set budgets and see your spending breakdown</strong>
                <span>Take control</span>
                <button className="oc-card-hit-area" aria-label="Open money insights" onClick={() => nav("plan")} />
              </SectionCard>
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
                        <SpriteIcon name="chevron-right" size={21} />
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
                <SpriteIcon name="arrow-left" size={21} />
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
                <SpriteIcon name="user" size={24} />
                NRIC/FIN
              </button>
              <button
                onClick={() =>
                  info(
                    "UEN/VPA payments are unavailable in this demo. Select a demo contact below.",
                  )
                }
              >
                <SpriteIcon name="building" size={24} />
                UEN/VPA
              </button>
            </div>
            <section className="oc-contacts">
              <label className="oc-search" data-guide="search">
                <SpriteIcon name="search" size={19} />
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
              {visibleContacts.map((item) => (
                <ContactRow
                  key={item.id}
                  name={item.name}
                  detail={item.phone ?? "Demo PayNow contact"}
                  onClick={() => choose(item.id)}
                />
              ))}
              {visibleContacts.length === 0 && (
                <p className="oc-empty">
                  {recent ? "No recent recipients yet." : "No contacts found. Try another name or number."}
                </p>
              )}
            </section>
          </>
        ) : view === "amount" ? (
          <div className="oc-payment">
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("pay")}>
                <SpriteIcon name="arrow-left" size={21} />
              </button>
              <h1>PayNow</h1>
            </header>
            <TransferForm
              name={name ?? "Demo recipient"}
              phone={contact?.phone ?? "Demo PayNow recipient"}
              amount={store.snapshot.draft.amount}
              amountValid={amount.ok}
              note={store.snapshot.draft.note}
              showNote={message}
              availableBalance={money}
              balanceVisible={balance}
              issue={issue}
              onAmountChange={(value) => {
                store.updateDraft({ amount: value });
                setIssue("");
              }}
              onNoteChange={(value) => store.updateDraft({ note: value })}
              onToggleNote={() => setMessage(!message)}
              onToggleBalance={() => setBalance(!balance)}
              onContinue={() => {
                const result = validateMove(
                  store.snapshot.draft,
                  store.snapshot.transfers,
                );
                if (!result.ok) {
                  flag(`${result.title} ${result.recovery}`);
                  return;
                }
                if (result.amount > 1000) {
                  flag(
                    "This amount exceeds the 1,000.00 SGD demo daily limit.",
                  );
                  return;
                }
                nav("review");
              }}
            />
          </div>
        ) : view === "review" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("amount")}>
                <SpriteIcon name="arrow-left" size={21} />
              </button>
              <h1>Review payment</h1>
            </header>
            <section className="oc-review-screen">
              <SectionCard className="oc-review-card" label="Transfer summary">
                <div className="oc-review-recipient">
                  <span className="oc-review-check"><SpriteIcon name="check-circle" size={26} /></span>
                  <span><small>Sending to</small><strong>{name}</strong><span>{contact?.phone ?? "PayNow recipient"}</span></span>
                </div>
                <div className="oc-review-amount"><small>Amount</small><strong>{sgd(amount.ok ? amount.amount : 0)}</strong></div>
                <div className="oc-review-row"><span>From</span><strong>360 Account</strong></div>
                {store.snapshot.draft.note && (
                  <div className="oc-review-row"><span>Message</span><strong>{store.snapshot.draft.note}</strong></div>
                )}
              </SectionCard>
              <p className="oc-demo-label">
                This is a practice transfer. No bank is contacted and no real money moves.
              </p>
              {issue && (
                <p className="oc-error" role="alert">
                  {issue}
                </p>
              )}
              <OcbcButton data-guide="confirm"
                onClick={() => {
                  const result = validateMove(
                    store.snapshot.draft,
                    store.snapshot.transfers,
                  );
                  if (!result.ok) {
                    flag(result.title);
                    return;
                  }
                  if (result.amount > 1000) {
                    flag("Daily demo limit exceeded.");
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
              </OcbcButton>
              <OcbcButton variant="secondary" onClick={() => nav("amount")}>
                Change payment
              </OcbcButton>
            </section>
          </>
        ) : view === "receipt" ? (
          <section className="oc-review-screen oc-receipt-screen">
            <span className="oc-receipt-icon"><SpriteIcon name="check-circle" size={42} /></span>
            <h1>Payment recorded</h1>
            <h2>{receipt}</h2>
            <p>This is a practice payment. No real money moved.</p>
            <OcbcButton onClick={() => nav("home")}>
              Back to Home
            </OcbcButton>
          </section>
        ) : view === "fixed-deposit" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back to Home" onClick={() => nav("home")}>
                <SpriteIcon name="arrow-left" size={21} />
              </button>
              <h1>Fixed deposit</h1>
            </header>
            <FixedDepositApplication onBack={() => nav("home")} />
          </>
        ) : view === "invest" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("plan")}>
                <SpriteIcon name="arrow-left" size={21} />
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
      {!welcome && <Companion companion={companion} />}
      {!welcome && <PennyPeek companion={companion} aboveNav={!payment} />}
      {!welcome && !payment && (
        <BottomNavigation
          current={view === "invest" ? "plan" : view}
          onNavigate={(target) => nav(target as View)}
        />
      )}
      <AssistantDialog />
      <PreferencesDialog />
      <PersonDialog />
    </div>
  );
}
