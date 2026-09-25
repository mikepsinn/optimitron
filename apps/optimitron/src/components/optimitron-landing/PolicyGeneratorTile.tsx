"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { GradedPolicy } from "./landing-data";
import { Tile, accentTextClass, landingLinkClass } from "./LandingSection";
import { useLiveMotion } from "./use-live-motion";

const CYCLE_MS = 4600;

export function PolicyGeneratorTile({
  policies,
  total,
}: {
  policies: GradedPolicy[];
  total: number;
}) {
  const live = useLiveMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!live || policies.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % policies.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(timer);
  }, [live, policies.length]);

  const policy = policies[index];
  if (!policy) return null;

  return (
    <Tile note={`United States · ${total} policies graded`} title="Optimal Policy Generator">
      <div aria-live="polite" className="flex flex-1 flex-col" key={policy.name}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-bold leading-snug">{policy.name}</p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{policy.category}</p>
          </div>
          <p
            aria-label={`Evidence grade ${policy.grade}`}
            className={`flex h-12 w-12 shrink-0 items-center justify-center border-2 border-current font-mono text-2xl font-bold ${accentTextClass}`}
          >
            {policy.grade}
          </p>
        </div>
        <div aria-hidden="true" className="mt-4 h-1 bg-foreground/10">
          <div
            className={`h-full bg-brutal-cyan ${live ? "landing-policy-scan" : "w-full"}`}
            style={live ? { animationDuration: `${CYCLE_MS}ms` } : undefined}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <p className="grid grid-cols-[9rem_1fr] gap-4">
            <span className="text-muted-foreground">Causal confidence</span>
            <span className="font-mono font-bold">{policy.confidence.toFixed(2)}</span>
          </p>
          <p className="grid grid-cols-[9rem_1fr] gap-4">
            <span className="text-muted-foreground">Recommendation</span>
            <span className="font-bold capitalize">{policy.recommendation}</span>
          </p>
          <p className="grid grid-cols-[9rem_1fr] gap-4">
            <span className="text-muted-foreground">Today</span>
            <span>{policy.status}</span>
          </p>
        </div>
        <div className="mt-auto pt-5">
          <Link className={landingLinkClass} href={ROUTES.opg}>
            See every grade
          </Link>
        </div>
      </div>
      <style jsx>{`
        .landing-policy-scan {
          animation-name: landing-policy-scan;
          animation-timing-function: linear;
          animation-iteration-count: 1;
          animation-fill-mode: forwards;
        }
        @keyframes landing-policy-scan {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </Tile>
  );
}
