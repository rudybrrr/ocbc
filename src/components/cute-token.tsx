import { useId } from "react";

// A glossy red ball with slanted pill eyes. "half" is a faded, drowsy ball for a partly used token; "empty" is a sleeping outline.
export function CuteToken({ state = "full", size = 28, className = "" }: { state?: "full" | "half" | "empty"; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const full = state === "full";
  const half = state === "half";
  return (
    <svg className={`cute-token cute-token-${state} ${className}`} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx="36%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ff8a82" />
          <stop offset=".55" stopColor="#ee2d2d" />
          <stop offset="1" stopColor="#c1121c" />
        </radialGradient>
        <radialGradient id={`${id}h`} cx="36%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ffe3e0" />
          <stop offset="1" stopColor="#f5b8b4" />
        </radialGradient>
      </defs>
      {state === "empty" ? (
        <circle cx="20" cy="20" r="17" fill="#f6f1f1" stroke="#dccaca" strokeWidth="2" strokeDasharray="4 3" />
      ) : (
        <>
          <circle cx="20" cy="20" r="18" fill={`url(#${id}${full ? "g" : "h"})`} />
          <ellipse cx="14" cy="9.5" rx="6" ry="2.8" fill="#fff" opacity={full ? ".4" : ".55"} transform="rotate(-28 14 9.5)" />
        </>
      )}
      {full ? (
        <>
          <rect x="11.2" y="14.5" width="4.4" height="9" rx="2.2" fill="#fff" transform="rotate(-18 13.4 19)" />
          <rect x="23.6" y="14.5" width="4.4" height="9" rx="2.2" fill="#fff" transform="rotate(-18 25.8 19)" />
        </>
      ) : (
        <>
          <path d="M11.5 20q2.5 2.4 5 0M23.5 20q2.5 2.4 5 0" fill="none" stroke={half ? "#fff" : "#cdb8b8"} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
