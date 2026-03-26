"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BarData {
  label: string;
  value: number;
  color?: string;
  icon?: string;
}

interface AnimatedBarChartProps {
  data: BarData[];
  maxValue?: number;
  horizontal?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  animate?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
  barClassName?: string;
  formatValue?: (value: number) => string;
  staggerDelay?: number;
}

export function AnimatedBarChart({
  data,
  maxValue,
  horizontal = true,
  showLabels = true,
  showValues = true,
  animate = true,
  delay = 0,
  duration = 1000,
  className,
  barClassName,
  formatValue = (v) => v.toLocaleString(),
  staggerDelay = 100,
}: AnimatedBarChartProps) {
  const [progress, setProgress] = useState(animate ? 0 : 1);
  const max = maxValue ?? Math.max(...data.map((d) => d.value));

  useEffect(() => {
    if (!animate) return;

    const startTimeout = setTimeout(() => {
      const startTime = performance.now();
      
      const animateProgress = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const newProgress = Math.min(elapsed / duration, 1);
        setProgress(newProgress);

        if (newProgress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [animate, delay, duration]);

  if (horizontal) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {data.map((bar, index) => {
          const barProgress = Math.max(
            0,
            Math.min(1, (progress - (index * staggerDelay) / duration / data.length) * (1 + (data.length * staggerDelay) / duration))
          );
          const width = (bar.value / max) * 100 * barProgress;

          return (
            <div key={bar.label} className="flex items-center gap-2">
              {showLabels && (
                <div className="w-24 text-xs font-pixel text-right shrink-0 truncate">
                  {bar.icon && <span className="mr-1">{bar.icon}</span>}
                  {bar.label}
                </div>
              )}
              <div className="flex-1 h-6 bg-black/50 border border-current/30 relative overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-100",
                    barClassName
                  )}
                  style={{
                    width: `${width}%`,
                    backgroundColor: bar.color || "currentColor",
                  }}
                />
              </div>
              {showValues && (
                <div className="w-20 text-xs font-pixel text-left shrink-0">
                  {formatValue(bar.value * barProgress)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className={cn("flex items-end gap-2 h-40", className)}>
      {data.map((bar, index) => {
        const barProgress = Math.max(
          0,
          Math.min(1, (progress - (index * staggerDelay) / duration / data.length) * (1 + (data.length * staggerDelay) / duration))
        );
        const height = (bar.value / max) * 100 * barProgress;

        return (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 w-full flex items-end">
              <div
                className={cn(
                  "w-full transition-all duration-100 border border-current/30",
                  barClassName
                )}
                style={{
                  height: `${height}%`,
                  backgroundColor: bar.color || "currentColor",
                }}
              />
            </div>
            {showLabels && (
              <div className="text-xs font-pixel text-center truncate w-full">
                {bar.icon && <span className="block">{bar.icon}</span>}
                {bar.label}
              </div>
            )}
            {showValues && (
              <div className="text-xs font-pixel">
                {formatValue(bar.value * barProgress)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
