"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { GlitchText } from "../../animations/glitch-text";
import { ParticleEmitter } from "../../animations/particle-emitter";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  MONEY_PRINTER_WAR_DEATHS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_DISEASE_DEATHS_DAILY,
  DISEASE_VS_WAR_DEATHS_RATIO,
  TREATY_ANNUAL_FUNDING,
  US_GOV_WASTE_VS_TREATY_MULTIPLIER,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/demo/formatters";

/* ── Derived values ──────────────────────────────────────────────── */

const militarySpent = CUMULATIVE_MILITARY_SPENDING_FED_ERA.value;
const warDeaths = MONEY_PRINTER_WAR_DEATHS.value;
const untreatedDiseases = Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value);
const dailyDeaths = Math.round(GLOBAL_DISEASE_DEATHS_DAILY.value);
const diseaseToWarRatio = Math.round(DISEASE_VS_WAR_DEATHS_RATIO.value);
const treatyCost = formatCurrency(Math.round(TREATY_ANNUAL_FUNDING.value));
const wasteCouldFundTreaty = Math.round(US_GOV_WASTE_VS_TREATY_MULTIPLIER.value);

// How many times the $170T could have funded the treaty
const militaryCouldFundTreaty = Math.round(militarySpent / TREATY_ANNUAL_FUNDING.value);

/** Animated SVG chart showing the decline of the dollar from $1.00 → $0.04 */
function DollarDeclineChart({ progress }: { progress: number }) {
  const W = 280;
  const H = 100;
  const PAD = 24;

  const data: [number, number][] = [
    [1913, 1.0], [1920, 0.82], [1930, 0.95], [1940, 0.97],
    [1945, 0.73], [1950, 0.58], [1960, 0.48], [1970, 0.37],
    [1980, 0.18], [1990, 0.1], [2000, 0.07], [2010, 0.05], [2024, 0.04],
  ];

  const xMin = data[0][0];
  const xMax = data[data.length - 1][0];

  const toX = (year: number) => PAD + ((year - xMin) / (xMax - xMin)) * (W - PAD * 2);
  const toY = (val: number) => PAD + (1 - val) * (H - PAD * 2);

  const points = data.map(([y, v]) => `${toX(y)},${toY(v)}`).join(" ");
  const areaPoints = `${toX(xMin)},${toY(0)} ${points} ${toX(xMax)},${toY(0)}`;
  const reveal = Math.min(1, (100 - progress) / 96);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[250px] mx-auto">
      {[0.5, 1.0].map((v) => (
        <line key={v} x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="#333" strokeWidth={0.5} strokeDasharray="2,3" />
      ))}
      <text x={PAD - 2} y={toY(1.0) + 3} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">$1.00</text>
      <text x={PAD - 2} y={toY(0) + 3} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">$0.00</text>
      <text x={toX(1913)} y={H - 2} fill="#666" fontSize={7} textAnchor="start" fontFamily="monospace">1913</text>
      <text x={toX(2024)} y={H - 2} fill="#666" fontSize={7} textAnchor="end" fontFamily="monospace">2024</text>
      <polygon points={areaPoints} fill="rgba(239,68,68,0.15)" clipPath="url(#revealClip2)" />
      <polyline points={points} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" clipPath="url(#revealClip2)" />
      {reveal >= 0.95 && (
        <>
          <circle cx={toX(2024)} cy={toY(0.04)} r={3} fill="#ef4444">
            <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x={toX(2024) - 4} y={toY(0.04) - 6} fill="#ef4444" fontSize={9} textAnchor="end" fontFamily="monospace" fontWeight="bold">$0.04</text>
        </>
      )}
      <defs>
        <clipPath id="revealClip2">
          <rect x={0} y={0} width={PAD + reveal * (W - PAD * 2)} height={H} />
        </clipPath>
      </defs>
    </svg>
  );
}

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
  const [dollarScale, setDollarScale] = useState(100);
  const [showContrast, setShowContrast] = useState(false);

  useEffect(() => {
    const shrinkInterval = setInterval(() => {
      setDollarScale((prev) => {
        if (prev <= 4) { clearInterval(shrinkInterval); return 4; }
        return prev - 2;
      });
    }, 60);

    const contrastTimer = setTimeout(() => setShowContrast(true), 4000);
    return () => { clearInterval(shrinkInterval); clearTimeout(contrastTimer); };
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

        <div className="font-pixel text-lg text-red-400 tracking-widest text-center">
          FAILURE ANALYSIS
        </div>

        {/* Three monitors */}
        <div className="grid grid-cols-3 gap-3">
          <CRTMonitor glowColor="rgba(245,158,11,0.15)">
            <div className="text-center">
              <div className="font-pixel text-2xl md:text-4xl text-amber-400">
                <AnimatedCounter end={militarySpent} duration={3000} format="currency" decimals={0} />
              </div>
              <div className="font-pixel text-sm md:text-lg text-amber-400 mt-1">
                PRINTED ON WEAPONS
              </div>
              <div className="font-pixel text-sm md:text-lg text-amber-400">SINCE 1913</div>
              <div className="text-2xl mt-2">🚀💣🔫✈️</div>
            </div>
          </CRTMonitor>

          <CRTMonitor glowColor="rgba(239,68,68,0.15)" delay={300}>
            <div className="text-center w-full">
              <div className="font-pixel text-2xl md:text-4xl text-red-400">
                {GAME_PARAMS.dollarPurchasingPowerLost}%
              </div>
              <div className="font-pixel text-sm md:text-lg text-red-400 mt-1">
                PURCHASING POWER DESTROYED
              </div>
              <DollarDeclineChart progress={dollarScale} />
            </div>
          </CRTMonitor>

          <CRTMonitor glowColor="rgba(220,38,38,0.15)" delay={600}>
            <div className="text-center">
              <div className="font-pixel text-2xl md:text-4xl text-red-500">
                <AnimatedCounter end={warDeaths} duration={3000} format="number" />
              </div>
              <div className="font-pixel text-sm md:text-lg text-red-400 mt-1">
                KILLED IN WARS
              </div>
              <div className="font-pixel text-sm md:text-lg text-red-400 animate-pulse">
                NO ONE VOTED FOR
              </div>
              <div className="text-2xl mt-2">⚰️💀⚰️💀⚰️</div>
            </div>
          </CRTMonitor>
        </div>

        {/* The devastating contrast */}
        <div className={`transition-all duration-1000 ${showContrast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {/* Meanwhile bar */}
          <div className="bg-black border-2 border-emerald-500/30 rounded p-3 space-y-3">
            <div className="font-pixel text-lg text-emerald-400 text-center tracking-widest">
              MEANWHILE
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-emerald-500/5 rounded p-2">
                <div className="font-pixel text-2xl md:text-3xl text-emerald-400">
                  {untreatedDiseases.toLocaleString()}
                </div>
                <div className="font-pixel text-xs md:text-sm text-zinc-400">
                  DISEASES WITHOUT TREATMENT
                </div>
              </div>
              <div className="text-center bg-emerald-500/5 rounded p-2">
                <div className="font-pixel text-2xl md:text-3xl text-emerald-400">
                  {dailyDeaths.toLocaleString()}/day
                </div>
                <div className="font-pixel text-xs md:text-sm text-zinc-400">
                  DYING OF CURABLE DISEASE
                </div>
              </div>
              <div className="text-center bg-emerald-500/5 rounded p-2">
                <div className="font-pixel text-2xl md:text-3xl text-emerald-400">
                  {treatyCost}/yr
                </div>
                <div className="font-pixel text-xs md:text-sm text-zinc-400">
                  COST TO FIX IT (1% OF MURDER BUDGET)
                </div>
              </div>
            </div>

            {/* Punchline */}
            <div className="font-pixel text-lg md:text-xl text-zinc-200 text-center italic">
              If cancer had oil reserves, you would have cured it by 2003.
            </div>
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
