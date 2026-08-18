"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const HOLDINGS = 100;

/** How the pinned portfolio's holdings render while a step is active. */
type HoldingsVariant = "owned" | "zeroed" | "dragged" | "shorted";

interface RiskStep {
  id: string;
  kicker: string;
  title: string;
  body: ReactNode;
  /** Visual state of the pinned portfolio while this step is active. */
  holdingsVariant: HoldingsVariant;
  /** Caption shown under the pinned portfolio while this step is active. */
  portfolioCaption: string;
  /** Value label shown on the pinned portfolio while this step is active. */
  portfolioValue: string;
}

/**
 * Tracks which step element is crossing the vertical center of the viewport.
 * The Pudding's scrollytelling core, minus the library.
 */
function useActiveStep(stepCount: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.stepIndex));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of refs.current.slice(0, stepCount)) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [stepCount]);

  const setStepRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { active, setStepRef };
}

function holdingClass(variant: HoldingsVariant, holdingIndex: number) {
  switch (variant) {
    // A universal owner holds everything.
    case "owned":
      return "bg-foreground";
    // Nuclear apocalypse: every holding is worth the same amount — zero.
    case "zeroed":
      return "border border-foreground bg-transparent";
    // Preventable disease: a permanent drag on every holding.
    case "dragged":
      return "bg-foreground/40";
    // Misallocated trillions: shorting the future of a third of the book.
    case "shorted":
      return holdingIndex % 3 === 0
        ? "border border-foreground bg-transparent"
        : "bg-foreground/70";
  }
}

export function StickyRiskSteps({ steps }: { steps: RiskStep[] }) {
  const { active, setStepRef } = useActiveStep(steps.length);
  const current = steps[Math.min(active, steps.length - 1)]!;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 px-4 md:grid-cols-2">
      <div className="sticky top-0 z-10 self-start bg-background pb-4 pt-4 md:top-0 md:flex md:h-svh md:flex-col md:justify-center md:pb-0 md:pt-0">
        <div className="border-2 border-foreground p-4 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground sm:text-xs">
            A universal owner&apos;s portfolio
          </p>
          <div
            className="mt-3 grid grid-cols-10 gap-1"
            role="img"
            aria-label={`Portfolio visualization: ${current.portfolioCaption}, ${current.portfolioValue}`}
          >
            {Array.from({ length: HOLDINGS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "aspect-square w-full transition-all duration-500",
                  holdingClass(current.holdingsVariant, i),
                )}
              />
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-foreground pt-3">
            <p
              key={`caption-${active}`}
              className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
            >
              {current.portfolioCaption}
            </p>
            <p className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {current.portfolioValue}
            </p>
          </div>
        </div>
      </div>

      <div>
        {steps.map((step, i) => (
          <div
            key={step.id}
            ref={setStepRef(i)}
            data-step-index={i}
            className="flex min-h-[85svh] flex-col justify-center py-12"
          >
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
              {step.kicker}
            </p>
            <h3 className="mt-3 text-2xl font-black uppercase leading-none tracking-tight text-foreground sm:text-4xl">
              {step.title}
            </h3>
            <div className="mt-5 space-y-4 text-base font-bold leading-7 text-foreground sm:text-lg sm:leading-8">
              {step.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { RiskStep };
