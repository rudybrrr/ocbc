import { flushSync } from "react-dom";

export function withTransition(update: () => void, focusId?: string) {
  const focus = () => {
    document.querySelector<HTMLElement>(".oc-main")?.scrollTo(0, 0);
    if (!focusId) return;
    document.getElementById(focusId)?.focus();
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    update();
    requestAnimationFrame(focus);
    return;
  }

  const transition = document.startViewTransition(() => {
    flushSync(update);
  });
  // a quick second tap skips this transition; the update still runs, so the rejection is expected
  transition.ready.catch(() => {});
  transition.finished.then(focus, focus);
}
