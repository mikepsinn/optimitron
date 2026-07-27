"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  animate,
} from "framer-motion";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.5,
  className,
  format = formatNumber,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const motionValue = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  // Static markup carries the final value so SEO crawlers, no-JS readers,
  // and snapshot tooling all see the real number. When the count-up WILL
  // run, reset to 0 before first paint — otherwise scrolling toward the
  // element shows the final value snapping backwards as the animation starts.
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion || navigator.webdriver) return;
    if (ref.current) {
      ref.current.textContent = `${prefix}${format(0)}${suffix}`;
    }
    // Run once on mount: this seeds the pre-animation state, not a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInView) return;
    // Automation (copy previews, screenshots, e2e) and reduced-motion users
    // must land on the final value, never a mid-animation frame.
    if (prefersReducedMotion || navigator.webdriver) {
      if (ref.current) {
        ref.current.textContent = `${prefix}${format(value)}${suffix}`;
      }
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${format(latest)}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, prefix, suffix, duration, motionValue, prefersReducedMotion, format]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(value)}
      {suffix}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
