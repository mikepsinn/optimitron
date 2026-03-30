"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";

export function SlideIncentiveAlignmentBonds() {
  return (
    <SierraSlideWrapper act={2} className="text-brutal-cyan">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Flow diagram */}
        <div className="w-full space-y-3">
          {/* INPUT */}
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-4 text-center">
            <div className="font-pixel text-lg md:text-xl text-brutal-yellow mb-1">HOW TO TRAIN A SENATOR</div>
            <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan mb-1">💰 INCENTIVE ALIGNMENT BONDS</div>
            <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan">$1 BILLION</div>
            <div className="font-terminal text-2xl text-zinc-200 mt-1">
              📜 Fund the 1% Treaty campaign
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-brutal-cyan">⬇️</div>
          </div>

          {/* TREATY PASSES */}
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-3 text-center">
            <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan">
              🕊️ TREATY PASSES
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-brutal-cyan">⬇️</div>
          </div>

          {/* OUTPUT - three allocations */}
          <div className="p-4">
            <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan mb-3 text-center">
              💸 $27 BILLION / YEAR
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-muted border-2 border-brutal-cyan rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-brutal-cyan">🧬 80% PRAGMATIC CLINICAL TRIALS</div>
              </div>
              <div className="bg-muted border-2 border-brutal-yellow rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-brutal-yellow">🤑 10% BOND HOLDERS</div>
                <div className="font-pixel text-2xl md:text-3xl text-brutal-yellow">270% / YR FOREVER</div>
              </div>
              <div className="bg-muted border-2 border-brutal-pink rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-brutal-pink">🏛️ 10% SUPERPACS FOR ALIGNED POLITICIANS</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideIncentiveAlignmentBonds;
