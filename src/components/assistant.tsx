"use client";

import { useEffect, useRef, useState } from "react";
import { IgniteImage, SpriteIcon } from "@/components/ocbc-ui";
import { FinancialEducationResponse } from "@/components/chat-response";
import { suggestions } from "@/lib/assistant";
import { useStore } from "@/lib/store";
import type { ChatAction } from "@/lib/types";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechCapableWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function Assistant() {
  const store = useStore();
  const { snapshot, assistContext } = store;
  const [draft, setDraft] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const prompts = suggestions(assistContext);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [snapshot.messages.length]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const context =
    snapshot.screen === "move"
      ? snapshot.lastIssue
        ? "This payment stopped. Ask what to change."
        : "Ask about the payment on this screen."
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

  const startVoice = () => {
    const speechWindow = window as SpeechCapableWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus("Voice input is not available in this browser. Type your request below.");
      inputRef.current?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-SG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setDraft(transcript);
        setVoiceStatus("Review what I heard, then choose Send.");
      } else {
        setVoiceStatus("I did not catch that. Type your request below.");
      }
    };
    recognition.onerror = () => setVoiceStatus("I could not hear that. Type your request below.");
    recognition.onend = () => {
      recognitionRef.current = null;
    };
    setVoiceStatus("Listening… Say “Pay someone” or ask a question.");
    recognition.start();
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
            Replies stay on this phone. They explain this practice bank and are not advice for you.
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
          onClick={startVoice}
          aria-label="Speak your question"
        >
          <SpriteIcon name="microphone-accent" size={20} />
        </button>
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
      <p className="assist-voice-status" role="status" aria-live="polite">{voiceStatus}</p>
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
