"use client";

import { useEffect } from "react";

export function EmbedReadySignal() {
  useEffect(() => {
    const reportReady = () => {
      window.parent.postMessage({ type: "optimitron:survey-embed-ready" }, "*");
    };
    const retries = [
      window.setTimeout(reportReady, 250),
      window.setTimeout(reportReady, 1_000),
    ];
    reportReady();

    return () => retries.forEach(window.clearTimeout);
  }, []);

  return null;
}
