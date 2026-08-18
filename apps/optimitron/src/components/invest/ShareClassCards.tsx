"use client";

import { StepReveal } from "@/components/animations/StepReveal";

const SHARE_CLASSES = [
  {
    id: "class-a",
    name: "Class A",
    kind: "Voting shares",
    points: [
      "Signing up earns you a free gift of one Class A voting share.",
      "One person, one vote in policy and strategy decisions, through secure digital governance.",
      "Activated by your first wish-o-cratic allocation — an act of governance, not a click.",
    ],
  },
  {
    id: "class-b",
    name: "Class B",
    kind: "Economic shares",
    points: [
      "No governance power. Class B exists to capture economic returns.",
      "Works like a fund holding diversified positions in the companies that currently control your government.",
      "The corporations whose lobbying, campaign finance, and regulatory capture shape public policy.",
    ],
  },
] as const;

export function ShareClassCards() {
  return (
    <StepReveal
      className="grid grid-cols-1 gap-6 sm:grid-cols-2"
      staggerDelay={0.25}
    >
      {SHARE_CLASSES.map((shareClass) => (
        <div
          key={shareClass.id}
          className="flex flex-col border-2 border-foreground"
        >
          <div className="border-b-2 border-foreground bg-foreground px-4 py-3 text-background">
            <p className="text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
              {shareClass.name}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.25em]">
              {shareClass.kind}
            </p>
          </div>
          <ul className="flex flex-1 flex-col divide-y divide-foreground/20">
            {shareClass.points.map((point) => (
              <li
                key={point}
                className="px-4 py-4 text-sm font-bold leading-6 text-foreground sm:text-base sm:leading-7"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </StepReveal>
  );
}
