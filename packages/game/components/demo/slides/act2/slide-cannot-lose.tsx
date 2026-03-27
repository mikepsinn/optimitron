"use client";

import { SlideBase } from "../slide-base";
import { GAME_PARAMS } from "@/lib/demo/parameters";
import {
  TREATY_PERSONAL_UPSIDE_BLEND,
  POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL,
} from "@optimitron/data/parameters";
import { formatCurrency } from "@/lib/demo/formatters";

const personalLifetimeLoss = Math.round(TREATY_PERSONAL_UPSIDE_BLEND.value / 100_000) * 100_000;
const annualDysfunctionTax = Math.round(POLITICAL_DYSFUNCTION_TAX_PER_PERSON_ANNUAL.value / 100) * 100;

const contribution = 100;
const vcReturn15yr = Math.round(contribution * GAME_PARAMS.prizePoolFallbackMultiple);
const indexReturn15yr = Math.round(contribution * Math.pow(1.07, 15)); // index fund comparison

export function SlideCannotLose() {
  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-3xl text-zinc-300 text-center">
          📊 WORKED EXAMPLE — $100 IN THE FUND
        </h1>

        {/* Three Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Box 1: Treaty Passes */}
          <div className="bg-emerald-500/15 border-2 border-emerald-500/50 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-2xl text-emerald-400 text-center">
              ✅ TREATY PASSES
            </div>
            <div className="space-y-2 font-pixel text-lg md:text-xl text-zinc-200">
              <div>Your $100 grows at 17%/yr</div>
              <div>
                Plus VOTE point:{" "}
                <span className="text-emerald-400">
                  +{formatCurrency(GAME_PARAMS.valuePerVotePoint)}
                </span>
              </div>
              <div>
                Lifetime income gain:{" "}
                <span className="text-emerald-400">
                  +{formatCurrency(personalLifetimeLoss)}
                </span>
              </div>
            </div>
            <div className="font-pixel text-xl md:text-2xl text-emerald-400 text-center pt-2 border-t border-emerald-500/20">
              NET: +{formatCurrency(GAME_PARAMS.valuePerVotePoint + vcReturn15yr)}
            </div>
          </div>

          {/* Box 2: Treaty Fails */}
          <div className="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-lg p-4 space-y-3">
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 text-center">
              ✅ TREATY FAILS
            </div>
            <div className="space-y-2 font-pixel text-lg md:text-xl text-zinc-200">
              <div>VOTE points expire ($0)</div>
              <div>
                $100 at 17% → <span className="text-cyan-400">{formatCurrency(vcReturn15yr)}</span>
              </div>
              <div className="text-zinc-400">
                (vs {formatCurrency(indexReturn15yr)} in index funds)
              </div>
            </div>
            <div className="font-pixel text-xl md:text-2xl text-cyan-400 text-center pt-2 border-t border-cyan-500/20">
              NET: +{formatCurrency(vcReturn15yr - contribution)}
            </div>
            <div className="font-pixel text-lg text-zinc-400 text-center">
              Still beats your 401k by {((vcReturn15yr / indexReturn15yr - 1) * 100).toFixed(0)}%
            </div>
          </div>

          {/* Box 3: Did Not Play */}
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-lg p-4 space-y-3 opacity-80">
            <div className="font-pixel text-xl md:text-2xl text-red-400 text-center">
              ❌ DID NOT PLAY
            </div>
            <div className="space-y-2 font-pixel text-lg md:text-xl text-zinc-300">
              <div>$100 stays in index funds</div>
              <div>
                Grows to{" "}
                <span className="text-zinc-400">{formatCurrency(indexReturn15yr)}</span>
              </div>
              <div>
                Still paying{" "}
                {formatCurrency(annualDysfunctionTax)}/yr dysfunction tax
              </div>
            </div>
            <div className="font-pixel text-xl md:text-2xl text-red-400 text-center pt-2 border-t border-red-500/10">
              NET: -{formatCurrency(personalLifetimeLoss)}
            </div>
            <div className="font-pixel text-lg text-zinc-400 text-center">
              (opportunity cost of inaction)
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <p className="font-pixel text-xl md:text-2xl text-zinc-200 text-center italic">
          Two out of three outcomes are wins. The third one is your fault.
        </p>
      </div>
    </SlideBase>
  );
}
