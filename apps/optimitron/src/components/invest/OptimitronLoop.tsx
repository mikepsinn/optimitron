"use client";

import { StepReveal } from "@/components/animations/StepReveal";

const LOOP_STEPS = [
  {
    id: "measure",
    title: "Measure",
    detail: "Real outcomes from a century of policy and budget experiments across hundreds of jurisdictions.",
  },
  {
    id: "learn",
    title: "Learn",
    detail: "Which combinations of laws and spending moved median healthy lifespan and median income — for the least money.",
  },
  {
    id: "implement",
    title: "Implement",
    detail: "Shareholder power pushes governments and boards toward the configurations that actually worked.",
  },
  {
    id: "remeasure",
    title: "Re-measure",
    detail: "Outcomes feed back in. The optimal policy and budget set gets sharper every cycle.",
  },
] as const;

export function OptimitronLoop() {
  return (
    <StepReveal
      className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4"
      staggerDelay={0.2}
    >
      {LOOP_STEPS.map((step, i) => (
        <div
          key={step.id}
          className="relative border-2 border-foreground p-5 sm:-ml-0.5 sm:first:ml-0"
        >
          <p className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xl font-black uppercase leading-none tracking-tight text-foreground sm:text-2xl">
            {step.title}
            <span aria-hidden="true" className="ml-2">
              {i === LOOP_STEPS.length - 1 ? "↺" : "→"}
            </span>
          </p>
          <p className="mt-3 text-sm font-bold leading-6 text-foreground">
            {step.detail}
          </p>
        </div>
      ))}
    </StepReveal>
  );
}
