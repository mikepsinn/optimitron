"use client";

import { useEffect, useRef, useState } from "react";
import {
  fmtParamValueOnly,
  GLOBAL_HALE_CURRENT,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
  type Parameter,
  PRIZE_TARGET_HALE_YEAR_15,
  PRIZE_TARGET_MEDIAN_INCOME_YEAR_15,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

const DURATION_MS = 1600;

type Meter = {
  key: string;
  label: string;
  note: string;
  from: Parameter;
  to: Parameter;
  format: (value: number) => string;
};

const METERS: Meter[] = [
  {
    key: "hale",
    label: "Median Healthy Life Years",
    note: "Not average life expectancy; the age at which the median person is still healthy.",
    from: GLOBAL_HALE_CURRENT,
    to: PRIZE_TARGET_HALE_YEAR_15,
    format: (value) => value.toFixed(1),
  },
  {
    key: "income",
    label: "Median Real After-Tax Income",
    note: "Not GDP per capita; not average.",
    from: GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
    to: PRIZE_TARGET_MEDIAN_INCOME_YEAR_15,
    format: (value) => `$${Math.round(value).toLocaleString("en-US")}`,
  },
];

/**
 * The centre display of the Optimitron page: the two numbers the whole machine
 * optimizes, animating from where the planet is now to the settlement target.
 * Every endpoint comes from the parameter file, so the readout moves whenever
 * the underlying estimate does.
 */
export function TwoNumberDashboard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (reduce) {
        setProgress(1);
        return;
      }
      const start = performance.now();
      let frame = 0;
      const step = (now: number) => {
        const t = Math.min((now - start) / DURATION_MS, 1);
        // ease-out cubic: the needles settle rather than slam.
        setProgress(1 - Math.pow(1 - t, 3));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frame);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="dsa-dash" ref={ref}>
      <div className="dsa-dash-head">
        <p className="dsa-eyebrow">Center Display / The Two Numbers</p>
        <p className="dsa-dash-hint">Today &rarr; settlement target, year 15</p>
      </div>
      <div className="dsa-dash-grid">
        {METERS.map((meter) => {
          const value =
            meter.from.value + (meter.to.value - meter.from.value) * progress;
          // Land on exactly the string the provenance chip shows, so the
          // readout and the parameter it cites never disagree by a rounding.
          const text =
            progress >= 1 ? fmtParamValueOnly(meter.to, 3) : meter.format(value);
          return (
            <div className="dsa-meter" key={meter.key}>
              <p className="dsa-meter-label">{meter.label}</p>
              <p className="dsa-meter-value">{text}</p>
              <div className="dsa-meter-bar" aria-hidden="true">
                <i style={{ right: `${(1 - progress) * 100}%` }} />
              </div>
              <p className="dsa-meter-from">
                <ParameterValue className="dsa-meter-src" param={meter.from} />{" "}
                today &rarr;{" "}
                <ParameterValue className="dsa-meter-src" param={meter.to} />{" "}
                target
              </p>
              <p>{meter.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
