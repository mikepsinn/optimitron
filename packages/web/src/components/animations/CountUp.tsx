"use client";

import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  animate,
} from "framer-motion";

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.5,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const motionValue = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      if (ref.current) {
        ref.current.textContent = `${prefix}${formatNumber(value)}${suffix}`;
      }
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${formatNumber(latest)}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, prefix, suffix, duration, motionValue, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(0)}
      {suffix}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
