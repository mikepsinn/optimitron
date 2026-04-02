"use client";

import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { opgLink } from "@/lib/routes";
import { naturalExperimentsData as experimentsRaw } from "@/data/natural-experiments";

interface Outcome {
  metric: string;
  unit: string;
  direction: string;
  preMean: number;
  postMean: number;
  percentChange: number;
  directionCorrect: boolean;
  bradfordHillAverage: number;
  pValue: number;
  interpretation: string;
}

interface Experiment {
  policy: string;
  jurisdiction: string;
  jurisdictionCode: string;
  interventionYear: number;
  description: string;
  outcomes: Outcome[];
}

const experiments = (experimentsRaw as { experiments: Experiment[] }).experiments;

function getPrimaryOutcome(exp: Experiment): Outcome {
  return exp.outcomes.find((o) => o.directionCorrect) ?? exp.outcomes[0]!;
}

const maxAbsChange = Math.max(
  ...experiments.map((e) => Math.abs(getPrimaryOutcome(e).percentChange)),
);

function formatP(p: number): string {
  if (p < 0.001) return "p<0.001";
  return `p=${p.toFixed(3)}`;
}

export function NaturalExperimentsChart() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
          Times a Country Actually Tried Something
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
          {experiments.length} natural experiments. Bars show what happened. Click any row for the full breakdown.
        </p>
      </motion.div>

      <div ref={ref} className="space-y-2">
        {experiments.map((exp, i) => {
          const primary = getPrimaryOutcome(exp);
          const isOpen = expanded === i;
          const barWidth = Math.min(
            (Math.abs(primary.percentChange) / maxAbsChange) * 100,
            100,
          );
          const good = primary.directionCorrect;

          return (
            <div key={`${exp.jurisdictionCode}-${exp.interventionYear}`}>
              <motion.button
                initial={reduced ? {} : { opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full p-4 border-4 border-primary bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left cursor-pointer"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black px-2 py-0.5 bg-foreground text-background">
                      {exp.interventionYear}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 border-4 border-primary">
                      {exp.jurisdiction}
                    </span>
                  </div>
                  <span className="font-black text-sm text-foreground flex-grow">
                    {exp.policy}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-black text-lg ${good ? "text-brutal-cyan" : "text-brutal-red"}`}
                    >
                      {primary.percentChange > 0 ? "+" : ""}
                      {primary.percentChange.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground font-bold w-28 sm:w-44 truncate">
                    {primary.metric}
                  </div>
                  <div className="flex-grow h-5 bg-muted border border-primary relative overflow-hidden">
                    <motion.div
                      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2 + i * 0.05,
                        ease: [0.87, 0, 0.13, 1],
                      }}
                      style={{ originX: 0, width: `${barWidth}%` }}
                      className={`absolute inset-y-0 left-0 ${good ? "bg-brutal-cyan" : "bg-brutal-red"}`}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground font-bold shrink-0 hidden sm:block w-36 text-right">
                    BH:{primary.bradfordHillAverage.toFixed(2)} · {formatP(primary.pValue)}
                  </div>
                </div>
              </motion.button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 sm:ml-8 border-l-4 border-primary pl-4 py-4 space-y-4">
                      <p className="text-sm text-muted-foreground font-bold">
                        {exp.description}
                      </p>
                      {exp.outcomes.map((o) => {
                        const oBarW = Math.min(
                          (Math.abs(o.percentChange) / maxAbsChange) * 100,
                          100,
                        );
                        return (
                          <div key={o.metric} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {o.metric}
                                <span className="text-muted-foreground ml-1">
                                  ({o.unit})
                                </span>
                              </span>
                              <span
                                className={`text-sm font-black shrink-0 ${o.directionCorrect ? "text-brutal-cyan" : "text-brutal-red"}`}
                              >
                                {o.percentChange > 0 ? "+" : ""}
                                {o.percentChange.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-grow h-3 bg-muted relative overflow-hidden">
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    ease: [0.87, 0, 0.13, 1],
                                  }}
                                  style={{ originX: 0, width: `${oBarW}%` }}
                                  className={`absolute inset-y-0 left-0 ${o.directionCorrect ? "bg-brutal-cyan" : "bg-brutal-red"}`}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-bold shrink-0">
                                {o.preMean.toFixed(1)} → {o.postMean.toFixed(1)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              BH: {o.bradfordHillAverage.toFixed(3)} ·{" "}
                              {formatP(o.pValue)}
                              {!o.directionCorrect && (
                                <span className="text-brutal-red ml-1">
                                  · unexpected direction
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <motion.div
        initial={reduced ? {} : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="text-center mt-8"
      >
        <NavItemLink
          item={opgLink}
          variant="custom"
          className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-foreground uppercase transition-colors"
        >
          View all policy analyses &rarr;
        </NavItemLink>
      </motion.div>
    </section>
  );
}
