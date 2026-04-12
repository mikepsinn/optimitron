"use client";

import { useEffect, useRef } from "react";
import { useScript } from "./use-script";

const CHARTJS_JS = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

interface ChartConfig {
  type: string;
  data: unknown;
  options?: Record<string, unknown>;
}

/**
 * Lazy-loaded Chart.js renderer.
 * Accepts a JSON config (parsed from a ```chart fenced code block).
 * Ported from packages/wishonia/components/VisualCard.tsx.
 */
export function ChartBlock({ config }: { config: ChartConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<{ destroy: () => void } | null>(null);
  const loaded = useScript(CHARTJS_JS);

  useEffect(() => {
    if (!loaded || !canvasRef.current) return;
    const win = window as unknown as Record<string, unknown>;
    const ChartCtor = win["Chart"] as
      | {
          new (ctx: CanvasRenderingContext2D, config: unknown): {
            destroy: () => void;
          };
        }
      | undefined;
    if (!ChartCtor) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current = new ChartCtor(ctx, {
      type: config.type,
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        ...(config.options ?? {}),
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [loaded, config]);

  return (
    <div className="my-3 mx-auto max-w-lg border-2 border-primary bg-background p-3">
      <canvas ref={canvasRef} />
    </div>
  );
}

/** Safely parse a chart config from a fenced code block body. Returns null on error. */
export function parseChartConfig(source: string): ChartConfig | null {
  try {
    const parsed = JSON.parse(source);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.type === "string" &&
      "data" in parsed
    ) {
      return parsed as ChartConfig;
    }
    return null;
  } catch {
    return null;
  }
}
