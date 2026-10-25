"use client";

let request: AbortController | undefined;
let player: HTMLAudioElement | undefined;
let audioUrl: string | undefined;
let generation = 0;
let availability: Promise<boolean> | undefined;

function browserSpeech(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-SG";
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  generation += 1;
  request?.abort();
  request = undefined;
  if (player) {
    player.pause();
    player.removeAttribute("src");
    player.load();
    player = undefined;
  }
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = undefined;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// One voice at a time. Closing/muting Penny or starting a recording cancels both
// pending generation and playback, so an old reply can never speak over a new one.
export function speak(raw: string) {
  stopSpeaking();
  const text = raw.replace(/[“”]/g, "").trim();
  if (!text) return;
  const current = generation;
  const controller = new AbortController();
  request = controller;
  availability ??= fetch("/api/speech", { cache: "no-store", signal: AbortSignal.timeout(4000) })
    .then(async (response) => response.ok && (await response.json()).enabled === true)
    .catch(() => false);

  void (async () => {
    try {
      if (!await availability) {
        if (current === generation) browserSpeech(text);
        return;
      }
      if (current !== generation) return;
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      if (!response.ok) throw new Error("Speech unavailable");
      const blob = await response.blob();
      if (current !== generation) return;
      audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      player = audio;
      const release = () => { if (current === generation) stopSpeaking(); };
      audio.onended = release;
      audio.onerror = () => {
        if (current !== generation) return;
        stopSpeaking();
        browserSpeech(text);
      };
      await audio.play();
    } catch {
      if (current !== generation || controller.signal.aborted) return;
      stopSpeaking();
      browserSpeech(text);
    }
  })();
}
