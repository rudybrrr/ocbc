"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// how quiet counts as silence, and how long it must last before we stop recording
const SILENCE_LEVEL = 0.02;
const SILENCE_MS = 1200;
const MAX_RECORD_MS = 8000;

const noop = () => () => {};

function canRecord() {
  return !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

// plain functions instead of a hook because speaking holds no react state
export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[“”]/g, ""));
  utterance.lang = "en-GB";
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export type ListenState = "idle" | "listening" | "transcribing";

// records the mic in the browser, then sends the clip to our /api/transcribe route,
// which asks groq whisper for the text. the api key stays on the server
export function useListen(onText: (text: string) => void, onError: (text: string) => void) {
  // reading support through useSyncExternalStore gives false on the server and the real value
  // in the browser, which avoids a hydration mismatch without a setState in an effect
  const supported = useSyncExternalStore(noop, canRecord, () => false);
  const [state, setState] = useState<ListenState>("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  const closed = useRef(false);

  // if penny closes while recording, release the mic and throw the clip away
  useEffect(() => {
    closed.current = false;
    return () => {
      closed.current = true;
      recorder.current?.stop();
    };
  }, []);

  const send = async (clip: Blob) => {
    setState("transcribing");
    try {
      const form = new FormData();
      const ext = clip.type.includes("mp4") ? "mp4" : clip.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", clip, `speech.${ext}`);
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await response.json()) as { text?: string };
      if (!response.ok || !data.text) throw new Error("no text");
      onText(data.text);
    } catch {
      onError("Sorry, I could not hear that. Try again, or type your question.");
    } finally {
      setState("idle");
    }
  };

  const listen = async () => {
    // a second tap while recording means "i am done talking"
    if (recorder.current) {
      recorder.current.stop();
      return;
    }
    stopSpeaking();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError("I need microphone access to listen. You can type instead.");
      return;
    }

    const media = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let heard = false;
    let quietSince = performance.now();
    const started = performance.now();

    // silence detection: measure loudness every frame and stop once the user has spoken
    // and then gone quiet, so they do not need to tap a stop button
    const watch = () => {
      if (media.state !== "recording") return;
      analyser.getFloatTimeDomainData(samples);
      const level = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      const now = performance.now();
      if (level > SILENCE_LEVEL) {
        heard = true;
        quietSince = now;
      }
      if ((heard && now - quietSince > SILENCE_MS) || now - started > MAX_RECORD_MS) {
        media.stop();
        return;
      }
      requestAnimationFrame(watch);
    };

    media.ondataavailable = (event) => chunks.push(event.data);
    media.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      audio.close();
      recorder.current = null;
      if (closed.current) return;
      if (!heard) {
        setState("idle");
        onError("I did not hear anything. Tap Speak and try again.");
        return;
      }
      send(new Blob(chunks, { type: media.mimeType }));
    };

    recorder.current = media;
    media.start();
    setState("listening");
    requestAnimationFrame(watch);
  };

  return { supported, state, listen };
}
