"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { stopSpeaking } from "@/lib/speech-client";
export { speak, stopSpeaking } from "@/lib/speech-client";

// how quiet counts as silence, and how long it must last before we stop recording
const SILENCE_LEVEL = 0.02;
const SILENCE_MS = 1200;
const MAX_RECORD_MS = 8000;

const noop = () => () => {};

function canRecord() {
  return !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export type ListenState = "idle" | "listening" | "transcribing";

// records the mic in the browser, then sends the clip to our /api/transcribe route,
// which asks groq whisper for the text. the api key stays on the server
export function useListen(onText: (text: string) => void, onError: (text: string) => void, enabled = true) {
  // reading support through useSyncExternalStore gives false on the server and the real value
  // in the browser, which avoids a hydration mismatch without a setState in an effect
  const supported = useSyncExternalStore(noop, canRecord, () => false);
  const [state, setState] = useState<ListenState>("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  const closed = useRef(false);
  const requesting = useRef(false);
  const upload = useRef<AbortController | null>(null);
  const session = useRef(0);

  // if penny closes while recording, release the mic and throw the clip away
  useEffect(() => {
    closed.current = !enabled;
    return () => {
      closed.current = true;
      session.current += 1;
      if (recorder.current?.state === "recording") recorder.current.stop();
      upload.current?.abort();
      setState("idle");
    };
  }, [enabled]);

  const send = async (clip: Blob, recordingSession: number) => {
    setState("transcribing");
    const controller = new AbortController();
    upload.current = controller;
    try {
      const form = new FormData();
      const ext = clip.type.includes("mp4") ? "mp4" : clip.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", clip, `speech.${ext}`);
      const response = await fetch("/api/transcribe", { method: "POST", body: form, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data = (await response.json()) as { text?: string };
      if (!response.ok || typeof data.text !== "string" || !data.text) throw new Error("no text");
      if (!closed.current && recordingSession === session.current && !controller.signal.aborted) onText(data.text);
    } catch {
      if (!closed.current && recordingSession === session.current && !controller.signal.aborted) onError("I could not transcribe that. Check voice setup, try again, or type instead.");
    } finally {
      if (upload.current === controller) upload.current = null;
      if (recordingSession === session.current) setState("idle");
    }
  };

  const listen = async () => {
    if (closed.current || requesting.current || state === "transcribing") return;
    // a second tap while recording means "i am done talking"
    if (recorder.current?.state === "recording") {
      recorder.current.stop();
      return;
    }
    stopSpeaking();

    let stream: MediaStream;
    const recordingSession = session.current;
    requesting.current = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (!closed.current) onError("I need microphone access to listen. You can type instead.");
      return;
    } finally {
      requesting.current = false;
    }
    if (closed.current || recordingSession !== session.current) { stream.getTracks().forEach((track) => track.stop()); return; }

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
      if (recorder.current === media) { recorder.current = null; setState("idle"); }
      if (closed.current || recordingSession !== session.current) return;
      if (!heard) {
        setState("idle");
        onError("I did not hear anything. Tap Speak and try again.");
        return;
      }
      void send(new Blob(chunks, { type: media.mimeType }), recordingSession);
    };

    recorder.current = media;
    media.start();
    setState("listening");
    requestAnimationFrame(watch);
  };

  return { supported, state, listen };
}
