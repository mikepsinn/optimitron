"use client";

import { useEffect, useRef } from "react";
import { useScript } from "./use-script";

const MERMAID_JS = "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js";

/**
 * Lazy-loaded Mermaid diagram renderer.
 * Ported from packages/wishonia/components/VisualCard.tsx.
 * CDN script only loads when this component mounts.
 */
export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useScript(MERMAID_JS);

  useEffect(() => {
    if (!loaded || !ref.current) return;
    const win = window as unknown as Record<string, unknown>;
    const mermaid = win["mermaid"] as
      | {
          initialize: (config: Record<string, unknown>) => void;
          render: (id: string, code: string) => Promise<{ svg: string }>;
        }
      | undefined;
    if (!mermaid) return;

    mermaid.initialize({ startOnLoad: false, theme: "default" });
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (ref.current) ref.current.textContent = code;
      });
  }, [loaded, code]);

  return (
    <div
      ref={ref}
      className="my-3 overflow-x-auto border-2 border-primary bg-background p-3 text-center"
    >
      <pre className="text-xs text-muted-foreground">{code}</pre>
    </div>
  );
}
