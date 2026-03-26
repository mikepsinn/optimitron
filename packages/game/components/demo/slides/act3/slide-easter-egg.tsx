"use client";

import { useEffect, useState } from "react";
import { SlideBase } from "../slide-base";
import { useDemoStore } from "@/lib/demo/store";

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
            text-center font-terminal text-lg md:text-xl max-w-7xl px-8
            transition-opacity duration-2000
            ${showText ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ color: palette.text }}
        >
          <p className="mb-8 leading-relaxed">
            &quot;The best time to plant a tree was twenty years ago.
            <br />
            The second best time is now.&quot;
          </p>
          
          <p className="text-sm opacity-50 mb-12">
            — Chinese Proverb
          </p>

          <div className="border-t border-current opacity-20 mb-8" />

          <p className="text-sm opacity-70 mb-4">
            The Earth Optimization Game
          </p>
          
          <p className="text-xs opacity-50 mb-2">
            A project for the Protocol Labs Genesis Hackathon
          </p>
          
          <p className="text-xs opacity-50 mb-8">
            Built with hope for a better future.
          </p>

          <div className="text-xs opacity-30 font-mono">
            v1.0.0 | 2026
          </div>
        </div>

        {/* Konami code hint */}
        <div className="absolute bottom-4 text-xs opacity-20 font-mono">
          ↑↑↓↓←→←→BA
        </div>
      </div>
    </SlideBase>
  );
}
