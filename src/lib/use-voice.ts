"use client";

import { useRef, useState, useSyncExternalStore } from "react";

// the web speech api is not in typescript's dom types, so only the parts we use are typed here
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function recognitionCtor() {
  // chrome and edge still ship speech recognition under the webkit prefix
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

const noop = () => () => {};

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

export function useListen(onText: (text: string) => void) {
  // reading support through useSyncExternalStore gives false on the server and the real value
  // in the browser, which avoids a hydration mismatch without a setState in an effect
  const supported = useSyncExternalStore(noop, () => !!recognitionCtor(), () => false);
  const [listening, setListening] = useState(false);
  const active = useRef<Recognition | null>(null);

  const listen = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    if (active.current) {
      active.current.stop();
      return;
    }
    stopSpeaking();
    const recognition = new Ctor();
    recognition.lang = "en-SG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => onText(event.results[0][0].transcript);
    recognition.onend = () => {
      active.current = null;
      setListening(false);
    };
    recognition.onerror = recognition.onend;
    active.current = recognition;
    setListening(true);
    recognition.start();
  };

  return { supported, listening, listen };
}
