"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import {
  BASELINE_DATE,
  DESTRUCTIVE_BASE_T,
  DESTRUCTIVE_CAGR,
  GLOBAL_GDP_T,
  PRODUCTIVE_CAGR,
} from "@/data/collapse-constants";

/**
 * Target ratio for countdown. 0.50 = 50% of GDP is destructive
 * (the game resolution threshold — when stealing beats creating).
 */
const TARGET_RATIO = 0.50;

function computeTargetDate(): Date {
  const numerator = Math.log(
    (TARGET_RATIO * GLOBAL_GDP_T) / DESTRUCTIVE_BASE_T,
  );
  const denominator = Math.log(
    (1 + DESTRUCTIVE_CAGR) / (1 + PRODUCTIVE_CAGR),
  );
  const years = numerator / denominator;
  const ms = BASELINE_DATE.getTime() + years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

const TARGET_DATE = computeTargetDate();

interface TimeLeft {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(): TimeLeft {
  const now = Date.now();
  const total = TARGET_DATE.getTime() - now;

  if (total <= 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const totalDays = Math.floor(total / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365.25);
  const remainingDays = totalDays - Math.floor(years * 365.25);
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.floor(remainingDays - months * 30.44);

  return { years, months, days, hours, minutes, seconds, total };
}

interface CollapseCountdownTimerProps {
  /** Visual size variant */
  size?: "sm" | "md" | "lg";
  /** Show the descriptive label below */
  showLabel?: boolean;
  /** Optional CSS class */
  className?: string;
}

/**
 * Real-time countdown to the destructive economy reaching 50% of GDP.
 * This IS the game timer — the point where stealing beats creating.
 *
 * Reusable component: drop it on any page.
 */
export function CollapseCountdownTimer({
  size = "md",
  showLabel = true,
  className = "",
}: CollapseCountdownTimerProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = {
    years: useRef<HTMLSpanElement>(null),
    months: useRef<HTMLSpanElement>(null),
    days: useRef<HTMLSpanElement>(null),
    hours: useRef<HTMLSpanElement>(null),
    minutes: useRef<HTMLSpanElement>(null),
    seconds: useRef<HTMLSpanElement>(null),
  };

  useEffect(() => {
    if (reduced) return;

    function tick() {
      const t = getTimeLeft();
      if (refs.years.current) refs.years.current.textContent = String(t.years);
      if (refs.months.current) refs.months.current.textContent = String(t.months).padStart(2, "0");
      if (refs.days.current) refs.days.current.textContent = String(t.days).padStart(2, "0");
      if (refs.hours.current) refs.hours.current.textContent = String(t.hours).padStart(2, "0");
      if (refs.minutes.current) refs.minutes.current.textContent = String(t.minutes).padStart(2, "0");
      if (refs.seconds.current) refs.seconds.current.textContent = String(t.seconds).padStart(2, "0");
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const initial = getTimeLeft();

  const digitSize = size === "lg" ? "text-4xl md:text-6xl" : size === "md" ? "text-2xl md:text-4xl" : "text-xl md:text-2xl";
  const labelSize = size === "lg" ? "text-xs" : size === "md" ? "text-[10px]" : "text-[9px]";
  const gap = size === "lg" ? "gap-4 md:gap-6" : size === "md" ? "gap-3 md:gap-4" : "gap-2";

  return (
    <div className={className} ref={containerRef}>
      <div className={`flex items-center justify-center ${gap} font-mono`} style={{ fontVariantNumeric: "tabular-nums" }}>
        <div className="text-center">
          <span ref={refs.years} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.years) : "0"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>YRS</div>
        </div>
        <span className={`${digitSize} font-black text-muted-foreground`}>:</span>
        <div className="text-center">
          <span ref={refs.months} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.months).padStart(2, "0") : "00"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>MO</div>
        </div>
        <span className={`${digitSize} font-black text-muted-foreground`}>:</span>
        <div className="text-center">
          <span ref={refs.days} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.days).padStart(2, "0") : "00"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>DAYS</div>
        </div>
        <span className={`${digitSize} font-black text-muted-foreground`}>:</span>
        <div className="text-center">
          <span ref={refs.hours} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.hours).padStart(2, "0") : "00"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>HRS</div>
        </div>
        <span className={`${digitSize} font-black text-muted-foreground`}>:</span>
        <div className="text-center">
          <span ref={refs.minutes} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.minutes).padStart(2, "0") : "00"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>MIN</div>
        </div>
        <span className={`${digitSize} font-black text-muted-foreground`}>:</span>
        <div className="text-center">
          <span ref={refs.seconds} className={`${digitSize} font-black text-brutal-red`}>
            {reduced ? String(initial.seconds).padStart(2, "0") : "00"}
          </span>
          <div className={`${labelSize} font-black uppercase text-muted-foreground mt-1`}>SEC</div>
        </div>
      </div>
      {showLabel && (
        <p className="text-xs font-bold text-muted-foreground text-center mt-3">
          Until the destructive economy reaches 50% of GDP — the point where stealing beats creating
        </p>
      )}
    </div>
  );
}
