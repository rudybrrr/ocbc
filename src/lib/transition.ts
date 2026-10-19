import { flushSync } from "react-dom";

export function withTransition(update: () => void, focusId?: string) {
  const focus = () => {
    document.getElementById("main")?.scrollTo(0, 0);
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
  transition.finished.finally(focus);
}
