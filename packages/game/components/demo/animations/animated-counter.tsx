"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  format?: "number" | "currency" | "compact" | "percent";
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
  easing?: "linear" | "easeOut" | "easeIn" | "easeInOut";
  decimals?: number;
}

const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

function formatValue(value: number, format: string, decimals: number): string {
  switch (format) {
    case "currency":
      if (value >= 1_000_000_000_000) {
        return `$${(value / 1_000_000_000_000).toFixed(decimals)}T`;
      } else if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(decimals)}B`;
      } else if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(decimals)}M`;
      } else if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(decimals)}K`;
      }
      return `$${value.toFixed(decimals)}`;
    case "compact":
      if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(decimals)}B`;
      } else if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(decimals)}M`;
      } else if (value >= 1_000) {
        return `${(value / 1_000).toFixed(decimals)}K`;
      }
      return value.toFixed(decimals);
    case "percent":
      return `${(value * 100).toFixed(decimals)}%`;
    default:
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: decimals,
      }).format(value);
  }
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  format = "number",
  prefix = "",
  suffix = "",
  className,
  onComplete,
  easing = "easeOut",
  decimals = 0,
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number>(undefined);
  const startTimeRef = useRef<number>(undefined);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    const easingFn = easingFunctions[easing];
    const startValue = start;
    const endValue = end;
    const range = endValue - startValue;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = startValue + range * easedProgress;

      setCurrent(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hasStarted, start, end, duration, easing, onComplete]);

  const displayValue = formatValue(current, format, decimals);

  return (
    <span className={cn("font-pixel tabular-nums", className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
