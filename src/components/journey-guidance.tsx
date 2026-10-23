"use client";

import { OcbcButton } from "@/components/ocbc-ui";
import { useStore } from "@/lib/store";

export function GuidanceChoice() {
  const store = useStore();
  return (
    <section className="fd-screen" aria-label="Journey guidance choice">
      <h2>How would you like to continue?</h2>
      <p>Guidance explains the process, terms, fees and risks. You make your own choices.</p>
      <p>This choice applies to this journey only. Your preferences stay the same.</p>
      <OcbcButton onClick={() => store.chooseJourneyGuidance(true)}>Guide me through this</OcbcButton>
      <OcbcButton variant="secondary" onClick={() => store.chooseJourneyGuidance(false)}>I know what I&apos;m doing</OcbcButton>
      <JourneyHelp />
    </section>
  );
}

export function JourneyHelp() {
  const store = useStore();
  return (
    <div className="stack-actions">
      <OcbcButton variant="secondary" onClick={store.openPerson}>Talk to a person</OcbcButton>
      <OcbcButton variant="text" onClick={() => store.go("home")}>Exit</OcbcButton>
    </div>
  );
}
