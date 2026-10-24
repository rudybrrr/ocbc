"use client";

import { useRef, useState } from "react";

const HANDLE = 44;
const INSET = 4;

// A slider like the real app's, plus a tap or Enter/Space alternative so it also works without dragging.
export function SlideToPay({ onConfirm, label = "Slide to pay" }: { onConfirm: () => void; label?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ origin: number; moved: boolean } | null>(null);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const max = () => Math.max(0, (track.current?.clientWidth ?? 0) - HANDLE - INSET * 2);
  const finish = () => {
    setX(max());
    onConfirm();
    window.setTimeout(() => setX(0), 400);
  };

  return (
    <div className="oc-slide" ref={track} data-guide="confirm">
      <span className="oc-slide-label" aria-hidden="true">{label}</span>
      <button
        type="button"
        className={`oc-slide-handle ${dragging ? "is-dragging" : ""}`}
        style={{ transform: `translateX(${x}px)` }}
        aria-label={`${label}. Tap or press Enter to confirm this practice payment.`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { origin: event.clientX - x, moved: false };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const next = Math.min(max(), Math.max(0, event.clientX - drag.current.origin));
          if (next > 6) drag.current.moved = true;
          setX(next);
        }}
        onPointerUp={() => {
          const state = drag.current;
          drag.current = null;
          setDragging(false);
          if (!state) return;
          if (!state.moved || x >= max() * 0.85) finish();
          else setX(0);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
          setX(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            finish();
          }
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 6 6 6-6 6M12 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}
