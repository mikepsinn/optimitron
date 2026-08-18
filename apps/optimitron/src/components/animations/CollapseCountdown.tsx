"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface TimeLeft {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeTimeLeft(targetDate: Date): TimeLeft {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);

  const years = Math.floor(totalSeconds / (365.25 * 24 * 3600));
  const afterYears = totalSeconds - years * Math.floor(365.25 * 24 * 3600);
  const days = Math.floor(afterYears / (24 * 3600));
  const afterDays = afterYears - days * 24 * 3600;
  const hours = Math.floor(afterDays / 3600);
  const afterHours = afterDays - hours * 3600;
  const minutes = Math.floor(afterHours / 60);
  const seconds = afterHours - minutes * 60;

  return { years, days, hours, minutes, seconds };
}

const units: (keyof TimeLeft)[] = ["years", "days", "hours", "minutes", "seconds"];

export function CollapseCountdown({
  targetDate,
  className = "",
}: {
  targetDate: Date;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const refs = {
    years: useRef<HTMLSpanElement>(null),
    days: useRef<HTMLSpanElement>(null),
    hours: useRef<HTMLSpanElement>(null),
    minutes: useRef<HTMLSpanElement>(null),
    seconds: useRef<HTMLSpanElement>(null),
  };

  useEffect(() => {
    setMounted(true);

    const update = () => {
      const tl = computeTimeLeft(targetDate);
      for (const unit of units) {
        const el = refs[unit].current;
        if (el) {
          el.textContent = String(tl[unit]).padStart(unit === "years" ? 1 : 2, "0");
        }
      }
    };

    update();
    if (prefersReducedMotion) return;

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, prefersReducedMotion]);

  if (!mounted) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-block p-6 bg-brutal-red border-4 border-brutal-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-5xl sm:text-6xl font-black text-brutal-red-foreground">—</div>
          <div className="text-sm font-bold text-brutal-red-foreground mt-2 uppercase">
            Until the destructive economy hits 25% of GDP
          </div>
        </div>
      </div>
    );
  }

  if (prefersReducedMotion) {
    const tl = computeTimeLeft(targetDate);
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-block p-6 bg-brutal-red border-4 border-brutal-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl font-black text-brutal-red-foreground">
            Approximately {tl.years} years, {tl.days} days remaining
          </div>
          <div className="text-sm font-bold text-brutal-red-foreground mt-2 uppercase">
            Until the destructive economy hits 25% of GDP
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`text-center ${className}`}
      role="timer"
      aria-label="Countdown to economic collapse threshold"
    >
      <div className="inline-flex flex-wrap justify-center gap-2 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit}
            className="flex flex-col items-center p-3 sm:p-4 bg-brutal-red border-4 border-brutal-red shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[4rem] sm:min-w-[5rem]"
          >
            <span
              ref={refs[unit]}
              className="text-3xl sm:text-4xl font-black text-brutal-red-foreground tabular-nums"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              —
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-brutal-red-foreground uppercase mt-1 tracking-wider">
              {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="text-sm font-bold text-brutal-red-foreground mt-3 uppercase">
        Until the destructive economy hits 25% of GDP
      </div>
    </div>
  );
}
