"use client";

import { SlideBase } from "../slide-base";
import {
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
  TREATY_PERSONAL_UPSIDE_BLEND,
  TREATY_PROJECTED_HALE_YEAR_15,
  GLOBAL_HALE_CURRENT,
  GAME_PARAMS,
} from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const statusQuoLifetimeIncome = GAME_PARAMS.statusQuoLifetimeIncome;
const annualDysfunctionTax = Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value / 100) * 100;
const personalLifetimeLoss = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value / 100_000) * 100_000;
const haleGain = Math.round((TREATY_PROJECTED_HALE_YEAR_15.value - GLOBAL_HALE_CURRENT.value) * 10) / 10;
const wishoniaLifetimeIncome = GAME_PARAMS.wishoniaLifetimeIncome;

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
    textColor: "text-zinc-200",
    tagColor: "text-zinc-200",
    lifetimeIncome: statusQuoLifetimeIncome,
    lifetimeLabel: "",
    haleGain: "+0 years",
    dysfunctionTax: `-${formatCurrency(annualDysfunctionTax)}/yr`,
  },
  {
    title: "1% TREATY",
    tag: "◄◄◄",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    tagColor: "text-emerald-400",
    lifetimeIncome: personalLifetimeLoss,
    lifetimeLabel: "(12×)",
    haleGain: `+${haleGain} years`,
    dysfunctionTax: "eliminated",
  },
  {
    title: "WISHONIA TRAJECTORY",
    tag: "",
    borderColor: "border-amber-500/60",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    tagColor: "text-amber-400",
    lifetimeIncome: wishoniaLifetimeIncome,
    lifetimeLabel: "(40×)",
    haleGain: "+15.7 years",
    dysfunctionTax: "what is that",
  },
];

export function SlidePersonalUpside() {
  return (
    <SlideBase act={3} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-3xl md:text-5xl text-amber-400 text-center">
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
                  <span className="font-pixel text-xl md:text-3xl text-zinc-200">
                    SLOT {i + 1}:
                  </span>
                  <span className={`font-pixel text-xl md:text-3xl ${slot.textColor}`}>
                    {slot.title}
                  </span>
                </div>
                {slot.tag && (
                  <span
                    className={`font-pixel text-xl md:text-2xl ${slot.tagColor} ${
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
                  <div className="font-pixel text-xl text-zinc-300 mb-1">
                    LIFETIME INCOME
                  </div>
                  <div className={`font-pixel text-xl md:text-3xl ${slot.textColor}`}>
                    {formatCurrency(slot.lifetimeIncome)}{" "}
                    {slot.lifetimeLabel && (
                      <span className="text-zinc-200">
                        {slot.lifetimeLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xl text-zinc-300 mb-1">
                    HALE GAIN
                  </div>
                  <div className={`font-pixel text-xl md:text-3xl ${slot.textColor}`}>
                    {slot.haleGain}
                  </div>
                </div>
                <div>
                  <div className="font-pixel text-xl text-zinc-300 mb-1">
                    DYSFUNCTION TAX
                  </div>
                  <div className={`font-pixel text-xl md:text-3xl ${slot.textColor}`}>
                    {slot.dysfunctionTax}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-xl md:text-3xl text-zinc-200 text-center italic">
          You are currently on Slot 1. You chose it by not choosing.
        </p>
      </div>
    </SlideBase>
  );
}
