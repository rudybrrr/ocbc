"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import { Assistant } from "@/components/assistant";
import { EverydayActions } from "@/components/everyday-actions";
import { useStore } from "@/lib/store";
import type { BankerRequest } from "@/lib/types";

function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.setAttribute("closedby", "any");
    if ("closedBy" in HTMLDialogElement.prototype) return;

    const onClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handle = () => onClose();
    dialog.addEventListener("close", handle);
    return () => dialog.removeEventListener("close", handle);
  }, [onClose]);

  return ref;
}

export function PreferencesDialog() {
  const store = useStore();
  const ref = useModalDialog(store.prefsOpen, store.closePrefs);
  const { snapshot } = store;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="adjust-title"
      onClose={() => setConfirmReset(false)}
    >
      <form method="dialog">
        <div className="sheet-head">
          <h2 id="adjust-title">Adjust the bank</h2>
          <button type="submit" className="btn btn-quiet">
            Close
          </button>
        </div>
        <p className="lede">
          Mode, text size, and help can change at any time. A practice plan and a payment you already typed stay put.
        </p>
        <fieldset>
          <legend>Home layout</legend>
          <div className="choice-list">
            {(["calm", "classic"] as const).map((layout) => (
              <label className="choice" key={layout}>
                <input type="radio" name="home-layout" checked={snapshot.homeLayout === layout} onChange={() => store.setHomeLayout(layout)} />
                <span><strong>{layout === "calm" ? "Calm" : "Classic"}</strong><span>{layout === "calm" ? "Your balance and chosen everyday actions." : "The original home, including promotions."}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Assistance mode</legend>
          <div className="choice-list">
            <label className="choice">
              <input
                type="radio"
                name="adjust-mode"
                checked={snapshot.mode === "standard"}
                onChange={() => store.setMode("standard")}
              />
              <span>
                <strong>Standard</strong>
                <span>Accounts and activity on one screen.</span>
              </span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="adjust-mode"
                checked={snapshot.mode === "guided"}
                onChange={() => store.setMode("guided")}
              />
              <span>
                <strong>Guided</strong>
                <span>One next step and larger controls.</span>
              </span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Text size</legend>
          <div className="segmented">
            {(
              [
                ["default", "Default"],
                ["large", "Large"],
                ["largest", "Largest"],
              ] as const
            ).map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="adjust-text"
                  value={value}
                  checked={snapshot.textSize === value}
                  onChange={() => store.setTextSize(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <EverydayActions value={snapshot.everydayActions} onChange={store.setEverydayActions} />
        <fieldset>
          <legend>While you bank</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={snapshot.idleHelp}
              onChange={(event) => store.setToggle("idleHelp", event.target.checked)}
            />
            <span>Offer help if I pause on a screen</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={snapshot.plainLanguage}
              onChange={(event) => store.setToggle("plainLanguage", event.target.checked)}
            />
            <span>Plain language in the assistant and the investing walk</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={snapshot.offerPerson}
              onChange={(event) => store.setToggle("offerPerson", event.target.checked)}
            />
            <span>Offer a person when a payment fails</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={snapshot.readAmounts}
              onChange={(event) => store.setToggle("readAmounts", event.target.checked)}
            />
            <span>Show a button to hear amounts</span>
          </label>
        </fieldset>
        {confirmReset ? (
          <div className="confirm-reset" role="group" aria-labelledby="reset-title">
            <p id="reset-title">This clears the practice plan, payments, and chat on this phone.</p>
            <div className="row-actions">
              <button type="button" className="btn btn-primary" onClick={store.resetDemo}>
                Clear demo
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                Keep my setup
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-quiet align-start" onClick={() => setConfirmReset(true)}>
            Reset demo
          </button>
        )}
      </form>
    </dialog>
  );
}

export function PersonDialog() {
  const store = useStore();
  const ref = useModalDialog(store.personOpen, store.closePerson);
  const { snapshot } = store;
  const suggested =
    snapshot.screen === "invest" || snapshot.invest.done
      ? "Practice investing walk"
      : snapshot.lastIssue
        ? "A payment that did not go through"
        : "Getting around the bank";

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="person-title">
      <PersonForm
        key={store.personOpen ? suggested : "closed"}
        suggested={suggested}
        requestNumber={2048 + snapshot.bankerRequests.length}
        onClose={store.closePerson}
        onSave={store.logBanker}
      />
    </dialog>
  );
}

function PersonForm({
  suggested,
  requestNumber,
  onClose,
  onSave,
}: {
  suggested: string;
  requestNumber: number;
  onClose: () => void;
  onSave: (request: BankerRequest) => void;
}) {
  const [when, setWhen] = useState<"Morning" | "Afternoon" | "Evening">("Afternoon");
  const [topic, setTopic] = useState(suggested);
  const [saved, setSaved] = useState<BankerRequest | null>(null);

  if (saved) {
    return (
      <div>
        <h2 id="person-title">Request {saved.id} is saved</h2>
        <p className="lede">
          {saved.when} · {saved.topic}. This is a practice request on this phone. Nobody will call.
        </p>
        <form method="dialog">
          <button type="submit" className="btn btn-primary">
            Done
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      method="post"
      action="#person"
      onSubmit={(event) => {
        event.preventDefault();
        const request: BankerRequest = {
          id: `AA-${requestNumber}`,
          when,
          topic: topic.trim() || suggested,
          at: new Date().toISOString(),
        };
        onSave(request);
        setSaved(request);
      }}
    >
      <div className="sheet-head">
        <h2 id="person-title">Talk to a person</h2>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="lede">Log a practice callback. This demo does not place a call or send a message.</p>
      <fieldset>
        <legend>Preferred time</legend>
        <div className="choice-list">
          {(["Morning", "Afternoon", "Evening"] as const).map((slot) => (
            <label className="choice" key={slot}>
              <input
                type="radio"
                name="when"
                value={slot}
                checked={when === slot}
                onChange={() => setWhen(slot)}
                required
              />
              <span>
                <strong>{slot}</strong>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="topic">What it is about</label>
        <input
          id="topic"
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          required
          maxLength={80}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Log request
      </button>
    </form>
  );
}

export function AssistantDialog() {
  const store = useStore();
  const ref = useModalDialog(store.snapshot.helpOpen, store.closeHelp);

  useEffect(() => {
    if (!store.snapshot.helpOpen) return;
    document.getElementById("assist-title")?.focus();
  }, [store.snapshot.helpOpen]);

  return (
    <dialog ref={ref} className="drawer" aria-labelledby="assist-title">
      <Assistant />
    </dialog>
  );
}
