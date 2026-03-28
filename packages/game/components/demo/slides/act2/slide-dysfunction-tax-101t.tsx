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
  // Global opportunity costs
  { label: "🚧 Migration restrictions", value: 57_000_000_000_000 },
  { label: "🏥 Health innovation delays", value: 34_000_000_000_000 },
  { label: "🧪 Lead poisoning", value: 6_000_000_000_000 },
  { label: "🔬 Underfunded science", value: 4_000_000_000_000 },
  // Direct waste (US alone)
  { label: "🏠 Housing/zoning restrictions", value: 1_400_000_000_000 },
  { label: "🩺 Healthcare admin inefficiency", value: 1_200_000_000_000 },
  { label: "💣 Military overspend", value: 615_000_000_000 },
  { label: "📋 Regulatory red tape", value: 580_000_000_000 },
  { label: "📝 Tax compliance burden", value: 546_000_000_000 },
  { label: "⛽ Fossil fuel subsidies", value: 1_300_000_000_000 },
  { label: "─────────────────────────────────────", value: 0, isSeparator: true },
  { label: "💀 TOTAL ANNUAL COST", value: 106_641_000_000_000, isTotal: true },
];

export function SlideDysfunctionTax101t() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showFooter, setShowFooter] = useState(false);
  const [footerText, setFooterText] = useState("");

  const fullFooter =
    "Thank you for your payment. No refunds. No receipt.";

  useEffect(() => {
    // Reveal line items one at a time
    const timers: NodeJS.Timeout[] = [];
    LINE_ITEMS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, 800 + i * 500)
      );
    });

    // Start typewriter after all lines shown
    const footerDelay = 800 + LINE_ITEMS.length * 500 + 600;
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
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] mx-auto">
        {/* CRT Bug Report Title */}
        <div className="w-full bg-zinc-900 border border-red-500/50 rounded-lg overflow-hidden">
          <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🧾</span>
            <span className="font-pixel text-xl md:text-3xl text-red-400">
              RECEIPT: political_dysfunction_tax.exe
            </span>
          </div>

          <div className="p-4 space-y-1 border-b border-dashed border-zinc-700">
            <div className="font-pixel text-xl text-zinc-200">
              🦠 Status:{" "}
              <span className="text-red-400 animate-pulse">ACTIVE</span>
            </div>
            <div className="font-pixel text-xl text-zinc-200">
              ⚠️ Severity: <span className="text-red-400">CRITICAL</span>
            </div>
            <div className="font-pixel text-xl text-zinc-200">
              📅 Duration: <span className="text-amber-400">113 years</span>
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
                    className="font-pixel text-xl text-zinc-300 text-center"
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
                    className={`font-pixel text-xl md:text-2xl ${
                      item.isTotal ? "text-red-400" : "text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`font-pixel text-xl md:text-3xl ${
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
              <div className="text-center font-pixel text-xl text-zinc-200 pt-1">
                (88% of global GDP)
              </div>
            )}
          </div>
        </div>

        {/* Typewriter footer */}
        <div className="h-8 flex items-center">
          {showFooter && (
            <p className="font-pixel text-xl text-zinc-200 text-center italic">
              {footerText}
              <span className="animate-pulse">▊</span>
            </p>
          )}
        </div>
      </div>
    </SlideBase>
  );
}
