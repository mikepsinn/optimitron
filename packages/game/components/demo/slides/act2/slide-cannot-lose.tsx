"use client";

import { SlideBase } from "../slide-base";
import { PARAMETERS } from "@/lib/demo/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

export function SlideCannotLose() {
  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-sm md:text-lg text-zinc-300 text-center">
          📊 WORKED EXAMPLE — $100 DEPOSIT + 2 FRIENDS PLAYING
        </h1>

        {/* Three Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Box 1: Humanity Wins */}
          <div className="bg-emerald-500/15 border-2 border-emerald-500/50 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xs text-emerald-400 text-center">
              ✅ HUMANITY WINS
            </div>
            <div className="space-y-2 font-pixel text-xs text-zinc-400">
              <div>Deposit goes to VOTE holders</div>
              <div>
                Your VOTE points: 2 ×{" "}
                {formatCurrency(PARAMETERS.game.valuePerVotePoint)}
              </div>
              <div className="text-emerald-400 text-xs">
                = {formatCurrency(PARAMETERS.game.valuePerVotePoint * 2)}
              </div>
              <div className="border-t border-emerald-500/20 pt-2">
                Lifetime income:{" "}
                <span className="text-emerald-400">
                  +{formatCurrency(PARAMETERS.economic.personalLifetimeLoss)}
                </span>
              </div>
            </div>
            <div className="font-pixel text-sm text-emerald-400 text-center pt-1 border-t border-emerald-500/20">
              NET: +$16,087,000
            </div>
          </div>

          {/* Box 2: Humanity Misses */}
          <div className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xs text-emerald-300/70 text-center">
              ✅ HUMANITY MISSES
            </div>
            <div className="space-y-2 font-pixel text-xs text-zinc-500">
              <div>VOTE points expire ($0)</div>
              <div>
                Deposit: $100 → <span className="text-emerald-400">$1,110</span>
              </div>
              <div className="text-zinc-500">(11× yield)</div>
            </div>
            <div className="font-pixel text-sm text-emerald-300/70 text-center pt-1 border-t border-emerald-500/10">
              NET: +$1,010
            </div>
          </div>

          {/* Box 3: Did Not Play */}
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-lg p-4 space-y-3 opacity-80">
            <div className="font-pixel text-xs text-red-400/70 text-center">
              ❌ DID NOT PLAY
            </div>
            <div className="space-y-2 font-pixel text-xs text-zinc-600">
              <div>$0 returned</div>
              <div>$0 earned</div>
              <div>
                Still paying{" "}
                {formatCurrency(PARAMETERS.economic.annualDysfunctionTax)}/yr
                dysfunction tax
              </div>
              <div>
                Missed{" "}
                {formatCurrency(PARAMETERS.economic.personalLifetimeLoss)}
              </div>
            </div>
            <div className="font-pixel text-sm text-red-400/70 text-center pt-1 border-t border-red-500/10">
              NET: -{formatCurrency(PARAMETERS.economic.personalLifetimeLoss)}
            </div>
            <div className="font-pixel text-xs text-zinc-600 text-center">
              (opportunity cost)
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-sm md:text-xs text-zinc-400 text-center italic">
          Two out of three outcomes are wins. The third one is your fault.
        </p>
      </div>
    </SlideBase>
  );
}
