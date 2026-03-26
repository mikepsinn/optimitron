"use client";

import { useEffect, useState, useRef } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { PARAMETERS } from "@/lib/demo/parameters";
import { formatNumber } from "@/lib/demo/formatters";
import { cn } from "@/lib/utils";

/**
 * Score Counter - Animated odometer-style display
 * Shows "SCORE: X of 8,000,000,000"
 */
function ScoreCounter() {
  const { score, targetScore } = useDemoStore();
  const [displayScore, setDisplayScore] = useState(score);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetScore !== displayScore) {
      const startScore = displayScore;
      const startTime = performance.now();
      const duration = 1000; // 1 second animation

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const newScore = Math.floor(startScore + (targetScore - startScore) * eased);
        
        setDisplayScore(newScore);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetScore, displayScore]);

  // Also update if score changes directly
  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  return (
    <div className="score-display flex items-center gap-2">
      <span className="text-pixel-xs md:text-pixel-sm opacity-70">SCORE:</span>
      <span className={cn(
        "text-pixel-sm md:text-pixel-base font-pixel tabular-nums",
        displayScore > 0 && "animate-score-tick"
      )}>
        {formatNumber(displayScore)}
      </span>
      <span className="text-pixel-xs md:text-pixel-sm opacity-50">
        of {formatNumber(PARAMETERS.population.world)}
      </span>
    </div>
  );
}

/**
 * Death Ticker - Always counting, always visible, relentless
 * Shows skull emoji + "150,000/day" in red
 */
function DeathTicker() {
  const [count, setCount] = useState(0);
  const deathsPerSecond = PARAMETERS.deaths.perDay / 86400; // ~1.74 deaths per second

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 1000 / deathsPerSecond); // Tick approximately once per death

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="death-ticker flex items-center gap-2">
      <span className="text-lg animate-sierra-pulse">&#9760;</span>
      <span className="text-pixel-xs md:text-pixel-sm">
        {formatNumber(PARAMETERS.deaths.perDay)}/day
      </span>
    </div>
  );
}

/**
 * Quest Meters - HALE and Income progress bars
 * Hidden in Act I, appear at The Turn, fill through Act II
 */
function QuestMeters() {
  const { questMetersVisible, haleProgress, incomeProgress } = useDemoStore();

  if (!questMetersVisible) return null;

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded",
      "bg-black/50 border border-[var(--sierra-border)]",
      "animate-slide-up"
    )}>
      {/* HALE Meter */}
      <div className="flex items-center gap-3">
        <span className="text-pixel-xs w-14 text-[var(--sierra-accent)]">HALE</span>
        <div className="pixel-progress flex-1 h-3 md:h-4">
          <div 
            className="pixel-progress-fill h-full transition-all duration-500"
            style={{ width: `${haleProgress * 100}%` }}
          />
        </div>
        <span className="text-pixel-xs text-[var(--sierra-fg)] w-28 text-right">
          {PARAMETERS.health.currentHALE} → {PARAMETERS.health.projectedHALE} yrs
        </span>
      </div>

      {/* Income Meter */}
      <div className="flex items-center gap-3">
        <span className="text-pixel-xs w-14 text-[var(--sierra-accent)]">INCOME</span>
        <div className="pixel-progress flex-1 h-3 md:h-4">
          <div 
            className="pixel-progress-fill h-full transition-all duration-500"
            style={{ width: `${incomeProgress * 100}%` }}
          />
        </div>
        <span className="text-pixel-xs text-[var(--sierra-fg)] w-28 text-right">
          ${formatNumber(PARAMETERS.economic.currentGDPperCapita / 1000, "compact")}K → ${formatNumber(PARAMETERS.economic.projectedGDPperCapita / 1000, "compact")}K
        </span>
      </div>
    </div>
  );
}

/**
 * Main Sierra HUD Component
 * Persistent UI chrome that appears on every slide
 */
export function SierraHUD() {
  const { palette, isRecordingMode } = useDemoStore();

  // Hide HUD in recording mode
  if (isRecordingMode) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50",
      "pointer-events-none",
      `palette-${palette}`
    )}>
      {/* Top Bar */}
      <div className={cn(
        "flex items-center justify-between",
        "px-3 py-2 md:px-6 md:py-3",
        "bg-gradient-to-b from-black/90 to-black/70",
        "border-b-2 border-[var(--sierra-border)]",
        "pointer-events-auto"
      )}>
        <ScoreCounter />
        
        {/* Center - Quest Meters (desktop) */}
        <div className="hidden lg:block">
          <QuestMeters />
        </div>

        <DeathTicker />
      </div>

      {/* Quest Meters (mobile/tablet - below top bar) */}
      <div className="lg:hidden px-3 py-2">
        <QuestMeters />
      </div>
    </div>
  );
}

export default SierraHUD;
