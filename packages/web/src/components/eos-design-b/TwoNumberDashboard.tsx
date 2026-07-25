"use client";

import { useEffect, useRef, useState } from "react";
import {
  fmtParamValueOnly,
  GLOBAL_HALE_CURRENT,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  PRIZE_TARGET_HALE_YEAR_15,
  PRIZE_TARGET_MEDIAN_INCOME_YEAR_15,
  type Parameter,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const N = "pk-n";
const DURATION_MS = 1500;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * Counts a parameter up from its baseline to its target when the gauge
 * scrolls into view. The rendered string always comes back through the
 * parameter formatter, so nothing here is a hardcoded figure.
 */
function useCountUp(from: Parameter, to: Parameter) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(from.value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setValue(to.value);
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DURATION_MS);
      setValue(from.value + (to.value - from.value) * easeOutCubic(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [from, to]);

  return { ref, value };
}

function Gauge({
  baseline,
  target,
  unitLabel,
  title,
  legend,
}: {
  baseline: Parameter;
  target: Parameter;
  unitLabel: string;
  title: string;
  legend: string;
}) {
  const { ref, value } = useCountUp(baseline, target);
  const scaleMax = target.value * 1.15;
  const fillPct = Math.max(0, Math.min(100, (value / scaleMax) * 100));
  const targetPct = Math.max(0, Math.min(100, (target.value / scaleMax) * 100));

  return (
    <div className="pkb-gauge" ref={ref}>
      <div className="pkb-gauge-head">
        <p className="pkb-tag pkb-tag--blue">{title}</p>
        <p className="pkb-tag">Year 15</p>
      </div>
      <span className="pkb-huge">
        {fmtParamValueOnly({ ...target, value })}
        <span className="pkb-huge-unit">{unitLabel}</span>
      </span>
      <div className="pkb-track" aria-hidden="true">
        <span className="pkb-track-base" />
        <span className="pkb-track-fill" style={{ width: `${fillPct}%` }} />
        <span className="pkb-track-tick" style={{ left: `${targetPct}%` }} />
      </div>
      <p className="pkb-gauge-sub">
        Today <ParameterValue className={N} param={baseline} /> → treaty
        trajectory <b>
          <ParameterValue className={N} param={target} />
        </b>
      </p>
      <p className="pkb-legend" style={{ marginTop: "0.6rem" }}>
        {legend}
      </p>
    </div>
  );
}

export function TwoNumberDashboard() {
  return (
    <div className="pkb-dash">
      <Gauge
        baseline={GLOBAL_HALE_CURRENT}
        target={PRIZE_TARGET_HALE_YEAR_15}
        unitLabel="years"
        title="Median Healthy Life Years"
        legend="Not average life expectancy; the age at which the median person is still healthy."
      />
      <Gauge
        baseline={GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025}
        target={PRIZE_TARGET_MEDIAN_INCOME_YEAR_15}
        unitLabel="per year"
        title="Median Real After-Tax Income"
        legend="Not GDP per capita; not average."
      />
    </div>
  );
}
