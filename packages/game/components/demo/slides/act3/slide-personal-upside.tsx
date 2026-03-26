"use client";

import { SlideBase } from "../slide-base";
import { PARAMETERS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

interface SaveSlot {
  title: string;
  tag: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  tagColor: string;
  lifetimeIncome: number;
  lifetimeLabel: string;
  haleGain: string;
  dysfunctionTax: string;
}

const SAVE_SLOTS: SaveSlot[] = [
  {
    title: "STATUS QUO",
    tag: "[LOADED]",
    borderColor: "border-zinc-600",
    bgColor: "bg-zinc-800/50",
    textColor: "text-zinc-400",
    tagColor: "text-zinc-500",
    lifetimeIncome: PARAMETERS.economic.statusQuoLifetimeIncome,
    lifetimeLabel: "",
    haleGain: "+0 years",
    dysfunctionTax: `-${formatCurrency(PARAMETERS.economic.annualDysfunctionTax)}/yr`,
  },
  {
    title: "1% TREATY",
    tag: "◄◄◄",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    tagColor: "text-emerald-400",
    lifetimeIncome: PARAMETERS.economic.personalLifetimeLoss,
    lifetimeLabel: "(12×)",
    haleGain: `+${PARAMETERS.health.haleGain} years`,
    dysfunctionTax: "eliminated",
  },
  {
    title: "WISHONIA TRAJECTORY",
    tag: "",
    borderColor: "border-amber-500/60",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    tagColor: "text-amber-400",
    lifetimeIncome: PARAMETERS.economic.wishoniaLifetimeIncome,
    lifetimeLabel: "(40×)",
    haleGain: "+15.7 years",
    dysfunctionTax: "what is that",
  },
];

export function SlidePersonalUpside() {
  return (
    <SlideBase act={3} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-lg md:text-2xl text-amber-400 text-center">
          💾 SAVE SLOTS — CHOOSE YOUR TIMELINE
        </h1>

        {/* Save Slots */}
        <div className="w-full space-y-4">
          {SAVE_SLOTS.map((slot, i) => (
            <div
              key={i}
              className={`${slot.bgColor} border-2 ${slot.borderColor} rounded-lg p-4 space-y-3`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-zinc-500">
                    SLOT {i + 1}:
                  </span>
                  <span className={`font-pixel text-xs ${slot.textColor}`}>
                    {slot.title}
                  </span>
                </div>
                {slot.tag && (
                  <span
                    className={`font-pixel text-sm ${slot.tagColor} ${
                      i === 1 ? "animate-pulse" : ""
                    }`}
                  >
                    {slot.tag}
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="font-pixel text-xs text-zinc-600 mb-1">
                    LIFETIME INCOME
                  </div>
                  <div className={`font-pixel text-xs ${slot.textColor}`}>
                    {formatCurrency(slot.lifetimeIncome)}{" "}
                    {slot.lifetimeLabel && (
                      <span className="text-zinc-500">
                        {slot.lifetimeLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-zinc-600 mb-1">
                    HALE GAIN
                  </div>
                  <div className={`font-pixel text-xs ${slot.textColor}`}>
                    {slot.haleGain}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-zinc-600 mb-1">
                    DYSFUNCTION TAX
                  </div>
                  <div className={`font-pixel text-xs ${slot.textColor}`}>
                    {slot.dysfunctionTax}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-sm md:text-xs text-zinc-500 text-center italic">
          You are currently on Slot 1. You chose it by not choosing.
        </p>
      </div>
    </SlideBase>
  );
}
