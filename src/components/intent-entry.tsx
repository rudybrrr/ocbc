"use client";

import { useEffect, useRef, useState } from "react";
import { SpriteIcon } from "@/components/ocbc-ui";
import { requestIntent } from "@/lib/intent";
import { JOURNEYS, type Intent } from "@/lib/journeys";
import { useListen } from "@/lib/use-voice";

export function IntentEntry({ onStart }: { onStart: (intent: Intent) => void }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState<Intent | null>(null);
  const [error, setError] = useState("");
  const previous = useRef("");
  const request = useRef(0);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const route = async (input: string) => {
    const clean = input.trim();
    if (!active.current || !clean || clean.length > 500) return;
    const id = ++request.current;
    setPending(true);
    setError("");
    const query = reply && previous.current && /^\$?\d+(?:\.\d{1,2})?(?:\s*dollars?)?$/i.test(clean) ? `${previous.current} ${clean}` : clean;
    const result = await requestIntent(query);
    if (!active.current || id !== request.current) return;
    previous.current = query;
    setPending(false);
    if (result.journey === "out_of_scope" || result.journey === "unclear" || result.confidence < 0.75) {
      setReply(result);
      setText("");
    } else onStart(result);
  };
  const voice = useListen((spoken) => { setText(spoken); void route(spoken); }, setError);

  return (
    <section className="oc-intent" aria-labelledby="intent-title">
      <h2 id="intent-title">I want to…</h2>
      <form onSubmit={(event) => { event.preventDefault(); void route(text); }}>
        <input aria-label="What would you like to do?" placeholder="e.g. Send $50 to Mum" maxLength={500} value={text} onChange={(event) => setText(event.target.value)} disabled={pending} />
        <button type="button" className="oc-intent-mic" aria-label={voice.state === "listening" ? "Stop recording" : "Speak your request"} disabled={!voice.supported || pending || voice.state === "transcribing"} onClick={() => void voice.listen()}>
          <SpriteIcon name="microphone-accent" size={24} />
        </button>
        <button type="submit" className="oc-link" disabled={pending || !text.trim()}>Go</button>
      </form>
      <div role="status" aria-live="polite">
        {pending && <p>Finding the right place…</p>}
        {voice.state !== "idle" && <p>{voice.state === "listening" ? "Listening… tap the mic to finish." : "Transcribing…"}</p>}
        {error && <p>{error}</p>}
        {reply && <>
          <p>{reply.journey === "out_of_scope" ? "This app cannot give investment advice. You can explore the guided investing process or talk to a person." : reply.clarify_question}</p>
          <div className="oc-intent-options">
            {(reply.journey === "out_of_scope" ? ["start_investing", "talk_to_person"] as const : reply.options ?? []).slice(0, 3).map((journey) => <button type="button" className="btn btn-secondary" key={journey} onClick={() => journey === "unclear" || journey === "out_of_scope" ? setText("") : onStart({ journey, confidence: 1, slots: reply.slots })}>{JOURNEYS[journey]}</button>)}
          </div>
        </>}
      </div>
    </section>
  );
}
