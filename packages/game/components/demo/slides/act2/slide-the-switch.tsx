"use client";

import { SlideBase } from "../slide-base";
import { ParticleEmitter } from "../../animations/particle-emitter";
import React, { useEffect, useState } from "react";

// Emoji that assemble around the edges — the "tools" from Act II
const EDGE_TOOLS = [
  { emoji: "🧪", label: "dFDA",      pos: "top-left"     },
  { emoji: "💰", label: "Prize",     pos: "top-right"    },
  { emoji: "🏛️", label: "Policy",    pos: "mid-left"     },
  { emoji: "📊", label: "Optimizer", pos: "mid-right"    },
  { emoji: "⚖️", label: "IABs",      pos: "bottom-left"  },
  { emoji: "🔬", label: "Science",   pos: "bottom-right" },
] as const;

// CSS class map: each tool slides in from its nearest edge
const SLIDE_IN_CLASS: Record<(typeof EDGE_TOOLS)[number]["pos"], string> = {
  "top-left":     "tool-slide-in-topleft",
  "top-right":    "tool-slide-in-topright",
  "mid-left":     "tool-slide-in-left",
  "mid-right":    "tool-slide-in-right",
  "bottom-left":  "tool-slide-in-bottomleft",
  "bottom-right": "tool-slide-in-bottomright",
};

// Absolute position for each slot
const POSITION_STYLE: Record<(typeof EDGE_TOOLS)[number]["pos"], React.CSSProperties> = {
  "top-left":     { top: "8%",  left:  "6%"  },
  "top-right":    { top: "8%",  right: "6%"  },
  "mid-left":     { top: "44%", left:  "4%"  },
  "mid-right":    { top: "44%", right: "4%"  },
  "bottom-left":  { bottom: "8%", left:  "6%" },
  "bottom-right": { bottom: "8%", right: "6%" },
};

export function SlideTheSwitch() {
  const [phase, setPhase] = useState(0);
  // Which tool emoji have slid into place (index into EDGE_TOOLS)
  const [toolsIn, setToolsIn] = useState(0);
  // Whether the lever has flipped to ON
  const [leverOn, setLeverOn] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1 — first line of text
    timers.push(setTimeout(() => setPhase(1), 500));
    // Phase 1b — second line (1s stagger)
    timers.push(setTimeout(() => setPhase(2), 1500));
    // Phase 1c — third line (emotional beat, another 1s)
    timers.push(setTimeout(() => setPhase(3), 2500));

    // Phase 2 — tool emoji assemble, staggered 300ms apart
    EDGE_TOOLS.forEach((_, i) => {
      timers.push(setTimeout(() => setToolsIn(i + 1), 4000 + i * 300));
    });

    // Phase 3 — THE SWITCH appears
    timers.push(setTimeout(() => setPhase(4), 6000));

    // Phase 4 — lever flips ON + particle burst + flash
    timers.push(setTimeout(() => {
      setPhase(5);
      setLeverOn(true);
    }, 7500));

    // Phase 5 — quiet closing lines
    timers.push(setTimeout(() => setPhase(6), 9000));
    timers.push(setTimeout(() => setPhase(7), 10200));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        /* ── Text stagger ── */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }

        /* ── Tool slide-ins from each edge ── */
        @keyframes slide-in-topleft {
          from { opacity: 0; transform: translate(-60px, -60px) scale(0.5); }
          to   { opacity: 1; transform: translate(0, 0) scale(1);           }
        }
        @keyframes slide-in-topright {
          from { opacity: 0; transform: translate(60px, -60px) scale(0.5); }
          to   { opacity: 1; transform: translate(0, 0) scale(1);          }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-70px) scale(0.5); }
          to   { opacity: 1; transform: translateX(0) scale(1);       }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(70px) scale(0.5); }
          to   { opacity: 1; transform: translateX(0) scale(1);      }
        }
        @keyframes slide-in-bottomleft {
          from { opacity: 0; transform: translate(-60px, 60px) scale(0.5); }
          to   { opacity: 1; transform: translate(0, 0) scale(1);          }
        }
        @keyframes slide-in-bottomright {
          from { opacity: 0; transform: translate(60px, 60px) scale(0.5); }
          to   { opacity: 1; transform: translate(0, 0) scale(1);         }
        }
        .tool-slide-in-topleft     { animation: slide-in-topleft     0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .tool-slide-in-topright    { animation: slide-in-topright    0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .tool-slide-in-left        { animation: slide-in-left        0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .tool-slide-in-right       { animation: slide-in-right       0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .tool-slide-in-bottomleft  { animation: slide-in-bottomleft  0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .tool-slide-in-bottomright { animation: slide-in-bottomright 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

        /* Tool pulse once after all have landed */
        @keyframes tool-pulse {
          0%   { transform: scale(1);    filter: brightness(1);   }
          40%  { transform: scale(1.35); filter: brightness(2);   }
          100% { transform: scale(1);    filter: brightness(1);   }
        }
        .tool-pulse { animation: tool-pulse 0.6s ease-out forwards; }

        /* ── Lever rotation ── */
        .lever {
          transform-origin: center bottom;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lever-off { transform: rotate(30deg);  }
        .lever-on  { transform: rotate(-30deg); }

        /* ── Screen flash on flip ── */
        @keyframes screen-flash {
          0%   { opacity: 0; }
          15%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
        .screen-flash { animation: screen-flash 0.6s ease-out forwards; }

        /* ── Radial glow expansion ── */
        @keyframes glow-expand {
          from { opacity: 0.7; transform: scale(0);   }
          to   { opacity: 0;   transform: scale(2.5); }
        }
        .glow-expand { animation: glow-expand 1.4s ease-out forwards; }

        /* ── Closing lines ── */
        @keyframes fade-in-slow {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fade-in-slow { animation: fade-in-slow 0.8s ease-out forwards; }
      `}</style>

      {/* ── Tool emoji assembled around the edges ── */}
      {EDGE_TOOLS.map((tool, i) => {
        const hasLanded = toolsIn > i;
        const allLanded = toolsIn >= EDGE_TOOLS.length;
        return (
          <div
            key={tool.pos}
            className="absolute pointer-events-none"
            style={{
              ...POSITION_STYLE[tool.pos],
              opacity: hasLanded ? 1 : 0,
            }}
            aria-hidden
          >
            <div
              className={[
                "text-2xl md:text-3xl select-none",
                hasLanded ? SLIDE_IN_CLASS[tool.pos] : "",
                // Pulse once when all are landed, or again on lever flip
                allLanded && !leverOn ? "tool-pulse" : "",
                leverOn ? "tool-pulse" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {tool.emoji}
            </div>
          </div>
        );
      })}

      {/* ── Main content ── */}
      <div className="flex flex-col items-center gap-6 w-full max-w-[1700px] mx-auto text-center">

        {/* Lines 1–3: staggered reveal */}
        <div className="space-y-3">
          {phase >= 1 && (
            <p className="font-pixel text-sm md:text-lg text-zinc-300 fade-up">
              TWO NUMBERS ON A SCOREBOARD
            </p>
          )}
          {phase >= 2 && (
            <p className="font-pixel text-sm md:text-lg text-zinc-300 fade-up">
              AND PIECES OF PAPER WITH PRESIDENTS ON THEM
            </p>
          )}
          {phase >= 3 && (
            <p className="font-pixel text-base md:text-xl text-amber-400 fade-up leading-snug">
              DID WHAT NO COMMITTEE, NO CHARITY,<br />
              AND NO CENTRAL PLAN HAS EVER DONE.
            </p>
          )}
        </div>

        {/* THE SWITCH */}
        {phase >= 4 && (
          <div className="flex flex-col items-center gap-3 fade-up">
            <p className="font-pixel text-2xl md:text-4xl text-emerald-400 animate-pulse tracking-widest">
              HERE IS THE SWITCH
            </p>

            {/* Switch housing */}
            <div className="relative flex flex-col items-center gap-2 border-2 border-emerald-500 bg-zinc-900/80 px-10 py-6 rounded">
              {/* State label */}
              <div className="font-pixel text-xs tracking-widest">
                <span className={leverOn ? "text-zinc-600" : "text-red-400"}>OFF</span>
                <span className="text-zinc-600 mx-3">·</span>
                <span className={leverOn ? "text-emerald-400" : "text-zinc-600"}>ON</span>
              </div>

              {/* Lever track */}
              <div
                className="relative flex items-center justify-center"
                style={{ width: 48, height: 80 }}
              >
                {/* Track groove */}
                <div className="absolute inset-x-0 mx-auto w-2 h-full bg-zinc-700 rounded-full" style={{ left: "calc(50% - 4px)" }} />

                {/* The lever itself */}
                <div
                  className={`lever absolute bottom-0 ${leverOn ? "lever-on" : "lever-off"}`}
                  style={{ width: 16, height: 56, left: "calc(50% - 8px)" }}
                >
                  {/* Shaft */}
                  <div className={`w-full h-full rounded-sm transition-colors duration-500 ${leverOn ? "bg-emerald-400" : "bg-red-500"}`} />
                  {/* Knob */}
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 transition-colors duration-500 ${leverOn ? "bg-emerald-300 border-emerald-200" : "bg-red-400 border-red-300"}`}
                  />
                </div>
              </div>

              {/* Glow ring at base */}
              <div
                className={`w-10 h-3 rounded-full blur-sm transition-all duration-500 ${leverOn ? "bg-emerald-400 opacity-80" : "bg-red-500 opacity-40"}`}
              />
            </div>
          </div>
        )}

        {/* Closing lines */}
        {phase >= 6 && (
          <p className="font-terminal text-sm text-zinc-400 fade-in-slow">
            You do not need to build the machinery.
          </p>
        )}
        {phase >= 7 && (
          <p className="font-terminal text-sm md:text-lg text-emerald-400 fade-in-slow">
            You need to turn it on.
          </p>
        )}
      </div>

      {/* ── Particle burst on lever flip ── */}
      {phase >= 5 && (
        <ParticleEmitter
          emoji={["✨", "🌟", "💫"]}
          burst={40}
          direction="radial"
          speed={120}
          lifetime={3000}
          active={false}
        />
      )}

      {/* ── Screen flash overlay ── */}
      {phase >= 5 && (
        <div
          className="absolute inset-0 pointer-events-none screen-flash z-20"
          style={{ backgroundColor: "rgb(255,255,255)" }}
          aria-hidden
        />
      )}

      {/* ── Radial glow expansion from center ── */}
      {phase >= 5 && (
        <div
          className="absolute inset-0 pointer-events-none glow-expand z-10"
          style={{
            background:
              "radial-gradient(circle at center, rgba(52,211,153,0.45) 0%, transparent 65%)",
          }}
          aria-hidden
        />
      )}
    </SlideBase>
  );
}
