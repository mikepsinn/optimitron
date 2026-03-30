"use client";

import { SierraSlideWrapper } from "./SierraSlideWrapper";

export function SlideDecentralizedIrs() {
  return (
    <SierraSlideWrapper act={2}>
      <div className="flex flex-col items-center justify-center gap-8 max-w-[1400px] mx-auto">
        <h1 className="font-pixel text-3xl md:text-5xl text-brutal-yellow text-center">
          📄 A DECENTRALIZED IRS
        </h1>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 w-full items-center">
          {/* Current */}
          <div className="bg-muted border-2 border-brutal-red rounded-lg p-6 text-center">
            <div className="font-pixel text-xl md:text-2xl text-brutal-red mb-4">CURRENT</div>
            <div className="font-pixel text-5xl md:text-7xl text-brutal-red mb-1">$546B</div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground mb-4">ANNUAL COMPLIANCE COST</div>
            <div className="font-pixel text-3xl md:text-4xl text-brutal-red">74,000 pages</div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground">83,000 employees</div>
          </div>

          {/* Arrow */}
          <div className="font-pixel text-4xl text-brutal-yellow">→</div>

          {/* Replacement */}
          <div className="bg-muted border-2 border-brutal-cyan rounded-lg p-6 text-center">
            <div className="font-pixel text-xl md:text-2xl text-brutal-cyan mb-4">REPLACEMENT</div>
            <div className="font-pixel text-5xl md:text-7xl text-brutal-cyan mb-1">~$0</div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground mb-4">NO FILING, NO COMPLIANCE</div>
            <div className="font-pixel text-3xl md:text-4xl text-brutal-cyan">4 lines of code</div>
            <div className="font-pixel text-lg md:text-xl text-muted-foreground">0.5% automatic transaction tax</div>
          </div>
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlideDecentralizedIrs;
