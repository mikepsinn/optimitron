"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

export function SlideEasterEgg() {
  const [showText, setShowText] = useState(false);
  const { palette } = useDemoStore();

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SlideBase className="relative">
      {/* Dark fade effect */}
      <div className="absolute inset-0 bg-black opacity-80" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div
          className={`
            text-center font-terminal max-w-[1700px] px-8
            transition-opacity duration-2000
            ${showText ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ color: PALETTE_SEMANTIC[palette].foreground }}
        >
          <p className="text-2xl md:text-4xl opacity-70 mb-6">
            The Earth Optimization Game
          </p>

          <div className="border-t border-current opacity-20 mb-6" />

          <p className="text-xl md:text-3xl opacity-70 mb-2">
            Made possible by
          </p>

          <div className="space-y-4 mb-8">
            <p className="text-2xl md:text-4xl opacity-90">
              Protocol Labs &amp; Funding the Commons
            </p>
          </div>

          <div className="border-t border-current opacity-20 mb-6" />

          <p className="text-xl md:text-2xl opacity-50 mb-3">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xl md:text-2xl opacity-60 mb-8">
            <span>Storacha</span>
            <span>Hypercerts</span>
            <span>World ID</span>
            <span>Next.js</span>
            <span>Solidity</span>
            <span>Base</span>
            <span>Aave</span>
          </div>

          <div className="text-xl md:text-3xl opacity-30 font-mono">
            v1.0.0 | 2026
          </div>
        </div>

        {/* Konami code hint */}
        <div className="absolute bottom-4 text-xl md:text-3xl opacity-20 font-mono">
          ↑↑↓↓←→←→BA
        </div>
      </div>
    </SlideBase>
  );
}
