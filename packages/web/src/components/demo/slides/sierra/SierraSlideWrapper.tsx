"use client";

import { cn } from "@/lib/utils";

interface SierraSlideWrapperProps {
  children: React.ReactNode;
  className?: string;
  act?: 1 | 2 | 3 | "turn";
}

const bgClasses = {
  1: "bg-gradient-to-b from-zinc-900 via-zinc-950 to-black",
  turn: "bg-gradient-to-b from-indigo-950 via-purple-950 to-black",
  2: "bg-gradient-to-b from-slate-900 via-slate-950 to-black",
  3: "bg-gradient-to-b from-emerald-950 via-teal-950 to-black",
};

export function SierraSlideWrapper({ children, className, act = 1 }: SierraSlideWrapperProps) {
  return (
    <div
      data-testid="sierra-slide"
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center",
        "transition-colors duration-500",
        bgClasses[act] || bgClasses[1],
        className
      )}
    >
      {/* Pixel grid overlay for retro feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "4px 4px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 md:px-12 py-4 md:py-6">
        {children}
      </div>
    </div>
  );
}

export default SierraSlideWrapper;
