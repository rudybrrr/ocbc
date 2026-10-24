import { useId } from "react";

// A small coin with a face. "half" is a drowsy coin for a partly used token; "empty" is a sleeping outline.
export function CuteToken({ state = "full", size = 28, className = "" }: { state?: "full" | "half" | "empty"; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const awake = state === "full";
  return (
    <svg className={`cute-token cute-token-${state} ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffe48a" />
          <stop offset="1" stopColor="#f7b32b" />
        </radialGradient>
      </defs>
      {state === "empty" ? (
        <circle cx="20" cy="20" r="17" fill="#f1f3f4" stroke="#d3d8db" strokeWidth="2" strokeDasharray="4 3" />
      ) : (
        <>
          <circle cx="20" cy="20" r="18" fill={state === "half" ? "#f6e6b8" : `url(#${id}g)`} stroke={state === "half" ? "#e2cf9a" : "#e29a0e"} strokeWidth="2" />
          {awake && <path d="M10 13a12 12 0 0 1 9-5" fill="none" stroke="#fff7d6" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />}
        </>
      )}
      {awake ? (
        <>
          <circle cx="15" cy="19" r="2.1" fill="#6b3f05" />
          <circle cx="25" cy="19" r="2.1" fill="#6b3f05" />
          <circle cx="15.7" cy="18.3" r=".7" fill="#fff" />
          <circle cx="25.7" cy="18.3" r=".7" fill="#fff" />
          <path d="M15.5 24.5q4.5 4 9 0" fill="none" stroke="#6b3f05" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="11" cy="24" rx="2.6" ry="1.8" fill="#ff8d8d" opacity=".55" />
          <ellipse cx="29" cy="24" rx="2.6" ry="1.8" fill="#ff8d8d" opacity=".55" />
        </>
      ) : (
        <>
          <path d="M12.5 19q2.5 2.4 5 0M22.5 19q2.5 2.4 5 0" fill="none" stroke={state === "half" ? "#9a7b2e" : "#b6bcc0"} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 25.5q3 1.8 6 0" fill="none" stroke={state === "half" ? "#9a7b2e" : "#b6bcc0"} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
