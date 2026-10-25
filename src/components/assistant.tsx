"use client";

import { useEffect, useRef, useState } from "react";
import { IgniteImage, SpriteIcon } from "@/components/ocbc-ui";
import { FinancialEducationResponse } from "@/components/chat-response";
import { suggestions } from "@/lib/assistant";
import { useStore } from "@/lib/store";
import type { ChatAction } from "@/lib/types";
import { useListen } from "@/lib/use-voice";

export function Assistant() {
  const store = useStore();
  const { snapshot, assistContext } = store;
  const [draft, setDraft] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voice = useListen((text) => { setDraft(text); setVoiceStatus("Review what I heard, then choose Send."); }, setVoiceStatus, snapshot.helpOpen);
  const prompts = suggestions(assistContext);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [snapshot.messages.length]);



  const context =
    snapshot.lastIssue
      ? "This payment stopped. Ask what to change."
      : ["move", "amount", "review", "receipt"].includes(snapshot.screen)
        ? "Ask about the payment on this screen."
        : snapshot.screen === "invest"
          ? "Ask about this practice walk. It is education, not advice."
          : snapshot.screen === "activity"
            ? "Ask what a transaction means."
            : "Ask about the money you can use today.";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    store.ask(trimmed);
    setDraft("");
  };

  return (
    <section className="assist" aria-labelledby="assist-title">
      <header className="assist-head">
        <div className="assist-brand">
          <IgniteImage
            src="/ignite/prototype/bankbuddy-avatar.png"
            width={96}
            height={96}
            alt=""
            className="assist-avatar"
          />
          <div>
            <h2 id="assist-title" tabIndex={-1}>BankBuddy</h2>
            <p className="assist-subtitle">Your local banking guide</p>
          </div>
        </div>
        <div className="assist-head-copy">
          <p>{context}</p>
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
            Practice guidance, not financial advice. Voice input uses Groq.
          </p>
        )}
        {snapshot.messages.map((message, index) => {
          const last = index === snapshot.messages.length - 1;
          if (message.role === "assistant") {
            return (
              <FinancialEducationResponse
                key={message.id}
                message={message}
                onAction={(action) => run(action, store.runAction, send)}
                latest={last}
              />
            );
          }
          return (
            <article key={message.id} className="bubble user">
              <p>{message.text}</p>
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
          ref={inputRef}
          id="assist-input"
          name="question"
          value={draft}
          maxLength={240}
          enterKeyHint="send"
          placeholder="Ask about a balance, a fund, or a payment"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          className="assist-voice"
          onClick={() => { setVoiceStatus(""); void voice.listen(); }}
          disabled={!voice.supported || voice.state === "transcribing"}
          aria-label={voice.state === "listening" ? "Stop recording" : "Speak your question"}
        >
          <SpriteIcon name="microphone-accent" size={20} />
        </button>
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
      <p className="assist-voice-status" role="status" aria-live="polite">{voice.state === "listening" ? "Listening…" : voice.state === "transcribing" ? "Transcribing…" : voiceStatus}</p>
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
