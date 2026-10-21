"use client";

import { useEffect, useState } from "react";
import { Penny } from "@/components/penny";
import type { useCompanion } from "@/lib/use-companion";
import { speak, stopSpeaking, useListen } from "@/lib/use-voice";

export function Companion({ companion }: { companion: ReturnType<typeof useCompanion> }) {
  const [draft, setDraft] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const voice = useListen(companion.ask);
  const { open, line } = companion;

  // speech is an external system, so syncing it to the current line is a proper use of an effect.
  // the short wait means typing "100" is spoken once instead of restarting on every key
  useEffect(() => {
    if (!open || !voiceOn) return;
    const timer = window.setTimeout(() => speak(line), 500);
    return () => window.clearTimeout(timer);
  }, [open, line, voiceOn]);

  useEffect(() => () => stopSpeaking(), []);

  if (!open) return null;

  const send = (text: string) => {
    if (!text.trim()) return;
    companion.ask(text);
    setDraft("");
  };

  return (
    <aside className="penny" aria-label="Penny, your banking companion">
      <div className="penny-row">
        <Penny className="penny-avatar" />
        <p className="penny-line" aria-live="polite">
          {line}
        </p>
        <button className="penny-close" aria-label="Close Penny" onClick={companion.dismiss}>
          ×
        </button>
      </div>
      <div className="penny-chips">
        {companion.guiding ? (
          <button onClick={() => companion.ask("stop")}>Stop guiding</button>
        ) : (
          <>
            <button onClick={companion.startGuide}>Yes, guide me</button>
            <button onClick={companion.dismiss}>Not now</button>
          </>
        )}
        {companion.showFixedDepositAction && (
          <button type="button" onClick={companion.openFixedDeposit}>
            Explore Fixed Deposits
          </button>
        )}
        <button
          aria-pressed={voiceOn}
          onClick={() => {
            if (voiceOn) stopSpeaking();
            setVoiceOn(!voiceOn);
          }}
        >
          {voiceOn ? "Sound on" : "Sound off"}
        </button>
      </div>
      <form
        className="penny-ask"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <input
          aria-label="Ask Penny"
          placeholder="Try “pay Mum 10”"
          maxLength={160}
          enterKeyHint="send"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        {voice.supported && (
          <button
            type="button"
            className="penny-mic"
            aria-pressed={voice.listening}
            onClick={voice.listen}
          >
            {voice.listening ? "Listening…" : "Speak"}
          </button>
        )}
        <button type="submit" className="penny-send" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}
