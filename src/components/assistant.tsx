"use client";

import { useEffect, useRef, useState } from "react";
import { suggestions } from "@/lib/assistant";
import { useStore } from "@/lib/store";
import type { ChatAction } from "@/lib/types";

export function Assistant() {
  const store = useStore();
  const { snapshot, assistContext } = store;
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const prompts = suggestions(assistContext);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [snapshot.messages.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    store.ask(trimmed);
    setDraft("");
  };

  return (
    <section className="assist" aria-labelledby="assist-title">
      <header className="assist-head">
        <div>
          <h2 id="assist-title" tabIndex={-1}>
            Ask
          </h2>
          <p>Plain answers about this practice bank. Not personal advice.</p>
        </div>
        <button type="button" className="btn btn-quiet assist-close" onClick={store.closeHelp}>
          Close
        </button>
      </header>
      <div className="transcript">
        <p className="sr-only" aria-live="polite">
          {snapshot.messages.filter((message) => message.role === "assistant").at(-1)?.text ?? ""}
        </p>
        {snapshot.messages.length === 0 && (
          <p className="assist-empty">
            Try a question in your own words, or use one of the prompts below.
          </p>
        )}
        {snapshot.messages.map((message, index) => {
          const last = index === snapshot.messages.length - 1;
          return (
            <article key={message.id} className={`bubble ${message.role}`}>
              <p>{message.text}</p>
              {message.role === "assistant" && message.actions && message.actions.length > 0 && (
                <div className="bubble-actions">
                  {message.actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => run(action, store.runAction, send)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
              {last ? <span className="sr-only">Latest reply</span> : null}
            </article>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="prompts">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" className="chip" onClick={() => send(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
      <form
        className="composer"
        method="post"
        action="#ask"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <label className="sr-only" htmlFor="assist-input">
          Your question
        </label>
        <input
          id="assist-input"
          name="question"
          value={draft}
          maxLength={240}
          enterKeyHint="send"
          placeholder="Ask about a balance, a fund, or a payment"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

function run(
  action: ChatAction,
  runAction: (action: ChatAction) => void,
  send: (text: string) => void,
) {
  if (action.type === "ask") {
    send(action.query);
    return;
  }
  runAction(action);
}
