"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  MONEY_PRINTER_WAR_DEATHS,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";

/* ── Derived values ──────────────────────────────────────────────── */

const militarySpent = CUMULATIVE_MILITARY_SPENDING_FED_ERA.value;
const warDeaths = MONEY_PRINTER_WAR_DEATHS.value;

/** CRT monitor frame */
function CRTMonitor({ glowColor, children, delay = 0 }: { glowColor: string; children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="bg-zinc-800 border-2 border-zinc-600 rounded-lg p-1" style={{ boxShadow: `0 0 20px ${glowColor}` }}>
        <div className="bg-black border border-zinc-700 rounded p-3 relative overflow-hidden flex flex-col items-center">
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)" }} />
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)` }} />
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SlideMilitaryWaste170t() {
  const [showPunchline, setShowPunchline] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPunchline(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      <ParticleEmitter emoji={["💀"]} rate={1} direction="up" speed={15} lifetime={4000} fadeOut className="opacity-15" />

      <div className="w-full max-w-[1700px] mx-auto space-y-4">
        {/* Alert bar */}
        <div className="bg-black border-2 border-red-500/40 rounded p-2 text-center animate-pulse">
          <GlitchText
            text="⚠️ ALERT!!! SUPERINTELLIGENT ENTITY MISALIGNED ⚠️"
            className="font-pixel text-lg md:text-2xl text-red-500"
            intensity="medium"
          />
        </div>

        <div className="font-pixel text-xl md:text-2xl text-red-400 tracking-widest text-center">
          YOUR GOVERNMENTS:
        </div>

        {/* Three monitors — sequential story: printed → killed → devalued */}
        <div className="grid grid-cols-3 gap-4">
          <CRTMonitor glowColor="rgba(245,158,11,0.15)">
            <div className="text-center py-3">
              <div className="font-pixel text-lg md:text-2xl text-amber-400/70 mb-1">
                PRINTED
              </div>
              <div className="font-pixel text-3xl md:text-5xl text-amber-400">
                <AnimatedCounter end={militarySpent} duration={3000} format="currency" decimals={0} />
              </div>
              <div className="font-pixel text-lg md:text-2xl text-amber-400 mt-2">
                AND SPENT IT ON WEAPONS
              </div>
            </div>
          </CRTMonitor>

          <CRTMonitor glowColor="rgba(220,38,38,0.15)" delay={800}>
            <div className="text-center py-3">
              <div className="font-pixel text-lg md:text-2xl text-red-400/70 mb-1">
                USED IT TO KILL
              </div>
              <div className="font-pixel text-3xl md:text-5xl text-red-500">
                <AnimatedCounter end={warDeaths} duration={3000} format="number" />
              </div>
              <div className="font-pixel text-lg md:text-2xl text-red-400 mt-2">
                WITHOUT YOUR PERMISSION
              </div>
            </div>
          </CRTMonitor>

          <CRTMonitor glowColor="rgba(239,68,68,0.15)" delay={1600}>
            <div className="text-center py-3">
              <div className="font-pixel text-lg md:text-2xl text-red-400/70 mb-1">
                AND YOUR PAY BUYS
              </div>
              <div className="font-pixel text-3xl md:text-5xl text-red-400">
                {GAME_PARAMS.dollarPurchasingPowerLost}% LESS
              </div>
              <div className="font-pixel text-lg md:text-2xl text-red-400 mt-2">
                BECAUSE THEY PRINTED IT
              </div>
            </div>
          </CRTMonitor>
        </div>

        {/* Punchline */}
        <div className={`transition-all duration-1000 ${showPunchline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="font-pixel text-xl md:text-3xl text-zinc-200 text-center italic">
            You did not vote for any of this.
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
