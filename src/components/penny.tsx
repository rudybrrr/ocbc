import type { Ref } from "react";

// penny is inlined instead of loaded as an image so her eyes and mouth stay addressable
// by class name, which lets us animate them later without changing this structure
export function Penny({
  className = "",
  waving = false,
  ref,
}: {
  className?: string;
  waving?: boolean;
  ref?: Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      className={`penny-svg ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* ids are prefixed because svg ids are global to the whole page */}
        <radialGradient id="penny-face" cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor="#FF6155" />
          <stop offset="0.55" stopColor="#E2231A" />
          <stop offset="1" stopColor="#B0140D" />
        </radialGradient>
        <linearGradient id="penny-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A0C07" />
          <stop offset="0.5" stopColor="#A3120C" />
          <stop offset="1" stopColor="#6A0A05" />
        </linearGradient>
        <radialGradient id="penny-eye-fill" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E4DDD3" />
        </radialGradient>
      </defs>
      <g className="penny-body">
        <circle cx="150" cy="150" r="112" fill="url(#penny-edge)" transform="translate(0 10)" />
        <circle cx="150" cy="148" r="112" fill="url(#penny-face)" />
        <circle cx="150" cy="148" r="92" fill="none" stroke="#FF8378" strokeWidth="5" opacity="0.55" />
        <circle
          cx="150"
          cy="148"
          r="92"
          fill="none"
          stroke="#9E110B"
          strokeWidth="2"
          opacity="0.5"
          transform="translate(0 3)"
        />
        <path
          d="M78 92 C96 66 124 52 152 52"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
      </g>
      <g className="penny-eye penny-eye-left">
        <ellipse cx="120" cy="140" rx="21" ry="24" fill="url(#penny-eye-fill)" />
        <circle cx="123" cy="144" r="11" fill="#151313" />
        <circle cx="118" cy="138" r="3.5" fill="#FFFFFF" />
      </g>
      <g className="penny-eye penny-eye-right">
        <ellipse cx="180" cy="140" rx="21" ry="24" fill="url(#penny-eye-fill)" />
        <circle cx="183" cy="144" r="11" fill="#151313" />
        <circle cx="178" cy="138" r="3.5" fill="#FFFFFF" />
      </g>
      <path
        className="penny-mouth"
        d="M134 188 Q150 200 166 188"
        stroke="#6E0B06"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <g className="penny-cheeks">
        <ellipse cx="92" cy="178" rx="11" ry="6" fill="#FF7B70" opacity="0.55" />
        <ellipse cx="208" cy="178" rx="11" ry="6" fill="#FF7B70" opacity="0.55" />
      </g>
      {/* the hand pivots at the wrist (248, 150), set in css with transform-box: view-box */}
      {waving && (
        <g className="penny-hand">
          <path d="M248 150 L262 112" stroke="#7A0C07" strokeWidth="18" strokeLinecap="round" />
          <path d="M248 150 L262 112" stroke="#C81A12" strokeWidth="11" strokeLinecap="round" />
          <ellipse cx="247" cy="96" rx="9" ry="12" fill="url(#penny-face)" stroke="#7A0C07" strokeWidth="4" transform="rotate(-25 247 96)" />
          <circle cx="266" cy="94" r="22" fill="url(#penny-face)" stroke="#7A0C07" strokeWidth="4" />
          <path d="M256 81 Q265 76 274 80" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}
