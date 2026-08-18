"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  animate?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
  showPercentage?: boolean;
}

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = "currentColor",
  backgroundColor = "currentColor",
  animate = true,
  duration = 1500,
  delay = 0,
  className,
  children,
  showPercentage = false,
}: ProgressRingProps) {
  const [currentProgress, setCurrentProgress] = useState(animate ? 0 : progress);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - currentProgress * circumference;

  useEffect(() => {
    if (!animate) {
      setCurrentProgress(progress);
      return;
    }

    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const startProgress = currentProgress;

      const animateProgress = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const newProgress = startProgress + (progress - startProgress) * eased;
        setCurrentProgress(newProgress);

        if (t < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);
    }, delay);

    return () => clearTimeout(timeout);
  }, [animate, delay, duration, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showPercentage ? (
          <span className="font-pixel text-sm">
            {Math.round(currentProgress * 100)}%
          </span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
