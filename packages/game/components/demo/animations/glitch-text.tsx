"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
  active?: boolean;
  color?: string;
}

export function GlitchText({
  text,
  className,
  intensity = "medium",
  active = true,
  color,
}: GlitchTextProps) {
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [clipPath, setClipPath] = useState("inset(0 0 0 0)");

  const intensityConfig = {
    low: { interval: 200, maxOffset: 2, glitchChance: 0.1 },
    medium: { interval: 100, maxOffset: 4, glitchChance: 0.3 },
    high: { interval: 50, maxOffset: 8, glitchChance: 0.5 },
  };

  const config = intensityConfig[intensity];

  useEffect(() => {
    if (!active) {
      setGlitchOffset({ x: 0, y: 0 });
      setClipPath("inset(0 0 0 0)");
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < config.glitchChance) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * config.maxOffset * 2,
          y: (Math.random() - 0.5) * config.maxOffset,
        });

        const top = Math.random() * 100;
        const height = Math.random() * 20 + 5;
        setClipPath(`inset(${top}% 0 ${100 - top - height}% 0)`);

        setTimeout(() => {
          setGlitchOffset({ x: 0, y: 0 });
          setClipPath("inset(0 0 0 0)");
        }, 50 + Math.random() * 100);
      }
    }, config.interval);

    return () => clearInterval(interval);
  }, [active, config]);

  return (
    <span className={cn("relative inline-block", className)} style={{ color }}>
      {/* Base text */}
      <span className="relative z-10">{text}</span>
      
      {/* Red offset layer */}
      <span
        className="absolute inset-0 text-red-500 opacity-70 z-0"
        style={{
          transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)`,
          clipPath,
        }}
        aria-hidden
      >
        {text}
      </span>
      
      {/* Cyan offset layer */}
      <span
        className="absolute inset-0 text-cyan-500 opacity-70 z-0"
        style={{
          transform: `translate(${-glitchOffset.x}px, ${-glitchOffset.y}px)`,
          clipPath,
        }}
        aria-hidden
      >
        {text}
      </span>
    </span>
  );
}
