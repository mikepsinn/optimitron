"use client";

import { SlideBase } from "../slide-base";
import { useEffect, useState } from "react";

interface Row {
  label: string;
  left: string;
  right: string;
  rightClass?: string;
  isCode?: boolean;
  leftBlank?: boolean;
}

const ROWS: Row[] = [
  { label: "Dollar value destroyed:", left: "97%", right: "0%" },
  { label: "Wars funded:", left: "all of them", right: "0" },
  { label: "Citizens consulted:", left: "0", right: "8,000,000,000" },
  { label: "Audit results:", left: "no", right: "view source", rightClass: "underline cursor-default" },
  { label: "print(money):", left: "", right: "FUNCTION REMOVED", rightClass: "text-red-400", isCode: true, leftBlank: true },
  { label: "fund(war):", left: "", right: "FUNCTION REMOVED", rightClass: "text-red-400", isCode: true, leftBlank: true },
];

const TYPEWRITER_TEXT = "> print(money)";

export function SlideReplaceFed() {
  const [phase, setPhase] = useState(0);
  const [visibleRows, setVisibleRows] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setPhase(1), 500));
    timers.push(setTimeout(() => setPhase(2), 1500));
    timers.push(setTimeout(() => setPhase(3), 2000));
    timers.push(setTimeout(() => setPhase(4), 5000));
    timers.push(setTimeout(() => setPhase(5), 7000));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Stagger rows once phase 3 starts
  useEffect(() => {
    if (phase < 3) return;
    const timers: NodeJS.Timeout[] = [];
    ROWS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows(i + 1), i * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Typewriter effect once phase 4 starts
  useEffect(() => {
    if (phase < 4) return;

    setTypedChars(0);
    setShowError(false);

    const interval = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= TYPEWRITER_TEXT.length) {
          clearInterval(interval);
          setTimeout(() => setShowError(true), 400);
          return prev;
        }
        return prev + 1;
      });
    }, 60);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, [phase]);

  return (
    <SlideBase act={2}>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-4">

        {/* Phase 1 — Title */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 1 ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="font-pixel text-xl md:text-3xl text-emerald-400">
            🏦 CENTRAL BANK REPLACEMENT
          </h1>
        </div>

        {/* Phase 2 — Split comparison */}
        {phase >= 2 && (
          <div className="w-full grid grid-cols-2 gap-4 fade-in">

            {/* LEFT — Federal Reserve */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="font-pixel text-sm md:text-base text-red-400 text-center mb-0.5 tracking-widest">
                FEDERAL RESERVE
              </div>
              <div className="font-pixel text-sm text-zinc-500 text-center mb-3">
                (1913–present)
              </div>

              <div className="space-y-3">
                {ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`${i < visibleRows ? "fade-in" : "opacity-0"}`}
                  >
                    <div className="font-pixel text-sm md:text-base text-zinc-500 mb-1">
                      {row.label}
                    </div>
                    {row.leftBlank ? (
                      <div className="font-pixel text-sm md:text-base text-zinc-700 select-none">
                        &mdash;
                      </div>
                    ) : (
                      <div className="font-pixel text-sm md:text-base text-red-400 line-through">
                        {row.left}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Smart Contract */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="font-pixel text-sm md:text-base text-emerald-400 text-center mb-0.5 tracking-widest">
                SMART CONTRACT
              </div>
              {/* spacer to mirror the "(1913–present)" line */}
              <div className="font-pixel text-sm text-zinc-500 text-center mb-3 invisible">
                &nbsp;
              </div>

              <div className="space-y-3">
                {ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`${i < visibleRows ? "fade-in" : "opacity-0"}`}
                  >
                    {/* Mirror label for alignment */}
                    <div className="font-pixel text-sm md:text-base text-zinc-500 mb-1 invisible">
                      {row.label}
                    </div>
                    {row.isCode ? (
                      <div className="font-terminal text-sm md:text-base text-red-400">
                        <span className="line-through">{row.label.replace(":", "")}</span>
                        {" "}REMOVED
                      </div>
                    ) : (
                      <div className={`font-pixel text-sm md:text-base text-emerald-400 ${row.rightClass ?? ""}`}>
                        {row.right}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Phase 4 — Terminal block */}
        <div
          className={`w-full transition-opacity duration-700 ${
            phase >= 4 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-black/80 border border-zinc-700 rounded p-4 font-terminal">
            <div className="text-base md:text-lg text-emerald-400">
              {TYPEWRITER_TEXT.slice(0, typedChars)}
              <span className={`${showCursor ? "opacity-100" : "opacity-0"}`}>_</span>
            </div>
            {showError && (
              <div className="text-base md:text-lg text-red-400 mt-1 fade-in">
                ERROR: print() is not a function
              </div>
            )}
          </div>
        </div>

        {/* Phase 5 — Bottom text */}
        <div
          className={`w-full text-center transition-opacity duration-700 ${
            phase >= 5 ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-terminal text-base md:text-lg text-zinc-400">
            Your engineers will appreciate this.
          </p>
          <p className="font-terminal text-base md:text-lg text-zinc-400">
            Your central bankers will not.
          </p>
        </div>

      </div>
    </SlideBase>
  );
}
