"use client";

import { useEffect, useRef, useState } from "react";
import {
  GLOBAL_HALE_CURRENT,
  GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025,
} from "@optimitron/data/parameters";

/**
 * Center display for the Optimitron card: the two numbers the whole machine
 * maximizes. Counters animate up from zero when scrolled into view; under
 * prefers-reduced-motion (or no IntersectionObserver) they render statically.
 * Values come straight from the parameter registry.
 */
const HALE = GLOBAL_HALE_CURRENT.value;
const INCOME = GLOBAL_MEDIAN_AFTER_TAX_INCOME_2025.value;
const DURATION_MS = 1400;

function useCountUp(target: number, start: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION_MS);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return start ? value : target;
}

export function TwoNumberDashboard() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      setSettled(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hale = useCountUp(HALE, animate && !settled);
  const income = useCountUp(INCOME, animate && !settled);
  const showFinal = settled || !animate;

  return (
    <div className="eos-twonum" ref={ref}>
      <div className="eos-twonum-card">
        <div className="eos-twonum-value">
          {(showFinal ? HALE : hale).toFixed(1)}
        </div>
        <div className="eos-twonum-label">Median Healthy Life Years.</div>
        <p className="eos-twonum-note">
          Not average life expectancy; the age at which the median person is
          still healthy.
        </p>
      </div>
      <div className="eos-twonum-card">
        <div className="eos-twonum-value">
          ${Math.round(showFinal ? INCOME : income).toLocaleString("en-US")}
        </div>
        <div className="eos-twonum-label">Median Real After-Tax Income.</div>
        <p className="eos-twonum-note">Not GDP per capita; not average.</p>
      </div>
    </div>
  );
}
