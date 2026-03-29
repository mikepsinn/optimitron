/**
 * Visual supplements renderer.
 * Renders keyFigure, latex, chart, table, mermaid, sourceLinks from the /api/visuals response.
 * Heavy libraries (KaTeX, Chart.js, Mermaid) are loaded from CDN on demand.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useScript, useStylesheet } from "@/hooks/useScript";
import type { VisualsResult } from "@/lib/visuals-prompt";
import { normalizeManualUrl } from "@/lib/source-links";
import { getVisualImageAlt } from "@/lib/visuals-utils";
import { Lightbox } from "./Lightbox";

const KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
const KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
const CHARTJS_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
const MERMAID_JS = "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js";

function KeyFigure({ data }: { data: NonNullable<VisualsResult["keyFigure"]> }) {
  return (
    <div style={{
      textAlign: "center", padding: "16px 20px",
      background: "rgba(54,226,248,0.08)", border: "1px solid rgba(54,226,248,0.2)",
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: "#36E2F8" }}>{data.value}</div>
      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{data.label}</div>
      {data.context && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{data.context}</div>}
    </div>
  );
}

function LatexBlock({ tex }: { tex: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useStylesheet(KATEX_CSS);
  const loaded = useScript(KATEX_JS);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (loaded && ref.current && typeof win["katex"] !== "undefined") {
      try {
        ref.current.innerHTML = win["katex"].renderToString(tex, {
          displayMode: true, strict: false, throwOnError: false,
        });
      } catch {
        ref.current.textContent = `$$${tex}$$`;
      }
    }
  }, [loaded, tex]);

  return (
    <div ref={ref} style={{
      padding: "12px", textAlign: "center",
      background: "rgba(209,0,177,0.05)", border: "1px solid rgba(209,0,177,0.15)",
      overflowX: "auto",
    }}>
      {`$$${tex}$$`}
    </div>
  );
}

function ChartBlock({ config }: { config: NonNullable<VisualsResult["chartConfig"]> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);
  const loaded = useScript(CHARTJS_JS);

  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const ChartCtor = win["Chart"] as {
      new (ctx: CanvasRenderingContext2D, config: unknown): { destroy: () => void };
    } | undefined;
    if (!ChartCtor) return;

    // Destroy previous chart instance
    if (chartRef.current) {
      (chartRef.current as { destroy: () => void }).destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartCtor(ctx, {
      type: config.type,
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: "#ececec" } } },
        scales: config.type === "pie" || config.type === "doughnut" ? undefined : {
          x: { ticks: { color: "#888" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#888" }, grid: { color: "rgba(255,255,255,0.05)" } },
        },
        ...config.options,
      },
    });

    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy();
        chartRef.current = null;
      }
    };
  }, [loaded, config]);

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 8 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function TableBlock({ data }: { data: NonNullable<VisualsResult["table"]> }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%", borderCollapse: "collapse", fontSize: 13,
      }}>
        <thead>
          <tr>
            {data.headers.map((h, i) => (
              <th key={i} style={{
                padding: "8px 12px", textAlign: "left", fontWeight: 700,
                borderBottom: "1px solid rgba(54,226,248,0.2)", color: "#36E2F8",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "6px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#C6CBF5",
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useScript(MERMAID_JS);

  useEffect(() => {
    if (!loaded || !ref.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const mermaid = win["mermaid"] as {
      initialize: (config: Record<string, unknown>) => void;
      render: (id: string, code: string) => Promise<{ svg: string }>;
    } | undefined;
    if (!mermaid) return;

    mermaid.initialize({ startOnLoad: false, theme: "dark" });
    const id = `mermaid-${Date.now()}`;
    mermaid.render(id, code).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg;
    }).catch(() => {
      if (ref.current) ref.current.textContent = code;
    });
  }, [loaded, code]);

  return (
    <div ref={ref} style={{
      padding: 12, textAlign: "center",
      background: "rgba(255,255,255,0.02)", overflowX: "auto",
    }}>
      <pre style={{ fontSize: 11, color: "#666" }}>{code}</pre>
    </div>
  );
}

function SourceLinks({ links }: { links: NonNullable<VisualsResult["sourceLinks"]> }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {links.map((link, i) => (
        <a
          key={i}
          href={normalizeManualUrl(link.url)}
          target="_blank"
          rel="noopener"
          style={{
            fontSize: 12, padding: "4px 10px",
            background: "rgba(209,0,177,0.1)", border: "1px solid rgba(209,0,177,0.25)",
            color: "#d100b1", textDecoration: "none",
          }}
        >
          {link.title}
        </a>
      ))}
    </div>
  );
}

function ImageBlock({ src }: { src: string }) {
  const url = normalizeManualUrl(src);
  const alt = getVisualImageAlt(src);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ textAlign: "center", marginTop: 8 }}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "zoom-in",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: 300,
            borderRadius: 0,
            border: "1px solid rgba(54,226,248,0.15)",
          }}
        />
      </button>
      <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
        Click image to expand
      </div>
      {isOpen && <Lightbox src={url} alt={alt} onClose={() => setIsOpen(false)} />}
    </div>
  );
}

export function VisualCard({ data }: { data: VisualsResult }): React.JSX.Element | null {
  const hasContent = data.keyFigure || data.latex || data.chartConfig ||
    data.table || data.mermaid || data.sourceLinks || data.image;

  if (!hasContent) return null;

  return (
    <div style={{
      marginTop: 8, padding: 12, borderRadius: 12,
      background: "#0d0d1a", border: "1px solid rgba(54,226,248,0.15)",
      display: "flex", flexDirection: "column", gap: 12,
      animation: "chatSlideIn 0.3s ease-out",
    }}>
      {data.keyFigure && <KeyFigure data={data.keyFigure} />}
      {data.latex && <LatexBlock tex={data.latex} />}
      {data.chartConfig && <ChartBlock config={data.chartConfig} />}
      {data.table && <TableBlock data={data.table} />}
      {data.mermaid && <MermaidBlock code={data.mermaid} />}
      {data.image && <ImageBlock src={data.image} />}
      {data.sourceLinks && data.sourceLinks.length > 0 && <SourceLinks links={data.sourceLinks} />}
    </div>
  );
}
