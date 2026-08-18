"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";

export function SlideIncentiveAlignmentBonds() {
  return (
    <SierraSlideWrapper act={2} className="text-background">
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1700px] mx-auto">
        {/* Flow diagram */}
        <div className="w-full space-y-3">
          {/* INPUT */}
          <div className="bg-muted border-2 border-background rounded-lg p-4 text-center">
            <div className="font-pixel text-lg md:text-xl text-background mb-1">HOW TO TRAIN A SENATOR</div>
            <div className="font-pixel text-2xl md:text-3xl text-background mb-1">💰 INCENTIVE ALIGNMENT BONDS</div>
            <div className="font-pixel text-2xl md:text-3xl text-background">$1 BILLION</div>
            <div className="font-terminal text-2xl text-zinc-200 mt-1">
              📜 Fund the 1% Treaty campaign
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-background">⬇️</div>
          </div>

          {/* TREATY PASSES */}
          <div className="bg-muted border-2 border-background rounded-lg p-3 text-center">
            <div className="font-pixel text-2xl md:text-3xl text-background">
              🕊️ TREATY PASSES
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="font-pixel text-2xl text-background">⬇️</div>
          </div>

          {/* OUTPUT - three allocations */}
          <div className="p-4">
            <div className="font-pixel text-2xl md:text-3xl text-background mb-3 text-center">
              💸 $27 BILLION / YEAR
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-muted border-2 border-background rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-background">🧬 80% PRAGMATIC CLINICAL TRIALS</div>
              </div>
              <div className="bg-muted border-2 border-background rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-background">🤑 10% BOND HOLDERS</div>
                <div className="font-pixel text-2xl md:text-3xl text-background">270% / YR FOREVER</div>
              </div>
              <div className="bg-muted border-2 border-foreground rounded p-3 text-center">
                <div className="font-pixel text-2xl md:text-3xl text-foreground">🏛️ 10% SUPERPACS FOR ALIGNED POLITICIANS</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </SierraSlideWrapper>
  );
}
export default SlideIncentiveAlignmentBonds;
