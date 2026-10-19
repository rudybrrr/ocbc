"use client";

import { Activity } from "@/components/activity";
import { AssistantDialog, PersonDialog, PreferencesDialog } from "@/components/dialogs";
import { Home } from "@/components/home";
import { Icon } from "@/components/icons";
import { Invest } from "@/components/invest";
import { MoveMoney } from "@/components/move-money";
import { Onboarding } from "@/components/onboarding";
import { useStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

const NAV: { id: Screen | "ask"; label: string; icon: "home" | "move" | "invest" | "ask" }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "move", label: "Move", icon: "move" },
  { id: "invest", label: "Invest", icon: "invest" },
  { id: "ask", label: "Ask", icon: "ask" },
];

export function BankApp() {
  const store = useStore();
  const { snapshot } = store;

  if (!store.ready) {
    return (
      <div className="splash">
        <p className="brand">
          <span className="brand-mark">OCBC</span> Adaptive Assist
        </p>
      </div>
    );
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div
        className="stage"
        data-screen={snapshot.onboarded ? snapshot.screen : "onboarding"}
        data-mode={snapshot.onboarded ? snapshot.mode : undefined}
      >
        <header className="header">
          <div className="brand-row">
            <p className="brand">
              <span className="brand-mark">OCBC</span> Adaptive Assist
            </p>
            {snapshot.onboarded && (
              <button type="button" className="btn btn-quiet" onClick={store.openPrefs}>
                <Icon name="adjust" />
                Adjust
              </button>
            )}
          </div>
          <p className="status">Practice bank. Figures are fictional.</p>
          {snapshot.onboarded && (
            <div className="mode-switch" role="group" aria-label="Assistance mode">
              <button
                type="button"
                aria-pressed={snapshot.mode === "standard"}
                onClick={() => store.setMode("standard")}
              >
                Standard
              </button>
              <button
                type="button"
                aria-pressed={snapshot.mode === "guided"}
                onClick={() => store.setMode("guided")}
              >
                Guided
              </button>
            </div>
          )}
        </header>
        <main id="main" className="main">
          {!snapshot.onboarded ? (
            <Onboarding />
          ) : snapshot.screen === "move" ? (
            <MoveMoney />
          ) : snapshot.screen === "invest" ? (
            <Invest />
          ) : snapshot.screen === "activity" ? (
            <Activity />
          ) : (
            <Home />
          )}
        </main>
        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => {
            const current =
              item.id === "ask" ? snapshot.helpOpen : snapshot.screen === item.id && !snapshot.helpOpen;
            return (
              <button
                key={item.id}
                type="button"
                className="nav-btn"
                aria-current={current ? "page" : undefined}
                onClick={() => (item.id === "ask" ? store.openHelp() : store.go(item.id))}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <AssistantDialog />
      <p className="sr-only" aria-live="polite">
        {store.announce}
      </p>
      <PreferencesDialog />
      <PersonDialog />
    </>
  );
}
