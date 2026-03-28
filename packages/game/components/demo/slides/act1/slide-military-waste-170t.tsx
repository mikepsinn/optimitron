"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  MONEY_PRINTER_WAR_DEATHS,
} from "@optimitron/data/parameters";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/demo/formatters";

const militarySpent = CUMULATIVE_MILITARY_SPENDING_FED_ERA.value;
const warDeaths = MONEY_PRINTER_WAR_DEATHS.value;

const STEPS = [
  {
    prefix: "PRINTED",
    value: formatCurrency(militarySpent),
    suffix: "OUT OF NOTHING",
    color: "text-amber-400",
    delay: 1200,
  },
  {
    prefix: "USED IT TO KILL",
    value: warDeaths.toLocaleString(),
    suffix: "OF YOU AND DESTROYED THINGS HUMANS SPENT THEIR ENTIRE LIVES BUILDING",
    color: "text-red-500",
    delay: 2800,
  },
  {
    prefix: "YOUR PAY NOW BUYS",
    value: `${GAME_PARAMS.dollarPurchasingPowerLost}%`,
    suffix: "LESS DUE TO THIS ENORMOUS DESTRUCTION OF HUMAN POTENTIAL",
    color: "text-red-400",
    delay: 4400,
  },
];

export function SlideMilitaryWaste170t() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);

  useEffect(() => {
    STEPS.forEach((step, i) => {
      setTimeout(() => setVisibleSteps(i + 1), step.delay);
    });
    setTimeout(() => setShowPunchline(true), 6000);
  }, []);

  return (
    <SlideBase act={1} className="text-red-500">
      <div className="w-full max-w-[1500px] mx-auto space-y-6">
        {/* Header — Wishonia voice */}
        <div className="text-center space-y-2">
          <div className="font-pixel text-2xl md:text-3xl text-zinc-200">
            THE MISALIGNED SUPERINTELLIGENCES YOU CALL GOVERNMENTS HAVE:
          </div>
        </div>

        {/* Sequential steps */}
        <div className="space-y-6 pl-4">
          {STEPS.map((step, i) => (
            <div
              key={step.prefix}
              className={`transition-all duration-700 ${
                i < visibleSteps
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <div className="space-y-1">
                <div className="font-pixel text-xl md:text-2xl text-zinc-400">
                  {step.prefix}
                </div>
                <div className={`font-pixel text-5xl md:text-7xl ${step.color}`}>
                  {step.value}
                </div>
                <div className="font-pixel text-xl md:text-2xl text-zinc-400">
                  {step.suffix}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Punchline */}
        <div
          className={`transition-all duration-1000 space-y-3 ${
            showPunchline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="font-pixel text-2xl md:text-3xl text-zinc-300 text-center">
            You were not consulted.
          </div>
          <div className="font-pixel text-xl md:text-2xl text-amber-400 text-center">
            On Wishonia this is known as beige crime — crime too boring for anyone to investigate.
          </div>
        </div>
      </div>
    </SlideBase>
  );
}
