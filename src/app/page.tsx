"use client";

import { useEffect, useRef, useState } from "react";
import { demoSlides, type DemoSlide } from "@/lib/demo-slides";

export default function Page() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [activeSlide, setActiveSlide] = useState<DemoSlide>("welcome");
  const slide = demoSlides[activeSlide];

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === "ocbc:demo-slide" && typeof data.slide === "string" && Object.hasOwn(demoSlides, data.slide)) {
        setActiveSlide(data.slide as DemoSlide);
      }
    };
    window.addEventListener("message", receive);
    // Request the current screen even if the iframe mounted before this listener.
    frame.current?.contentWindow?.postMessage({ type: "ocbc:request-demo-slide" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);

  return (
    <div className="device-preview">
      <header className="presentation-header">
        <span className="presentation-brand">OCBC <span>Adaptive Assist</span></span>
      </header>
      <section className="presentation-intro" aria-label="Demo story" aria-live="polite">
        <h1>{slide.title}</h1>
        <p className="presentation-description">{slide.description}</p>
        <div className="presentation-cue"><span aria-hidden="true">↗</span><p>{slide.cue}</p></div>
      </section>
      <div className="device-fit">
        <div className="device">
          <span className="device-buttons" aria-hidden="true" />
          <div className="device-screen">
            <span className="device-island" aria-hidden="true" />
            <iframe
              ref={frame}
              src="/mobile"
              allow="microphone"
              title="OCBC Adaptive Assist mobile app"
              onLoad={() => frame.current?.contentWindow?.postMessage({ type: "ocbc:request-demo-slide" }, window.location.origin)}
            />
            <span className="device-home" aria-hidden="true" />
          </div>
        </div>
      </div>
      <section className="presentation-notes" aria-label="Slide talking points" aria-live="polite">
        <p className="presentation-caption">Designed for everyday confidence</p>
        <h2>{slide.heading}</h2>
        <ol>
          {slide.points.map(([title, description]) => (
            <li key={title}>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
