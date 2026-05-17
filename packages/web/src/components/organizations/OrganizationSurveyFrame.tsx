"use client";

import { useEffect, useRef, useState } from "react";

interface OrganizationSurveyFrameProps {
  src: string;
  title: string;
}

export function OrganizationSurveyFrame({
  src,
  title,
}: OrganizationSurveyFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      let expectedOrigin = window.location.origin;
      try {
        expectedOrigin = new URL(src, window.location.href).origin;
      } catch {
        expectedOrigin = window.location.origin;
      }

      if (
        event.origin !== expectedOrigin &&
        event.origin !== window.location.origin
      ) {
        return;
      }

      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === "optimitron:survey-ready"
      ) {
        setLoaded(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [src]);

  return (
    <div
      className="relative border border-foreground"
      data-visual-state={loaded ? undefined : "animating"}
    >
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background px-4 text-center text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
          Loading survey
        </div>
      ) : null}
      <iframe
        className="h-[760px] w-full"
        onLoad={() => setLoaded(true)}
        ref={iframeRef}
        src={src}
        title={title}
      />
    </div>
  );
}
