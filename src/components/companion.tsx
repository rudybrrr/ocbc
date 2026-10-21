"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Penny } from "@/components/penny";
import type { useCompanion } from "@/lib/use-companion";
import { speak, stopSpeaking, useListen } from "@/lib/use-voice";

export function Companion({
  companion,
  aboveNav,
}: {
  companion: ReturnType<typeof useCompanion>;
  aboveNav: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const voice = useListen(companion.ask, companion.notify);
  const { open, line, origin } = companion;
  const avatar = useRef<SVGSVGElement>(null);

  // opened by tapping the peek: the avatar starts where the peeking penny was and flies
  // into place, so it reads as one penny moving rather than one leaving and another arriving.
  // a layout effect so the first painted frame is already at the peek spot
  useLayoutEffect(() => {
    const el = avatar.current;
    if (!open || !origin || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = el.getBoundingClientRect();
    const dx = origin.left + origin.width / 2 - (to.left + to.width / 2);
    const dy = origin.top + origin.height / 2 - (to.top + to.height / 2);
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${origin.width / to.width})` }, { transform: "none" }],
      { duration: 600, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
    );
  }, [open, origin]);

  // speech is an external system, so syncing it to the current line is a proper use of an effect.
  // the short wait means typing "100" is spoken once instead of restarting on every key
  useEffect(() => {
    if (!open || !voiceOn) return;
    const timer = window.setTimeout(() => speak(line), 500);
    return () => window.clearTimeout(timer);
  }, [open, line, voiceOn]);

  useEffect(() => () => stopSpeaking(), []);

  // penny can only listen while her panel is open, so a small button keeps her one tap away.
  // it hides while she peeks, so the corner never shows two pennies at once
  if (!open)
    return companion.peeking ? null : (
      <button
        className={`penny-launcher ${aboveNav ? "above-nav" : ""}`}
        aria-label="Open Penny"
        onClick={companion.openPanel}
      >
        <Penny />
      </button>
    );

  const send = (text: string) => {
    if (!text.trim()) return;
    companion.ask(text);
    setDraft("");
  };

  return (
    <aside className={`penny ${origin ? "penny-from-peek" : ""}`} aria-label="Penny, your banking companion">
      <div className="penny-row">
        <Penny ref={avatar} className="penny-avatar" waving />
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
            aria-pressed={voice.state === "listening"}
            disabled={voice.state === "transcribing"}
            onClick={voice.listen}
          >
            {voice.state === "listening"
              ? "Stop"
              : voice.state === "transcribing"
                ? "Hearing…"
                : "Speak"}
          </button>
        )}
        <button type="submit" className="penny-send" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </aside>
  );
}
