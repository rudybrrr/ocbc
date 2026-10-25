import { flushSync } from "react-dom";

let pendingFocus: number | undefined;

export function withTransition(update: () => void, focusId?: string) {
  if (pendingFocus !== undefined) cancelAnimationFrame(pendingFocus);
  const focus = () => {
    pendingFocus = undefined;
    document.querySelector<HTMLElement>(".oc-main")?.scrollTo(0, 0);
    if (!focusId) return;
    (document.getElementById(focusId) ?? document.getElementById("oc-main"))?.focus({ preventScroll: true });
  };

  // Keep the live screen interactive while Motion handles its short entrance.
  // A document snapshot would hide that animation and postpone focus until it ends.
  flushSync(update);
  pendingFocus = requestAnimationFrame(focus);
}
