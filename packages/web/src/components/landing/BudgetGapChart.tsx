"use client";

import { useState, useRef } from "react";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { budgetLink } from "@/lib/routes";
import budgetRaw from "../../data/us-budget-analysis.json";

interface OutcomeMetric {
  name: string;
  value: number;
  trend: string;
}

interface Category {
  name: string;
  currentSpending: number;
  optimalSpending: number;
  gap: number;
  gapPercent: number;
  recommendation: string;
  evidenceGrade: string;
  investmentStatus: string;
  discretionary: boolean;
  outcomeMetrics: OutcomeMetric[];
}

const allCategories = (budgetRaw as { categories: Category[] }).categories;

// Top categories by absolute gap, discretionary only
const topCategories = allCategories
  .filter((c) => c.discretionary && c.gap !== 0)
  .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
  .slice(0, 8);

const maxSpending = Math.max(
  ...topCategories.flatMap((c) => [c.currentSpending, c.optimalSpending]),
);

function formatBillions(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  return `$${(n / 1e9).toFixed(0)}B`;
}

function trendIcon(trend: string): string {
  if (trend === "increasing") return "↑";
  if (trend === "decreasing") return "↓";
  return "→";
}

export function BudgetGapChart() {
  const [selected, setSelected] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section className="bg-brutal-yellow/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Where Your Money Should Be Going
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Outlined = what you spend. Filled = what the data says you should. Click any category to see what it&apos;s actually producing.
          </p>
        </motion.div>

        <div ref={ref} className="space-y-3 max-w-5xl mx-auto">
          {topCategories.map((cat, i) => {
            const isOpen = selected === i;
            const isOverInvested = cat.recommendation === "decrease";
            const currentPct = (cat.currentSpending / maxSpending) * 100;
            const optimalPct = (cat.optimalSpending / maxSpending) * 100;
            return (
              <div key={cat.name}>
                <motion.button
                  initial={reduced ? {} : { opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  onClick={() => setSelected(isOpen ? null : i)}
                  className="w-full text-left p-4 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-black">
                        {cat.name}
                      </span>
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 border border-black ${
                          isOverInvested
                            ? "bg-brutal-red/20 text-brutal-red"
                            : "bg-brutal-cyan/20 text-brutal-cyan"
                        }`}
                      >
                        {cat.investmentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-black/40">
                      <span>Grade: {cat.evidenceGrade}</span>
                      <span
                        className={`font-black text-sm ${isOverInvested ? "text-brutal-red" : "text-brutal-cyan"}`}
                      >
                        {cat.gapPercent > 0 ? "+" : ""}
                        {cat.gapPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="relative h-8 bg-black/5 border border-black/10">
                    {/* Current spending - outlined */}
                    <div
                      className="absolute inset-y-0 left-0 border-2 border-black/30 border-dashed"
                      style={{ width: `${currentPct}%` }}
                    />
                    {/* Optimal spending - filled */}
                    <motion.div
                      initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                      animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.2 + i * 0.06,
                        ease: [0.87, 0, 0.13, 1],
                      }}
                      style={{ originX: 0, width: `${optimalPct}%` }}
                      className={`absolute inset-y-0 left-0 ${isOverInvested ? "bg-brutal-red/40" : "bg-brutal-cyan/40"}`}
                    />
                    {/* Labels inside bar */}
                    <div className="absolute inset-0 flex items-center px-2 gap-4">
                      <span className="text-xs font-bold text-black/50">
                        Now: {formatBillions(cat.currentSpending)}
                      </span>
                      <span className={`text-xs font-black ${isOverInvested ? "text-brutal-red" : "text-brutal-cyan"}`}>
                        Optimal: {formatBillions(cat.optimalSpending)}
                      </span>
                    </div>
                  </div>

                  {/* Gap label */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-black/30">
                      Gap: {formatBillions(cat.gap)}
                    </span>
                    <span className="text-black/30 text-xs">
                      {isOpen ? "▲" : "▼"}
                    </span>
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
                      <div className="ml-4 sm:ml-8 border-l-4 border-black pl-4 py-4">
                        <p className="text-xs font-bold text-black/50 uppercase mb-3">
                          Current outcome metrics
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {cat.outcomeMetrics.map((m) => (
                            <div
                              key={m.name}
                              className="p-3 border-2 border-black/20 bg-white"
                            >
                              <div className="text-xs text-black/50 font-bold mb-1">
                                {m.name}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-black">
                                  {m.value.toLocaleString()}
                                </span>
                                <span
                                  className={`text-xs font-bold ${
                                    m.trend === "increasing"
                                      ? "text-brutal-cyan"
                                      : m.trend === "decreasing"
                                        ? "text-brutal-red"
                                        : "text-black/40"
                                  }`}
                                >
                                  {trendIcon(m.trend)} {m.trend}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs font-bold text-black/40">
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 border-2 border-black/30 border-dashed inline-block" />{" "}
            Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 bg-brutal-cyan/40 inline-block" />{" "}
            Optimal (increase)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 bg-brutal-red/40 inline-block" />{" "}
            Optimal (decrease)
          </span>
        </div>

        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center mt-8"
        >
          <NavItemLink
            item={budgetLink}
            variant="custom"
            className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-black uppercase transition-colors"
          >
            See full budget analysis &rarr;
          </NavItemLink>
        </motion.div>
      </div>
    </section>
  );
}
