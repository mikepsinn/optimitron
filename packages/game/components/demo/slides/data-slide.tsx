"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SlideBase } from "./slide-base";
import { GlitchText } from "../animations/glitch-text";
import type { OnScreenElement, SlideConfig } from "@/lib/demo/demo-config";

interface DataSlideProps {
  config: SlideConfig;
}

/** Size classes for OnScreenElement.size */
const sizeClasses: Record<string, string> = {
  giant: "font-pixel text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
  large: "font-pixel text-2xl sm:text-3xl md:text-4xl",
  medium: "font-terminal text-xl sm:text-2xl md:text-3xl",
  small: "font-terminal text-base sm:text-lg md:text-xl",
  label: "font-terminal text-sm sm:text-base uppercase tracking-widest opacity-80",
};

/** Map color names to CSS classes */
function colorStyle(color?: string): string {
  if (!color) return "text-[var(--sierra-fg)]";
  switch (color) {
    case "red":
      return "text-red-500";
    case "green":
      return "text-emerald-400";
    case "gold":
      return "text-yellow-400";
    case "cyan":
      return "text-cyan-400";
    case "blue":
      return "text-blue-400";
    case "white":
      return "text-white";
    default:
      return "text-[var(--sierra-fg)]";
  }
}

/** Animated element wrapper — handles fadeIn, pulse, stagger delays */
function AnimatedElement({
  element,
  index,
}: {
  element: OnScreenElement;
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  const delay = element.animation === "stagger" ? index * 300 : index * 150;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const baseClasses = cn(
    sizeClasses[element.size] || sizeClasses.medium,
    colorStyle(element.color),
    "transition-all duration-700",
    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  );

  if (element.animation === "glitch") {
    return (
      <div className={cn(baseClasses, visible && "opacity-100")}>
        <GlitchText text={element.text} intensity="low" />
      </div>
    );
  }

  if (element.animation === "pulse") {
    return (
      <div className={cn(baseClasses, visible && "animate-pulse")}>
        {element.emoji && <span className="mr-2">{element.emoji}</span>}
        {element.text}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {element.emoji && <span className="mr-2">{element.emoji}</span>}
      {element.text}
    </div>
  );
}

/**
 * Generic data-driven slide that renders any SlideConfig's
 * onScreen elements and asciiArt. Used as fallback for slides
 * without a dedicated component.
 */
export function DataSlide({ config }: DataSlideProps) {
  const hasOnScreen = config.onScreen && config.onScreen.length > 0;
  const hasAscii = !!config.asciiArt;

  return (
    <SlideBase>
      <div className="flex flex-col items-center justify-center gap-6 max-w-[1700px] w-full px-4">
        {/* Chapter heading if present */}
        {config.chapter && (
          <div className="font-pixel text-xs sm:text-sm uppercase tracking-[0.3em] text-[var(--sierra-accent)] opacity-70">
            {config.chapter}
          </div>
        )}

        {/* On-screen elements */}
        {hasOnScreen && (
          <div className="flex flex-col items-center gap-4 text-center">
            {config.onScreen!.map((el, i) => (
              <AnimatedElement key={`${config.id}-${i}`} element={el} index={i} />
            ))}
          </div>
        )}

        {/* ASCII art */}
        {hasAscii && (
          <pre
            className={cn(
              "font-terminal text-xs sm:text-sm md:text-base",
              "text-[var(--sierra-fg)] opacity-90",
              "whitespace-pre overflow-x-auto max-w-full",
              "leading-relaxed",
              !hasOnScreen && "text-sm sm:text-base md:text-lg"
            )}
          >
            {config.asciiArt}
          </pre>
        )}

        {/* Fallback: show narration excerpt if nothing else to display */}
        {!hasOnScreen && !hasAscii && (
          <div className="font-terminal text-lg sm:text-xl text-[var(--sierra-fg)] text-center max-w-2xl leading-relaxed opacity-80">
            {config.narration.slice(0, 200)}
            {config.narration.length > 200 ? "..." : ""}
          </div>
        )}
      </div>
    </SlideBase>
  );
}
