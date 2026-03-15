"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { StepReveal } from "@/components/animations/StepReveal";

/**
 * Vertical flywheel visualization:
 * 1. Fund flow bar (10/10/80 split)
 * 2. Three stakeholder cards showing who gets what and why they lobby
 * 3. Convergence into GDP growth → Treaty expansion
 * 4. Loop-back indicator
 */

const stakeholders = [
  {
    name: "Bondholders",
    cut: "10%",
    label: "of treaty inflows",
    color: "bg-brutal-yellow",
    borderColor: "border-brutal-yellow",
    why: "Returns rise with each cycle. They buy more bonds.",
    action: "Buy more →",
  },
  {
    name: "Politicians",
    cut: "10%",
    label: "alignment rewards",
    color: "bg-brutal-pink",
    borderColor: "border-brutal-pink",
    textColor: "text-white",
    why: "Higher alignment scores = more campaign funding. They lobby for expansion.",
    action: "Lobby more →",
  },
  {
    name: "Citizens",
    cut: "80%",
    label: "to pragmatic trials",
    color: "bg-brutal-cyan",
    borderColor: "border-brutal-cyan",
    why: "Diseases cured. Income rises. They demand more treaty funding.",
    action: "Demand more →",
  },
];

const escalationYears = [
  {
    year: "Year 1",
    pct: "1%",
    amount: "$27B",
    detail: "$2.7B returns, $2.7B rewards, $21.6B trials",
  },
  {
    year: "Year 5",
    pct: "2%",
    amount: "$54B",
    detail: "Returns double. Politicians campaign for 3%.",
  },
  {
    year: "Year 10",
    pct: "5%",
    amount: "$136B",
    detail: "Cures flowing. GDP accelerating. Everyone demands more.",
  },
];

export function IncentiveFeedbackLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <div ref={ref}>
      {/* Fund flow split visualization */}
      <div className="mb-10">
        <p className="text-xs font-black uppercase text-black/50 text-center mb-3">
          Where Treaty Funding Goes
        </p>
        <div className="flex h-12 border-2 border-black overflow-hidden">
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[10%] bg-brutal-yellow border-r-2 border-black flex items-center justify-center"
          >
            <span className="text-[10px] sm:text-xs font-black text-black whitespace-nowrap">
              10% Bonds
            </span>
          </motion.div>
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[10%] bg-brutal-pink border-r-2 border-black flex items-center justify-center"
          >
            <span className="text-[10px] sm:text-xs font-black text-white whitespace-nowrap">
              10% Pols
            </span>
          </motion.div>
          <motion.div
            initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="w-[80%] bg-brutal-cyan flex items-center justify-center"
          >
            <span className="text-xs sm:text-sm font-black text-black">
              80% Pragmatic Trials
            </span>
          </motion.div>
        </div>
      </div>

      {/* Three stakeholder cards */}
      <StepReveal
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        staggerDelay={0.15}
      >
        {stakeholders.map((s) => (
          <div
            key={s.name}
            className={`p-4 border-4 border-black ${s.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div className="text-xs font-black uppercase tracking-wider text-black/50 mb-1">
              {s.cut} {s.label}
            </div>
            <h4 className={`text-lg font-black uppercase ${s.textColor ?? "text-black"} mb-2`}>
              {s.name}
            </h4>
            <p className={`text-sm font-medium ${s.textColor ? "text-white/80" : "text-black/60"} mb-3`}>
              {s.why}
            </p>
            <div className={`text-sm font-black ${s.textColor ?? "text-black"}`}>
              {s.action}
            </div>
          </div>
        ))}
      </StepReveal>

      {/* Convergence arrows */}
      <div className="flex justify-center mb-6">
        <div className="flex items-end gap-8 md:gap-16">
          {/* Left line */}
          <motion.div
            initial={reduced ? {} : { height: 0, opacity: 0 }}
            animate={isInView ? { height: 40, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="w-0.5 bg-black/30 hidden md:block"
          />
          {/* Center line (always visible) */}
          <motion.div
            initial={reduced ? {} : { height: 0, opacity: 0 }}
            animate={isInView ? { height: 40, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="flex flex-col items-center"
          >
            <div className="w-0.5 h-10 bg-black/40" />
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-black/40" />
          </motion.div>
          {/* Right line */}
          <motion.div
            initial={reduced ? {} : { height: 0, opacity: 0 }}
            animate={isInView ? { height: 40, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.0 }}
            className="w-0.5 bg-black/30 hidden md:block"
          />
        </div>
      </div>

      {/* GDP Increases card */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.1 }}
        className="p-5 border-4 border-black bg-emerald-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4"
      >
        <div className="flex items-baseline gap-3 flex-wrap">
          <h4 className="text-lg font-black uppercase text-black">
            GDP Increases
          </h4>
          <span className="text-sm font-bold text-black/50">
            Everyone gets richer.
          </span>
        </div>
        <p className="text-sm font-medium text-black/60 mt-1">
          $14.9M–$52.1M per-capita income gains across adopting jurisdictions.
          Bondholders&apos; assets appreciate. Politicians win elections. Citizens live longer.
        </p>
      </motion.div>

      {/* Arrow down */}
      <div className="flex justify-center mb-4">
        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.3 }}
          className="flex flex-col items-center"
        >
          <div className="w-0.5 h-6 bg-black/40" />
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-black/40" />
        </motion.div>
      </div>

      {/* Treaty Expands card */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.4 }}
        className="p-5 border-4 border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6"
      >
        <div className="flex items-baseline gap-3 flex-wrap">
          <h4 className="text-lg font-black uppercase text-black">
            Treaty Expands
          </h4>
          <span className="text-sm font-bold text-black/50">
            More funding. Bigger pool. Loop repeats at higher scale.
          </span>
        </div>
        <p className="text-2xl font-black text-black mt-2">
          1% → 2% → 5% → ...
        </p>
      </motion.div>

      {/* Loop-back indicator */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, scale: 0.9 }}
        animate={
          isInView
            ? { opacity: [0, 1, 1, 0.7, 1], scale: 1 }
            : {}
        }
        transition={{
          duration: 2,
          delay: 1.6,
          repeat: reduced ? 0 : Infinity,
          repeatDelay: 3,
        }}
        className="flex justify-center mb-8"
      >
        <div className="px-4 py-2 border-2 border-dashed border-black/30 bg-black/5 text-center">
          <span className="text-lg mr-2">&#8634;</span>
          <span className="text-sm font-black text-black/50 uppercase">
            Each cycle makes the next bigger
          </span>
        </div>
      </motion.div>

      {/* Year 1/5/10 escalation */}
      <StepReveal staggerDelay={0.15}>
        <div className="border-2 border-black bg-black/5 p-4">
          <p className="text-xs font-black uppercase text-black/40 mb-3">
            The Inevitable Escalation
          </p>
          <div className="space-y-3">
            {escalationYears.map((y) => (
              <div key={y.year} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-sm font-black text-black">{y.year}:</span>
                  <span className="text-sm font-bold text-black/60">{y.pct} = {y.amount}</span>
                </div>
                <span className="text-xs font-medium text-black/40">
                  → {y.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </StepReveal>
    </div>
  );
}
