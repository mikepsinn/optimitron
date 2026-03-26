"use client";

import { useDemoStore } from "@/lib/demo/store";
import { SLIDES } from "@/lib/demo/demo-config";
import { cn } from "@/lib/utils";

const CTA_BASE_URL =
  process.env.NEXT_PUBLIC_CTA_BASE_URL || "https://optimitron.com";

/**
 * Renders a CTA button for slides that have ctaUrl/ctaLabel in their config.
 * Fades in after the typewriter finishes. In recording mode, clicks are suppressed.
 */
export function SlideCTA() {
  const currentSlide = useDemoStore((s) => s.currentSlide);
  const typewriterComplete = useDemoStore((s) => s.typewriterComplete);
  const isRecordingMode = useDemoStore((s) => s.isRecordingMode);
  const palette = useDemoStore((s) => s.palette);

  const slideConfig = SLIDES[currentSlide];
  if (!slideConfig?.ctaUrl) return null;

  const label = slideConfig.ctaLabel || "TRY IT →";
  const fullUrl = `${CTA_BASE_URL}${slideConfig.ctaUrl}`;

  const isVga = palette === "vga";

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        typewriterComplete
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (isRecordingMode) e.preventDefault();
        }}
        className={cn(
          "inline-flex items-center gap-2",
          "px-5 py-2.5",
          "font-pixel text-sm sm:text-base",
          "border-2 rounded-sm",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "hover:translate-x-[-1px] hover:translate-y-[-1px]",
          isVga
            ? "border-[#ffd54f] text-[#ffd54f] bg-[#ffd54f]/10 hover:bg-[#ffd54f]/20"
            : "border-[#ffff55] text-[#ffff55] bg-[#ffff55]/10 hover:bg-[#ffff55]/20"
        )}
      >
        <span className="animate-pulse">▶</span>
        <span>{label}</span>
      </a>
    </div>
  );
}
