"use client";

import { SlideBase } from "../slide-base";

export function SlideDfda() {
  return (
    <SlideBase act={2} className="text-emerald-400">
      <div className="flex flex-col items-center justify-center gap-5 max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-pixel text-xl md:text-3xl text-cyan-400 text-center">
          THE DECENTRALIZED FDA
        </h1>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Traditional FDA */}
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-5 space-y-3 opacity-70">
            <div className="font-pixel text-base md:text-lg text-red-400 text-center">
              🏥 TRADITIONAL FDA
            </div>
            <div className="space-y-2 font-terminal text-sm md:text-base text-zinc-400">
              <div className="flex justify-between">
                <span>Cost per patient:</span>
                <span className="text-red-400 font-pixel">$41,000</span>
              </div>
              <div className="flex justify-between">
                <span>Time after proven safe:</span>
                <span className="text-red-400 font-pixel">8.2 years</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-red-400 font-pixel">1.9M slots/yr</span>
              </div>
              <div className="flex justify-between">
                <span>Deaths from delay:</span>
                <span className="text-red-400 font-pixel">102 million</span>
              </div>
              <div className="flex justify-between">
                <span>Executives jailed:</span>
                <span className="text-red-400 font-pixel">0</span>
              </div>
            </div>
          </div>

          {/* Decentralized FDA */}
          <div className="bg-emerald-500/15 border-2 border-emerald-500/50 rounded-lg p-5 space-y-3">
            <div className="font-pixel text-base md:text-lg text-emerald-400 text-center">
              🧪 DECENTRALIZED FDA
            </div>
            <div className="space-y-2 font-terminal text-sm md:text-base text-zinc-300">
              <div className="flex justify-between">
                <span>Cost per patient:</span>
                <span className="text-emerald-400 font-pixel">$929</span>
              </div>
              <div className="flex justify-between">
                <span>Time after proven safe:</span>
                <span className="text-emerald-400 font-pixel">real-time</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="text-emerald-400 font-pixel">23.4M slots/yr</span>
              </div>
              <div className="flex justify-between">
                <span>Deaths from delay:</span>
                <span className="text-emerald-400 font-pixel">zero</span>
              </div>
              <div className="flex justify-between">
                <span>Auditability:</span>
                <span className="text-emerald-400 font-pixel">code is auditable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="font-pixel text-xl md:text-3xl text-cyan-300 text-center mt-2">
          44x cheaper. 12.3x more capacity.
        </div>
      </div>
    </SlideBase>
  );
}
