"use client";

import { SlideBase } from "../slide-base";
import { AnimatedCounter } from "../../animations/animated-counter";
import { useEffect, useState } from "react";

interface LineItem {
  label: string;
  value: number;
  isSeparator?: boolean;
  isTotal?: boolean;
}

const LINE_ITEMS: LineItem[] = [
  { label: "Health innovation delays", value: 34_000_000_000_000 },
  { label: "Migration restrictions", value: 57_000_000_000_000 },
  { label: "Lead poisoning", value: 6_000_000_000_000 },
  { label: "Underfunded science", value: 4_000_000_000_000 },
  { label: "─────────────────", value: 0, isSeparator: true },
  { label: "TOTAL ANNUAL COST", value: 101_000_000_000_000, isTotal: true },
];

export function SlideDysfunctionTax() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showFooter, setShowFooter] = useState(false);
  const [footerText, setFooterText] = useState("");

  const fullFooter =
    "This bug has been open for 113 years. No one has assigned it.";

  useEffect(() => {
    // Reveal line items one at a time
    const timers: NodeJS.Timeout[] = [];
    LINE_ITEMS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, 800 + i * 700)
      );
    });

    // Start typewriter after all lines shown
    const footerDelay = 800 + LINE_ITEMS.length * 700 + 600;
    timers.push(
      setTimeout(() => {
        setShowFooter(true);
      }, footerDelay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // Typewriter effect for footer
  useEffect(() => {
    if (!showFooter) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex++;
      setFooterText(fullFooter.slice(0, charIndex));
      if (charIndex >= fullFooter.length) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [showFooter]);

  return (
    <SlideBase act={2} className="text-red-400">
      <div className="flex flex-col items-center justify-center gap-6 max-w-7xl mx-auto">
        {/* CRT Bug Report Title */}
        <div className="w-full bg-zinc-900 border border-red-500/50 rounded-lg overflow-hidden">
          <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center gap-2">
            <span className="text-base">🐛</span>
            <span className="font-pixel text-xs md:text-sm text-red-400">
              BUG REPORT: pluralistic_ignorance.exe
            </span>
          </div>

          <div className="p-4 space-y-1">
            <div className="font-pixel text-sm text-zinc-500">
              Status:{" "}
              <span className="text-red-400 animate-pulse">ACTIVE</span>
            </div>
            <div className="font-pixel text-sm text-zinc-500">
              Severity: <span className="text-red-400">CRITICAL</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-4 pb-4 space-y-3">
            {LINE_ITEMS.map((item, i) => {
              if (i >= visibleLines) return null;

              if (item.isSeparator) {
                return (
                  <div
                    key={i}
                    className="font-pixel text-sm text-zinc-600 text-center"
                  >
                    {item.label}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`flex justify-between items-baseline ${
                    item.isTotal ? "border-t border-zinc-700 pt-2" : ""
                  }`}
                >
                  <span
                    className={`font-pixel text-sm md:text-xs ${
                      item.isTotal ? "text-red-400" : "text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`font-pixel text-sm md:text-base ${
                      item.isTotal ? "text-red-400" : "text-amber-400"
                    }`}
                  >
                    <AnimatedCounter
                      end={item.value}
                      duration={1200}
                      format="currency"
                      decimals={0}
                    />
                  </span>
                </div>
              );
            })}

            {/* GDP percentage */}
            {visibleLines >= LINE_ITEMS.length && (
              <div className="text-center font-pixel text-sm text-zinc-500 pt-1">
                (88% of global GDP)
              </div>
            )}
          </div>
        </div>

        {/* Typewriter footer */}
        <div className="h-8 flex items-center">
          {showFooter && (
            <p className="font-pixel text-sm md:text-xs text-zinc-500 text-center italic">
              {footerText}
              <span className="animate-pulse">▊</span>
            </p>
          )}
        </div>
      </div>
    </SlideBase>
  );
}
