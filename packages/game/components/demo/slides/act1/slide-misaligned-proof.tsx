"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { PARAMETERS } from "@/lib/demo/parameters";
import { useEffect, useState } from "react";

/** A single CRT monitor frame with scanlines */
function CRTMonitor({
  label,
  labelColor,
  glowColor,
  children,
  delay = 0,
}: {
  label: string;
  labelColor: string;
  glowColor: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Monitor bezel */}
      <div
        className="bg-zinc-800 border-2 border-zinc-600 rounded-lg p-1"
        style={{ boxShadow: `0 0 20px ${glowColor}` }}
      >
        {/* Screen */}
        <div className="bg-black border border-zinc-700 rounded p-3 md:p-4 min-h-[160px] md:min-h-[200px] relative overflow-hidden flex flex-col items-center justify-center">
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
            }}
          />

          {/* CRT glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
            }}
          />

          {/* Label */}
          <div
            className="font-pixel text-xs md:text-xs mb-3 tracking-wider"
            style={{ color: labelColor }}
          >
            {label}
          </div>

          {/* Content */}
          <div className="relative z-10">{children}</div>
        </div>
      </div>

      {/* Mini stand */}
      <div className="flex justify-center">
        <div className="w-8 h-2 bg-zinc-700 rounded-b" />
      </div>
    </div>
  );
}

export function SlideMisalignedProof() {
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [dollarScale, setDollarScale] = useState(100);

  useEffect(() => {
    // Show diagnosis after counters finish
    setTimeout(() => setShowDiagnosis(true), 4500);

    // Animate dollar shrink
    const shrinkInterval = setInterval(() => {
      setDollarScale((prev) => {
        if (prev <= 4) {
          clearInterval(shrinkInterval);
          return 4;
        }
        return prev - 2;
      });
    }, 60);

    return () => clearInterval(shrinkInterval);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      {/* Skull particles */}
      <ParticleEmitter
        emoji={["💀"]}
        rate={1}
        direction="up"
        speed={15}
        lifetime={4000}
        fadeOut
        className="opacity-15"
      />

      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center">
          <div className="font-pixel text-xs text-red-400/60 tracking-widest">
            EVIDENCE OF MISALIGNMENT
          </div>
        </div>

        {/* Three monitors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Monitor 1: Money Printed */}
          <CRTMonitor
            label="PRINTED SINCE 1913"
            labelColor="#f59e0b"
            glowColor="rgba(245,158,11,0.15)"
            delay={0}
          >
            <div className="text-center">
              <div className="font-pixel text-xl md:text-2xl text-amber-400">
                <AnimatedCounter
                  end={PARAMETERS.spending.cumulativeMilitarySinceFed}
                  duration={3000}
                  format="currency"
                  decimals={0}
                />
              </div>
              <div className="font-pixel text-xs text-amber-300/60 mt-2">
                ON WEAPONS AND WARS
              </div>
            </div>
          </CRTMonitor>

          {/* Monitor 2: Dollar Destroyed */}
          <CRTMonitor
            label="PURCHASING POWER"
            labelColor="#ef4444"
            glowColor="rgba(239,68,68,0.15)"
            delay={300}
          >
            <div className="text-center">
              {/* Shrinking dollar sign */}
              <div
                className="font-pixel text-red-500 transition-all duration-100 leading-none"
                style={{
                  fontSize: `${Math.max(dollarScale * 0.5, 12)}px`,
                  opacity: Math.max(dollarScale / 100, 0.15),
                }}
              >
                $
              </div>
              <div className="font-pixel text-2xl md:text-3xl text-red-400 mt-1">
                <AnimatedCounter
                  start={100}
                  end={4}
                  duration={3000}
                  suffix="%"
                />
              </div>
              <div className="font-pixel text-xs text-red-300/60 mt-2">
                {PARAMETERS.economic.dollarPurchasingPowerLost}% DESTROYED
              </div>
            </div>
          </CRTMonitor>

          {/* Monitor 3: People Killed */}
          <CRTMonitor
            label="KILLED IN UNPOPULAR WARS"
            labelColor="#dc2626"
            glowColor="rgba(220,38,38,0.15)"
            delay={600}
          >
            <div className="text-center relative">
              <div className="font-pixel text-xl md:text-2xl text-red-500">
                <AnimatedCounter
                  end={PARAMETERS.deaths.warDeathsFundedByPrinting}
                  duration={3000}
                  format="number"
                />
              </div>
              <div className="font-pixel text-xs text-red-300/60 mt-2 animate-pulse">
                NO ONE ASKED YOU
              </div>
            </div>
          </CRTMonitor>
        </div>

        {/* Diagnosis bar */}
        <div
          className={`transition-all duration-700 ${
            showDiagnosis
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="bg-black border-2 border-red-500/40 rounded p-3 text-center">
            <GlitchText
              text="DIAGNOSIS: MISALIGNED OBJECTIVE FUNCTION — RUNNING TO COMPLETION"
              className="font-pixel text-sm md:text-xs text-red-500"
              intensity="medium"
            />
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
