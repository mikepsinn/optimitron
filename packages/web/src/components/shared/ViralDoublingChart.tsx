"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
} from "@optimitron/data/parameters";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";

const TARGET = TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value;
const TARGET_M = Math.round(TARGET / 1e6);

const ROUNDS = [
  { round: 1, people: 2 },
  { round: 5, people: 32 },
  { round: 10, people: 1_024 },
  { round: 15, people: 32_768 },
  { round: 20, people: 1_048_576 },
  { round: 25, people: 33_554_432 },
  { round: 28, people: 268_435_456 },
];

function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

export function ViralDoublingChart() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4 sm:px-8">
      <SectionHeader
        title="28 Rounds of Doubling"
        subtitle="Tell two people. They each tell two. ~8 months at one round per week."
        size="lg"
      />

      {/* Animated bar chart — bars grow sequentially */}
      <div ref={ref} className="w-full max-w-3xl mb-8">
        <div className="grid grid-cols-7 gap-2">
          {ROUNDS.map(({ round, people }, i) => {
            const pct = Math.min((people / TARGET) * 100, 100);
            return (
              <div key={round} className="flex flex-col items-center">
                <motion.div
                  initial={reduced ? {} : { opacity: 0, y: -10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="text-xs font-black text-muted-foreground uppercase mb-1"
                >
                  R{round}
                </motion.div>
                <div className="w-full bg-muted border-2 border-primary h-28 flex flex-col justify-end relative overflow-hidden">
                  <motion.div
                    initial={reduced ? { height: `${Math.max(pct, 3)}%` } : { height: 0 }}
                    animate={isInView ? { height: `${Math.max(pct, 3)}%` } : {}}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.15,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="bg-brutal-cyan border-t-2 border-primary"
                  />
                </div>
                <motion.div
                  initial={reduced ? {} : { opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: i * 0.15 + 0.4 }}
                  className="text-xs font-black text-foreground mt-1"
                >
                  {fmt(people)}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target callout */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <BrutalCard bgColor="yellow" shadowSize={8} className="max-w-xl text-center">
          <p className="text-2xl sm:text-3xl font-black text-brutal-yellow-foreground">
            {TARGET_M}M = 3.5% Tipping Point
          </p>
          <p className="text-sm font-bold text-brutal-yellow-foreground mt-1">
            No campaign that reached this threshold has ever failed.
          </p>
        </BrutalCard>
      </motion.div>
    </div>
  );
}
