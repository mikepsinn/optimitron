"use client";

import type { ReactNode } from "react";
import type { Parameter } from "@optimitron/data/parameters";
import { CountUp } from "@/components/animations/CountUp";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { cn } from "@/lib/utils";

/**
 * One fact per viewport: an eyebrow, a number big enough to read from orbit,
 * a caption, and a tappable citation chip. The type scale is the visual.
 */
export function GiantNumber({
  eyebrow,
  value,
  format,
  prefix = "",
  suffix = "",
  caption,
  source,
  sourceLabel = "Tap for source and math",
  className,
}: {
  eyebrow?: string;
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  caption: ReactNode;
  source?: Parameter;
  sourceLabel?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[90svh] flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:gap-8",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
          {eyebrow}
        </p>
      ) : null}
      <div className="text-[clamp(4rem,18vw,13rem)] font-black leading-none tracking-tighter text-foreground">
        <CountUp
          value={value}
          prefix={prefix}
          suffix={suffix}
          format={format}
          duration={1.8}
        />
      </div>
      <ScrollReveal delay={0.15}>
        <div className="mx-auto max-w-2xl text-lg font-bold leading-8 text-foreground sm:text-2xl sm:leading-10">
          {caption}
        </div>
      </ScrollReveal>
      {source ? (
        <ParameterValue
          param={source}
          className="border border-foreground px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground !no-underline hover:bg-foreground hover:text-background sm:text-xs"
          valueOverride={sourceLabel}
        />
      ) : null}
    </section>
  );
}
