"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SierraSlideWrapper } from "./SierraSlideWrapper";
import { PALETTE_SEMANTIC } from "@/lib/demo/palette";

const SPONSORS = [
  { name: "Protocol Labs", logo: "/images/logos/protocol-labs.svg", size: 80 },
  { name: "Funding the Commons", logo: "/images/logos/funding-the-commons.svg", size: 120 },
];

const BUILT_WITH = [
  { name: "Storacha", logo: "/images/logos/storacha.svg" },
  { name: "Hypercerts", logo: "/images/logos/hypercerts.svg" },
];

export function SlidePostCreditsAliens() {
  const [showText, setShowText] = useState(false);
  const palette = "vga";

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SierraSlideWrapper className="relative">
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
          <p className="text-4xl md:text-6xl opacity-70 mb-8">
            The Earth Optimization Game
          </p>

          <div className="border-t border-current opacity-20 mb-8" />

          <p className="text-2xl md:text-4xl opacity-70 mb-4">
            Made possible by
          </p>

          <div className="flex items-center justify-center gap-12 mb-10">
            {SPONSORS.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-3">
                <Image
                  src={s.logo}
                  alt={s.name}
                  width={s.size}
                  height={s.size}
                  className="opacity-90"
                />
                <span className="text-2xl md:text-4xl opacity-90">{s.name}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-current opacity-20 mb-8" />

          <p className="text-2xl md:text-3xl opacity-50 mb-5">
            Built with
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 mb-10">
            {BUILT_WITH.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-2">
                <Image
                  src={t.logo}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="opacity-80"
                />
                <span className="text-xl md:text-2xl opacity-60">{t.name}</span>
              </div>
            ))}
          </div>

          <div className="text-2xl md:text-4xl font-mono text-white/60">
            v1.0.0 | 2026
          </div>
        </div>

        {/* Konami code hint */}
        <div className="absolute bottom-4 text-xl md:text-3xl font-mono text-white/50">
          ↑↑↓↓←→←→BA
        </div>
      </div>
    </SierraSlideWrapper>
  );
}
export default SlidePostCreditsAliens;
