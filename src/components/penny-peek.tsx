"use client";

import { useRef, useState, type AnimationEvent } from "react";
import { Penny } from "@/components/penny";
import type { useCompanion } from "@/lib/use-companion";

// exit keyframes, full motion and reduced motion. other animations bubble up from penny's
// face and hand, so only these mean the peek has finished leaving
const EXITS = ["penny-peek-exit", "penny-peek-fade-out", "penny-peek-handoff"];

// penny peeking in from the corner of the phone screen. it floats over the app instead of
// taking layout space, and stays mounted until its exit animation has played
export function PennyPeek({
  companion,
  aboveNav,
}: {
  companion: ReturnType<typeof useCompanion>;
  aboveNav: boolean;
}) {
  const { peeking, peekLine } = companion;
  const figure = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(peeking);
  const [line, setLine] = useState(peekLine);

  // adjusting state during render: show again as soon as she peeks, and hold her line
  // so it does not change while she slides away after the screen changes
  if (peeking && !mounted) setMounted(true);
  if (peeking && line !== peekLine) setLine(peekLine);

  if (!mounted) return null;

  // tapped open: the panel avatar takes over this penny, so only the bubble fades out here
  const handoff = !peeking && companion.open;
  const leaving = peeking ? "" : handoff ? "penny-peek-handoff" : "penny-peek-leaving";

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && EXITS.includes(event.animationName))
      setMounted(false);
  };

  return (
    <div
      className={`penny-peek ${aboveNav ? "penny-peek-above-nav" : ""} ${leaving}`}
      data-penny-peek
      onAnimationEnd={onAnimationEnd}
    >
      <button
        className="penny-peek-main"
        aria-label={`Penny: ${line} Tap for help.`}
        onClick={() => {
          const rect = figure.current?.getBoundingClientRect();
          if (rect) companion.expand(rect);
        }}
        disabled={!peeking}
      >
        <span className="penny-peek-bubble">
          <span aria-live="polite">{line}</span>
        </span>
        <Penny ref={figure} className="penny-peek-figure" waving />
      </button>
      <button
        className="penny-peek-close"
        aria-label="Dismiss Penny"
        onClick={companion.dismiss}
        disabled={!peeking}
      >
        ×
      </button>
    </div>
  );
}
