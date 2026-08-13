"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SurveyQuestionPreview } from "./SurveyEmbedPreview";

const DEFAULT_SURVEY_ORIGIN =
  process.env.NEXT_PUBLIC_SURVEY_ORIGIN ?? "https://trialabundancesurvey.org";

export type SurveyEmbedProps = {
  referralCode?: string | null;
  origin?: string;
  title?: string;
  height?: string | number;
  className?: string;
};

export function SurveyEmbed({
  referralCode,
  origin = DEFAULT_SURVEY_ORIGIN,
  title = "Trial Abundance Survey",
  height = 720,
  className,
}: SurveyEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const src = useMemo(() => {
    const url = new URL("/embed", origin);
    if (referralCode) url.searchParams.set("ref", referralCode);
    url.searchParams.set("embed", "1");
    return url.toString();
  }, [origin, referralCode]);
  const heightCss = typeof height === "number" ? `${height}px` : height;

  useEffect(() => {
    setReady(false);
    setTimedOut(false);
    const expectedOrigin = new URL(src).origin;
    const timeout = window.setTimeout(() => setTimedOut(true), 8_000);
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === expectedOrigin &&
        event.source === iframeRef.current?.contentWindow &&
        event.data?.type === "optimitron:survey-embed-ready"
      ) {
        window.clearTimeout(timeout);
        setReady(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden border-4 border-primary bg-brutal-yellow ${className ?? ""}`}
      style={{ width: "100%", height: heightCss }}
    >
      {!ready ? (
        <div className="absolute inset-0 overflow-auto px-4 py-10 sm:px-8">
          <SurveyQuestionPreview actionLabel="Open the survey" actionHref={src} />
          {timedOut ? (
            <p className="mx-auto mt-6 max-w-2xl border-4 border-primary bg-background p-4 text-center font-black">
              The survey did not load here. Open it directly to answer the
              question.
            </p>
          ) : null}
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        style={{ border: 0, background: "#fff", opacity: ready ? 1 : 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allow="clipboard-write"
      />
    </div>
  );
}
