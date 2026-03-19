"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { prizeLink } from "@/lib/routes";
import { fmtParam } from "@/lib/format-parameter";
import {
  POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
} from "@/lib/parameters-calculations-citations";

const rows = [
  {
    metric: "Governance Cost",
    pathA: `${fmtParam({...POLITICAL_DYSFUNCTION_GLOBAL_OPPORTUNITY_COST_TOTAL, unit: "USD"})}/yr dysfunction`,
    pathB: "1% redirect saves trillions",
    aWeight: 90,
    bWeight: 30,
  },
  {
    metric: "Preventable Deaths",
    pathA: "10M/yr antibiotic resistance",
    pathB: "95% of conditions treated",
    aWeight: 80,
    bWeight: 85,
  },
  {
    metric: "Approval Queue",
    pathA: `${Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value)} years for all treatments`,
    pathB: `${Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value)} years via dFDA`,
    aWeight: 95,
    bWeight: 15,
  },
  {
    metric: "Income Impact",
    pathA: "Status quo decline",
    pathB: `${fmtParam({...TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})}–${fmtParam({...WISHONIA_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA, unit: "USD"})} gains`,
    aWeight: 40,
    bWeight: 90,
  },
  {
    metric: "Health ROI",
    pathA: "$0 return on dysfunction",
    pathB: "$2–$4 per $1 invested",
    aWeight: 10,
    bWeight: 75,
  },
];

export function TwoFuturesSection() {
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
          Two Futures. Same Species. Same Year.
        </h2>
      </motion.div>

      {/* Diverging bar chart */}
      <div ref={ref} className="max-w-5xl mx-auto mb-8">
        {/* Header labels */}
        <div className="flex items-center mb-4">
          <div className="w-1/2 pr-4 text-right">
            <span className="text-xs font-black uppercase text-brutal-red">
              Path A — Status Quo
            </span>
          </div>
          <div className="w-px h-4 bg-muted shrink-0" />
          <div className="w-1/2 pl-4 text-left">
            <span className="text-xs font-black uppercase text-brutal-cyan">
              Path B — 1% Treaty
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <motion.div
              key={row.metric}
              initial={reduced ? {} : { opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center"
            >
              {/* Left side (Path A) — bars grow right-to-left */}
              <div className="w-1/2 pr-2 sm:pr-4 flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground font-bold text-right hidden sm:block max-w-32 leading-tight">
                  {row.pathA}
                </span>
                <div className="w-32 sm:w-48 h-8 relative overflow-hidden">
                  <motion.div
                    initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2 + i * 0.1,
                      ease: [0.87, 0, 0.13, 1],
                    }}
                    style={{ originX: 1, width: `${row.aWeight}%` }}
                    className="absolute inset-y-0 right-0 bg-brutal-red/70 border-l-2 border-primary"
                  />
                </div>
              </div>

              {/* Center metric label */}
              <div className="shrink-0 w-px self-stretch bg-muted relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 py-0.5 border border-primary whitespace-nowrap z-10">
                  <span className="text-xs font-black text-foreground uppercase">
                    {row.metric}
                  </span>
                </div>
              </div>

              {/* Right side (Path B) — bars grow left-to-right */}
              <div className="w-1/2 pl-2 sm:pl-4 flex items-center gap-2">
                <div className="w-32 sm:w-48 h-8 relative overflow-hidden">
                  <motion.div
                    initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.3 + i * 0.1,
                      ease: [0.87, 0, 0.13, 1],
                    }}
                    style={{ originX: 0, width: `${row.bWeight}%` }}
                    className="absolute inset-y-0 left-0 bg-brutal-cyan/70 border-r-2 border-primary"
                  />
                </div>
                <span className="text-xs text-muted-foreground font-bold hidden sm:block max-w-32 leading-tight">
                  {row.pathB}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: show labels below for small screens */}
        <div className="sm:hidden mt-6 space-y-2">
          {rows.map((row) => (
            <div key={`mobile-${row.metric}`} className="flex items-start gap-2 text-xs">
              <span className="font-black text-foreground shrink-0">{row.metric}:</span>
              <span className="text-brutal-red">{row.pathA}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="text-brutal-cyan">{row.pathB}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={reduced ? {} : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <div className="p-6 border-4 border-primary bg-brutal-yellow shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-3xl mx-auto">
          <p className="text-xl font-black text-foreground mb-4">
            You are currently on Path A. You chose it by not choosing. Which
            is very on-brand for your species.
          </p>
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="px-8 py-3.5 bg-foreground text-background font-black uppercase text-lg border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Choose Path B
          </NavItemLink>
        </div>
      </motion.div>
    </section>
  );
}
