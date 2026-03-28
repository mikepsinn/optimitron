"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC, type PaletteMode } from "@/lib/demo/palette";

type Palette = (typeof PALETTE_SEMANTIC)[PaletteMode];

interface DataCard {
  icon: string;
  label: string;
  description: string;
  detail: string;
  colorKey: keyof Pick<Palette, "primary" | "success" | "secondary" | "accent">;
}

const DATA_TYPES: DataCard[] = [
  {
    icon: "🗳️",
    label: "CITIZEN PRIORITIES",
    description: "What 8B people actually want",
    detail: "Pairwise rankings, consistency-checked",
    colorKey: "primary",
  },
  {
    icon: "📊",
    label: "POLICY GRADES",
    description: "Every policy scored A-F",
    detail: "Welfare impact, evidence, recommendation",
    colorKey: "success",
  },
  {
    icon: "🏥",
    label: "HEALTH EVIDENCE",
    description: "N-of-1 treatment results",
    detail: "Variable relationships, evidence grades",
    colorKey: "secondary",
  },
  {
    icon: "🔐",
    label: "ENCRYPTED SUBMISSIONS",
    description: "Individual preferences",
    detail: "AES-GCM-256 — only the owner decrypts",
    colorKey: "accent",
  },
];

const PHASE_1_MS = 500;
const PHASE_2_MS = 1500;
const PHASE_3_START_MS = 2500;
const CARD_STAGGER_MS = 400;
const PHASE_4_MS = PHASE_3_START_MS + DATA_TYPES.length * CARD_STAGGER_MS + 400;
const PHASE_5_MS = PHASE_4_MS + 1000;

export function SlideIpfsImmutableStorage() {
  const [phase, setPhase] = useState(0);
  const [visibleCards, setVisibleCards] = useState(0);
  const { palette: paletteMode } = useDemoStore();
  const palette = PALETTE_SEMANTIC[paletteMode];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase(1), PHASE_1_MS));
    timers.push(setTimeout(() => setPhase(2), PHASE_2_MS));

    DATA_TYPES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setPhase((p) => Math.max(p, 3));
          setVisibleCards(i + 1);
        }, PHASE_3_START_MS + i * CARD_STAGGER_MS)
      );
    });

    timers.push(setTimeout(() => setPhase(4), PHASE_4_MS));
    timers.push(setTimeout(() => setPhase(5), PHASE_5_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeSlideUp 0.4s ease-out forwards;
        }
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .gentle-pulse {
          animation: gentlePulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-4 w-full max-w-[1700px] mx-auto">

        {/* Phase 1 — Title */}
        <div
          className={`text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1
            className="font-pixel text-3xl md:text-5xl"
            style={{ color: palette.accent }}
          >
            THE DECENTRALIZED CENSUS
          </h1>
        </div>

        {/* Phase 2 — Source bar */}
        {phase >= 2 && (
          <div
            className="w-full rounded-lg p-4 text-center fade-in"
            style={{
              border: `1px solid ${palette.border}`,
              backgroundColor: `${palette.primary}10`,
            }}
          >
            <div
              className="font-pixel text-xl md:text-3xl"
              style={{ color: palette.foreground }}
            >
              👤 8 BILLION CITIZENS
            </div>
            <div
              className="font-terminal text-base md:text-lg mt-1"
              style={{ color: palette.muted }}
            >
              🔒 AES-GCM-256 encrypted — only you hold the key
            </div>
          </div>
        )}

        {/* Arrow */}
        {phase >= 2 && (
          <div className="font-pixel text-2xl fade-in" style={{ color: palette.muted }}>▼</div>
        )}

        {/* Phase 3 — Data type grid */}
        {phase >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {DATA_TYPES.map((card, i) => {
              if (i >= visibleCards) return null;
              const color = palette[card.colorKey];

              return (
                <div
                  key={card.label}
                  className="rounded-lg p-4 fade-in"
                  style={{
                    border: `1px solid ${color}40`,
                    backgroundColor: `${color}10`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{card.icon}</div>
                    <div>
                      <div
                        className="font-pixel text-lg md:text-xl"
                        style={{ color }}
                      >
                        {card.label}
                      </div>
                      <div
                        className="font-terminal text-base md:text-lg mt-1"
                        style={{ color: palette.foreground }}
                      >
                        {card.description}
                      </div>
                      <div
                        className="font-terminal text-sm md:text-base mt-0.5"
                        style={{ color: palette.muted }}
                      >
                        {card.detail}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Arrow */}
        {phase >= 3 && visibleCards >= DATA_TYPES.length && (
          <div className="font-pixel text-2xl fade-in" style={{ color: palette.muted }}>▼</div>
        )}

        {/* Phase 4 — Destination bar */}
        {phase >= 4 && (
          <div
            className="w-full rounded-lg p-4 fade-in"
            style={{
              border: `1px solid ${palette.border}`,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-center gap-6">
              <span
                className="font-pixel text-xl md:text-2xl px-3 py-1 rounded"
                style={{ color: palette.accent, backgroundColor: `${palette.accent}15` }}
              >
                STORACHA
              </span>
              <span className="font-pixel text-xl" style={{ color: palette.muted }}>+</span>
              <span
                className="font-pixel text-xl md:text-2xl px-3 py-1 rounded"
                style={{ color: palette.secondary, backgroundColor: `${palette.secondary}15` }}
              >
                IPFS
              </span>
            </div>
            <div
              className="font-terminal text-base md:text-lg text-center mt-2"
              style={{ color: palette.muted }}
            >
              Decentralized. Immutable. No login to verify.
            </div>
          </div>
        )}

        {/* Phase 5 — Punchline */}
        {phase >= 5 && (
          <p
            className="font-terminal text-xl md:text-3xl text-center fade-in gentle-pulse max-w-[1200px]"
            style={{ color: palette.foreground }}
          >
            Your species stores its census data on servers controlled by the people being graded.
          </p>
        )}

      </div>
    </SlideBase>
  );
}
