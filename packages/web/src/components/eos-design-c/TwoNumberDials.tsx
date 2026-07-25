"use client";

import { useEffect, useRef, useState } from "react";
import {
  GLOBAL_HALE_CURRENT,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
} from "@optimitron/data/parameters";

const HALE = GLOBAL_HALE_CURRENT.value;
const INCOME = GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value;
const DURATION_MS = 1500;

/**
 * The face spans -90deg (needle left, "low") to +90deg (needle right,
 * "high"). The needle rests at low and sweeps to a reading well inside the
 * face, so it never buries itself in the end labels.
 */
const SWEEP = 150;
const START_ANGLE = -90;

function useSweep(active: boolean): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION_MS);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return progress;
}

/**
 * The two numbers the whole machine maximizes, drawn as a pair of
 * instrument dials on the classroom chart: needles sweep up when the plate
 * scrolls into view, digits count with them. Values come straight from the
 * parameter registry; nothing here is typed by hand.
 */
export function TwoNumberDials() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [running, setRunning] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInstant(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRunning(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const swept = useSweep(running && !instant);
  const p = instant ? 1 : swept;

  return (
    <div className="dc-dials" ref={ref}>
      <Dial
        angle={START_ANGLE + SWEEP * p}
        label="Median Healthy Life Years."
        note="Not average life expectancy; the age at which the median person is still healthy."
        tint="var(--dc-turquoise)"
        value={(HALE * p).toFixed(1)}
      />
      <Dial
        angle={START_ANGLE + SWEEP * p}
        label="Median Real After-Tax Income."
        note="Not GDP per capita; not average."
        tint="var(--dc-mustard)"
        value={`$${Math.round(INCOME * p).toLocaleString("en-US")}`}
      />
    </div>
  );
}

function Dial({
  angle,
  label,
  note,
  tint,
  value,
}: {
  angle: number;
  label: string;
  note: string;
  tint: string;
  value: string;
}) {
  return (
    <div className="dc-dial">
      <svg
        aria-hidden="true"
        className="dc-dial-face"
        viewBox="0 0 200 128"
        role="presentation"
      >
        <g className="dc-draw">
          {/* the gauge arc */}
          <path d="M28 112 A72 72 0 0 1 172 112" />
          {/* tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const a = (Math.PI * (1 - t)) as number;
            const x1 = 100 + Math.cos(a) * 72;
            const y1 = 112 - Math.sin(a) * 72;
            const x2 = 100 + Math.cos(a) * 60;
            const y2 = 112 - Math.sin(a) * 60;
            return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
          <circle cx="100" cy="112" r="6" />
        </g>
        {/* the needle: not wobbled, so the reading stays crisp */}
        <line
          stroke={tint}
          strokeLinecap="round"
          strokeWidth="5"
          x1="100"
          x2="100"
          y1="112"
          y2="48"
          transform={`rotate(${angle} 100 112)`}
        />
        <text className="dc-lab-sm" textAnchor="middle" x="30" y="126">
          low
        </text>
        <text className="dc-lab-sm" textAnchor="middle" x="170" y="126">
          high
        </text>
      </svg>
      <div className="dc-dial-value">{value}</div>
      <p className="dc-dial-label">{label}</p>
      <p className="dc-dial-note">{note}</p>
    </div>
  );
}
