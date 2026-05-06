"use client";

import { useEffect, useRef } from "react";

const DAFDIRECT_SCRIPT_SRC = "https://www.dafdirect.org/ddirect/dafdirect4.js";

declare global {
  interface Window {
    _dafdirect_settings?: string;
  }
}

interface DafDirectWidgetProps {
  /**
   * Full DAF Direct settings string from https://www.dafdirect.org/.
   * Format: `EIN_sizecode_uuid` — read verbatim into window._dafdirect_settings.
   * Source of truth: NONPROFIT.dafDirectOrgId in nonprofit-identity.ts.
   */
  settings: string;
}

/**
 * Embeds the DAF Direct giving widget. Donors recommend a grant from a
 * donor-advised fund at Fidelity Charitable, DAFgiving360 (formerly Schwab
 * Charitable), or BNY Mellon Charitable without leaving the page.
 *
 * The vendor script (dafdirect4.js) injects its iframe at the location of the
 * <script> tag, so we let it append directly into a wrapping div ref. React
 * literal <script> children won't execute, hence the imperative effect.
 *
 * If the vendor script fails to paint, the wrapper stays collapsed instead of
 * leaving a blank reserved widget area.
 */
export function DafDirectWidget({ settings }: DafDirectWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !settings) return;

    // The vendor script reads window._dafdirect_settings on load; set it
    // before requesting dafdirect4.js so the iframe is configured correctly.
    window._dafdirect_settings = settings;

    const script = document.createElement("script");
    script.src = DAFDIRECT_SCRIPT_SRC;
    script.async = true;
    container.appendChild(script);

    return () => {
      // The vendor script doesn't expose a teardown API, so we remove the
      // script tag plus any iframe/elements it injected on unmount. This
      // keeps re-mounts (e.g. fast refresh) from stacking widgets.
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      delete window._dafdirect_settings;
    };
  }, [settings]);

  return (
    <div
      ref={containerRef}
      aria-label="DAF Direct giving widget"
      className="mt-2 inline-block"
    />
  );
}
