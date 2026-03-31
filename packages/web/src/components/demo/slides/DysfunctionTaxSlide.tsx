"use client";

import { useState, useEffect } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { ScanLines } from "@/components/animations/GlitchText";

const ARCADE = "font-pixel";

const LINE_ITEMS = [
  { label: "Health innovation delays", value: 34, delay: 0.6 },
  { label: "Migration restrictions", value: 57, delay: 1.4 },
  { label: "Lead poisoning", value: 6, delay: 2.2 },
  { label: "Underfunded science", value: 4, delay: 3.0 },
];

const TYPEWRITER_TEXT = "This bug has been open for 113 years. No one has assigned it.";

/** Dysfunction tax slide — $101T bug report */
export default function DysfunctionTaxSlide() {
  const reduced = useReducedMotion();
  const [typedText, setTypedText] = useState(reduced ? TYPEWRITER_TEXT : "");

  useEffect(() => {
    if (reduced) return;
    const startDelay = 4800;
    const charDelay = 35;
    let timeout: ReturnType<typeof setTimeout>;
    let charIndex = 0;

    timeout = setTimeout(function tick() {
      if (charIndex <= TYPEWRITER_TEXT.length) {
        setTypedText(TYPEWRITER_TEXT.slice(0, charIndex));
        charIndex++;
        timeout = setTimeout(tick, charDelay);
      }
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [reduced]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden bg-foreground">
      <ScanLines />

      {/* Bug report dialog */}
      <motion.div
        initial={reduced ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl border-4 border-primary bg-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        {/* Header */}
        <div className="border-b-4 border-primary px-4 py-3 sm:px-6 sm:py-4">
          <p className={`${ARCADE} text-sm sm:text-base md:text-lg text-background uppercase`}>
            🐛 BUG REPORT: pluralistic_ignorance.exe
          </p>
        </div>

        {/* Metadata */}
        <div className="border-b-4 border-primary px-4 py-2 sm:px-6 sm:py-3 flex gap-6">
          <p className={`${ARCADE} text-xs sm:text-sm text-brutal-red uppercase`}>
            SEVERITY: CRITICAL
          </p>
          <p className={`${ARCADE} text-xs sm:text-sm text-brutal-yellow uppercase`}>
            STATUS: ACTIVE
          </p>
        </div>

        {/* Line items */}
        <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-3">
          {LINE_ITEMS.map((item) => (
            <motion.div
              key={item.label}
              initial={reduced ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.4 }}
              className="flex justify-between items-baseline"
            >
              <span className={`${ARCADE} text-xs sm:text-sm text-background uppercase`}>
                {item.label}
              </span>
              <span className={`${ARCADE} text-base sm:text-lg md:text-xl text-background font-black`}>
                $<CountUp value={item.value} duration={1} />T
              </span>
            </motion.div>
          ))}

          {/* Divider */}
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 3.6, duration: 0.3 }}
            style={{ originX: 0 }}
            className="border-t-4 border-primary my-2"
          />

          {/* Total */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.8, duration: 0.4 }}
            className="flex justify-between items-baseline"
          >
            <span className={`${ARCADE} text-sm sm:text-base text-background uppercase font-black`}>
              TOTAL ANNUAL COST
            </span>
            <span className={`${ARCADE} text-2xl sm:text-3xl md:text-4xl text-brutal-red font-black`}>
              $<CountUp value={101} duration={1.5} />T
            </span>
          </motion.div>

          {/* Percentage */}
          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.2, duration: 0.4 }}
            className={`${ARCADE} text-xs sm:text-sm text-brutal-red uppercase text-right`}
            style={{ animation: "bug-pulse 2s step-end infinite" }}
          >
            (88% OF GLOBAL GDP)
          </motion.p>
        </div>

        {/* Typewriter footer */}
        <div className="border-t-4 border-primary px-4 py-3 sm:px-6 sm:py-4 min-h-[3rem]">
          <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase text-left leading-relaxed`}>
            {typedText}
            {!reduced && typedText.length < TYPEWRITER_TEXT.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-2 h-3 bg-background ml-0.5 align-middle"
              />
            )}
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes bug-pulse { from, to { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
