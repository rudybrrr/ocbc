"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/mini";

// Content is replaced immediately: no outgoing controls, delayed focus or queued steps.
// Only animate a change of screen/step, never edits to a value within that screen.
export function useContentMotion<T extends HTMLElement>(identity: string | number) {
  const ref = useRef<T>(null);
  const previous = useRef(identity);

  useEffect(() => {
    const changed = previous.current !== identity;
    const backwards = typeof identity === "number" && typeof previous.current === "number" && identity < previous.current;
    previous.current = identity;
    const element = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!changed || !element || reduced.matches || document.documentElement.dataset.motionInput === "keyboard") return;

    const original = { opacity: element.style.opacity, transform: element.style.transform };
    let active = true;
    const animation = animate(element, {
      opacity: [0.78, 1],
      transform: [`translateY(${backwards ? -6 : 6}px)`, "translateY(0px)"],
    }, { duration: 0.2, ease: [0.23, 1, 0.32, 1] });
    // Cancel also removes the transform so overlays keep their usual containing block.
    const cancel = () => {
      if (!active) return;
      active = false;
      animation.cancel();
      element.style.opacity = original.opacity;
      element.style.transform = original.transform;
    };
    animation.then(cancel, cancel);
    reduced.addEventListener("change", cancel);
    return () => {
      cancel();
      reduced.removeEventListener("change", cancel);
    };
  }, [identity]);

  return ref;
}

export function useMotionInput() {
  useEffect(() => {
    const keyboard = () => { document.documentElement.dataset.motionInput = "keyboard"; };
    const pointer = () => { document.documentElement.dataset.motionInput = "pointer"; };
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
      delete document.documentElement.dataset.motionInput;
    };
  }, []);
}
