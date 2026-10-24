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
import type { DestinationId, Screen } from "@/lib/types";
import { AssistantDialog, PersonDialog, PreferencesDialog } from "@/components/dialogs";
import { GuidanceChoice } from "@/components/journey-guidance";
import { Invest } from "@/components/invest";
import { FixedDepositApplication } from "@/components/fixed-deposit";
import { Companion } from "@/components/companion";
import { PennyPeek } from "@/components/penny-peek";
import { useCompanion } from "@/lib/use-companion";
import { Onboarding } from "@/components/onboarding";
import { Activity } from "@/components/activity";
import { IntentEntry } from "@/components/intent-entry";
import { EVERYDAY_ACTIONS, type EverydayAction } from "@/lib/types";
import { findIntentContact } from "@/lib/intent";
import { type Intent, type Journey } from "@/lib/journeys";
import { OFFERS, type Offer } from "@/lib/offers";

const ACTION_JOURNEYS: Record<EverydayAction, Journey> = {
  paynow: "paynow", "scan-pay": "scan_and_pay", transfer: "transfer",
  "foreign-exchange": "foreign_exchange", "fixed-deposit": "fixed_deposit", invest: "start_investing",
};
const ACTION_ICONS: Record<EverydayAction, SpriteName> = {
  paynow: "transfer-accent", "scan-pay": "scan", transfer: "transfer",
  "foreign-exchange": "exchange", "fixed-deposit": "calendar", invest: "lightbulb",
};

type View = Exclude<Screen, "move"> | "pay";

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
  const view: View = store.snapshot.screen === "move" ? "pay" : store.snapshot.screen;
  const [journeyOffer, setJourneyOffer] = useState<Offer | null>(null);
  const [intentAmount, setIntentAmount] = useState("");
  const [category, setCategory] = useState("Accounts");
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(false);
  const [message, setMessage] = useState(false);
  const [balance, setBalance] = useState(false);
  const issue = store.snapshot.lastIssue ?? "";
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
    if (!store.go(next === "pay" ? "move" : next)) return false;
    setNotice("");
    setJourneyOffer(null);
    setIntentAmount("");
    store.setIssue(null);
    companion.navigate(next);
    return true;
  };
  const login = () => {
    nav(store.snapshot.onboarded ? "home" : "onboarding");
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
    idleHelp: store.snapshot.idleHelp,
    onJourneyGuidanceChange: store.chooseJourneyGuidance,
    journey: {
      guided: store.journeyGuidance === true,
      step: view === "invest" ? store.snapshot.invest.step : store.snapshot.fixedDeposit.step,
    },
    pay: choose,
    assist: store.assistContext,
    go: (next) => nav(next as View),
    openFixedDeposit: () => nav("fixed-deposit"),
  });
  // every error also goes to penny, because a blocked payment is the moment people get stuck
  const flag = (text: string) => {
    store.setIssue(text);
    companion.explain(text);
  };
  const payment = ["pay", "amount", "review", "receipt", "fixed-deposit"].includes(view);
  const welcome = view === "welcome" || view === "login";
  const setup = view === "onboarding";
  const info = (text: string) => setNotice(text);

  const startJourney = ({ journey, slots }: Intent) => {
    if (journey === "out_of_scope" || journey === "unclear") return;
    if (journey === "transfer" || journey === "paynow") {
      const matched = slots.recipient ? findIntentContact(slots.recipient) : undefined;
      const amountValue = slots.amount === undefined ? "" : String(slots.amount);
      if (matched) choose(matched.id, amountValue);
      else {
        nav("pay");
        setQuery(slots.recipient ?? "");
        setRecent(false);
        setIntentAmount(amountValue);
        store.updateDraft({ amount: amountValue });
        if (slots.recipient) info(`Choose a saved contact for “${slots.recipient}”. If they are not listed, this demo cannot pay them.`);
      }
    } else if (journey === "talk_to_person") {
      store.openPerson();
    } else {
      const screens = { scan_and_pay: "scan-pay", foreign_exchange: "foreign-exchange", fixed_deposit: "fixed-deposit", start_investing: "invest", view_transactions: "activity", explore_offers: "explore" } as const;
      if (journey === "fixed_deposit" && slots.amount !== undefined) store.updateFixedDeposit({ amount: String(slots.amount) });
      nav(screens[journey]);
    }
    setJourneyOffer(OFFERS.find((offer) => offer.journeys.includes(journey)) ?? null);
  };
  const openOffer = (offer: Offer) => offer.screen ? nav(offer.screen === "move" ? "pay" : offer.screen) : info(`${offer.label === "Welcome" ? "Important information" : offer.label === "GOALS" ? "Savings goals" : "Insurance planning"} is unavailable in this demo.`);
  const recentRows = activity(store.snapshot.transfers).slice(0, 4);

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
            : setup
              ? "preferences"
              : ["activity", "explore", "scan-pay", "foreign-exchange"].includes(view)
                ? "home"
                : view as DemoSlide;

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
        {journeyOffer && !welcome && !setup && view !== "home" && view !== "receipt" && view !== "explore" && (
          <aside className="oc-journey-offer" aria-label="Related offer">
            <button className="oc-link" aria-label="Dismiss related offer" onClick={() => setJourneyOffer(null)}>Dismiss</button>
            <small>{journeyOffer.label}</small>
            <p>{journeyOffer.title}</p>
            <button className="oc-link" onClick={() => openOffer(journeyOffer)}>{journeyOffer.action}</button>
          </aside>
        )}
        {welcome ? (
          <div className="oc-login">
            <div className="oc-login-bg-wrap"><IgniteImage src="/ocbc/login-bg.webp" alt="" className="oc-login-bg" fill eager /></div>
            <div className="oc-login-top">
              <button aria-label="Scan to log in" onClick={() => info("Scan to log in is unavailable in this local hackathon demo.")}>
                <SpriteIcon name="scan" size={26} />
              </button>
              <button aria-label="Notifications" className="oc-login-bell" onClick={() => info("You're all caught up. No new notifications.")}>
                <SpriteIcon name="bell" size={26} />
                <i aria-hidden="true" />
              </button>
            </div>
            <div className="oc-login-bottom">
              <div className="oc-login-grid">
                {([
                  ["token", "OneToken"],
                  ["scan", "Scan & Pay"],
                  ["transfer-accent", "PayNow"],
                  ["lightbulb", "Wealth Insights"],
                  ["exchange", "Foreign Exchange"],
                  ["sparkles", "More"],
                ] as [SpriteName, string][]).map(([icon, label]) => (
                  <QuickAction
                    key={label}
                    icon={icon}
                    iconSrc={label === "PayNow" ? "/ignite/brand/paynow-mark.svg" : undefined}
                    label={label}
                    onClick={() => info(`${label} is unavailable in this local hackathon demo.`)}
                  />
                ))}
              </div>
              <OcbcButton onClick={login}>Log in to OCBC Singapore</OcbcButton>
              <p className="oc-education-label">Educational prototype · Dummy data only</p>
            </div>
          </div>
        ) : setup ? (
          <Onboarding />
        ) : view === "activity" ? (
          <Activity />
        ) : view === "explore" ? (
          <section className="oc-explore">
            <header className="oc-page-heading"><button aria-label="Back to Home" onClick={() => nav("home")}><SpriteIcon name="arrow-left" size={21} /></button><h1>Explore offers</h1></header>
            {OFFERS.map((offer) => <SectionCard key={offer.id} className="oc-explore-offer"><small>{offer.label}</small><h2>{offer.title}</h2><button className="oc-link" onClick={() => openOffer(offer)}>{offer.action}</button></SectionCard>)}
          </section>
        ) : view === "scan-pay" || view === "foreign-exchange" ? (
          <section className="oc-menu"><button className="oc-link" onClick={() => nav("home")}>Back to Home</button><h1>{view === "scan-pay" ? "Scan & Pay" : "Foreign Exchange"}</h1><p>{view === "scan-pay" ? "QR scanning" : "Currency conversion"} is unavailable in this local demo.</p></section>
        ) : view === "home" && store.snapshot.homeLayout === "calm" ? (
          <div className="oc-calm-home">
            <section className="oc-account" aria-label="Account balance">
              <div className="oc-account-heading"><span className="oc-360"><SpriteIcon name="wallet" size={21} /></span><h1>360 Account</h1><button className="oc-link" aria-label={hidden ? "Show balances" : "Hide balances"} onClick={() => setHidden(!hidden)}><SpriteIcon name="eye" size={20} /></button></div>
              <div className="oc-account-balance"><span>Available balance</span><strong>{hidden ? "••••••" : `${money.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SGD`}</strong></div>
            </section>
            <section className="oc-everyday" aria-label="Your everyday actions">
              <div className="oc-everyday-grid">{store.snapshot.everydayActions.map((id) => <QuickAction key={id} icon={ACTION_ICONS[id]} label={EVERYDAY_ACTIONS.find(([action]) => action === id)![1]} onClick={() => startJourney({ journey: ACTION_JOURNEYS[id], confidence: 1, slots: {} })} />)}</div>
              <p>Your everyday actions, chosen during setup <button className="oc-link" onClick={() => store.openPrefs("everyday-actions")}>Edit</button></p>
            </section>
            <IntentEntry onStart={startJourney} />
            <button className="oc-link oc-explore-link" onClick={() => nav("explore")}>Explore offers <SpriteIcon name="chevron-right" size={17} /></button>
            <section className="oc-transactions"><h2>Recent transactions</h2><p>{recentRows.length} most recent transactions</p>{recentRows.map((row) => <div className="oc-transaction" key={row.id}><span>{row.title}<small>{row.detail}</small></span><strong>{sgd(row.amount)}</strong></div>)}</section>
          </div>
        ) : view === "home" ? (
          <>
            <header className="oc-toolbar">
              <button
                className="oc-tokens"
                onClick={() => info("You have no OCBC Tokens in this demo.")}
              >
                <SpriteIcon name="token" size={20} />
                OCBC Tokens
              </button>
              <button
                aria-label="Notifications"
                className="oc-bell oc-bell-dot"
                onClick={() =>
                  info("You're all caught up. No new notifications.")
                }
              >
                <SpriteIcon name="bell" size={25} />
                <i aria-hidden="true" />
              </button>
              <button className="oc-link oc-logout" onClick={() => nav("login")}>
                Logout
              </button>
            </header>
            <section className="oc-home-hero">
              <div className="oc-home-promo">
                <div className="oc-home-promo-copy">
                  <span>Welcome</span>
                  <p>Together, lifting everyone we serve.</p>
                </div>
                <div className="oc-home-promo-photo">
                  <IgniteImage
                    src="/ocbc/home-hero.webp"
                    alt="Gardens by the Bay, Singapore"
                    className="oc-family-photo"
                    fill
                    eager
                  />
                </div>
              </div>
              <div className="oc-shortcuts" aria-label="Quick actions">
                <QuickAction iconSrc="/ignite/brand/paynow-mark.svg" label="PayNow" onClick={() => nav("pay")} />
                <QuickAction icon="scan" label="Scan & Pay" onClick={() => info("Scan & Pay is unavailable in this demo.")} />
                <QuickAction iconSrc="/ignite/icons/lock.svg" label="Lock/unlock card" onClick={() => info("Lock/unlock card is unavailable in this demo.")} />
                <span className="oc-shortcuts-divider" aria-hidden="true" />
                <QuickAction icon="settings" label="Customise" onClick={() => store.openPrefs()} />
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
                      `OCBC FRANK Account · Available balance ${sgd(money)}. Fictional demo account.`,
                    )
                  }
                >
                  <span className="oc-360">FRA</span>
                  <span className="oc-account-name">
                    <strong>OCBC FRANK Account</strong>
                    <small>••••••••</small>
                  </span>
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
                <div className="oc-debit"><span>Debit card no.</span><span>••••••••</span></div>
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
              {OFFERS.filter((offer) => ["savings-goal", "money-insights"].includes(offer.id)).map((offer) => (
                <SectionCard className="oc-promo-tile" key={offer.id}>
                  <small>{offer.label}</small><strong>{offer.title}</strong><span>{offer.action}</span>
                  <button className="oc-card-hit-area" aria-label={offer.accessibleAction} onClick={() => openOffer(offer)} />
                </SectionCard>
              ))}
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
                ...OFFERS.filter((offer) => ["invest", "goals", "insure"].includes(offer.id)).map((offer) => [offer.label, offer.title, offer.action, offer.image!.replace("/ocbc/", "").replace(".webp", "")]),
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
          <div className="oc-pay-list">
            <header className="oc-page-heading oc-heading-light">
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
                <IgniteImage src="/ocbc/nric.webp" alt="" width={44} height={44} className="oc-pay-type-icon" />
                NRIC/FIN
              </button>
              <button
                onClick={() =>
                  info(
                    "UEN/VPA payments are unavailable in this demo. Select a demo contact below.",
                  )
                }
              >
                <IgniteImage src="/ocbc/uen.webp" alt="" width={44} height={44} className="oc-pay-type-icon" />
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
                  onClick={() => choose(item.id, intentAmount)}
                />
              ))}
              {visibleContacts.length === 0 && (
                <p className="oc-empty">
                  {recent ? "No recent recipients yet." : "No contacts found. Try another name or number."}
                </p>
              )}
            </section>
          </div>
        ) : view === "amount" ? (
          <div className="oc-payment">
            <header className="oc-page-heading">
              <button aria-label="Back" onClick={() => nav("pay")}>
                <SpriteIcon name="arrow-left" size={21} />
              </button>
              <h1 className="oc-sr">PayNow</h1>
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
                store.setIssue(null);
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
            {store.journeyGuidance === null && !store.snapshot.fixedDeposit.reference
              ? <GuidanceChoice /> : <FixedDepositApplication />}
          </>
        ) : view === "invest" ? (
          <>
            <header className="oc-page-heading">
              <button aria-label="Back to Home" onClick={() => nav("home")}>
                <SpriteIcon name="arrow-left" size={21} />
              </button>
              <h1>Invest</h1>
            </header>
            {store.journeyGuidance === null && !store.snapshot.invest.done ? <GuidanceChoice /> : <Invest />}
          </>
        ) : (
          <section className="oc-menu">
            <h1>{view === "more" ? "More" : "Rewards"}</h1>
            {view === "more" ? (
              <>
                <button onClick={() => store.openPrefs()}>
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
      {!welcome && !setup && <Companion companion={companion} aboveNav={!payment} />}
      {!welcome && !setup && <PennyPeek companion={companion} aboveNav={!payment} />}
      {!welcome && !setup && !payment && (
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
