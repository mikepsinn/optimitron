"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { US_GOV_WASTE_DRUG_WAR } from "@optimitron/data/parameters";
import { SectionHeader } from "@/components/ui/section-header";

const drugWarCostB = Math.round(US_GOV_WASTE_DRUG_WAR.value / 1e9);

/** Animated diverging arrow — spending goes up, outcome goes down */
function DivergingArrows({
  spendLabel,
  spendValue,
  outcomeLabel,
  outcomeValue,
  title,
  detail,
  delay,
}: {
  spendLabel: string;
  spendValue: string;
  outcomeLabel: string;
  outcomeValue: string;
  title: string;
  detail: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="border-4 border-primary bg-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="text-xs font-black px-2.5 py-1 bg-brutal-red text-brutal-red-foreground inline-block mb-4 uppercase">
        {title}
      </div>

      {/* SVG diverging arrows */}
      <div className="flex items-center justify-center mb-4">
        <svg viewBox="0 0 300 120" className="w-full max-w-xs" aria-hidden>
          {/* Spending arrow — goes UP */}
          <motion.line
            x1="70" y1="90" x2="70" y2="20"
            className="stroke-brutal-red" strokeWidth="6" strokeLinecap="round"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
          />
          <motion.polygon
            points="70,10 58,28 82,28"
            className="fill-brutal-red"
            initial={reduced ? {} : { opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.9 }}
          />

          {/* Outcome arrow — goes DOWN */}
          <motion.line
            x1="230" y1="20" x2="230" y2="90"
            className="stroke-brutal-cyan" strokeWidth="6" strokeLinecap="round"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.8, delay: delay + 0.4 }}
          />
          <motion.polygon
            points="230,100 218,82 242,82"
            className="fill-brutal-cyan"
            initial={reduced ? {} : { opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 1.1 }}
          />

          {/* Labels */}
          <text x="70" y="110" textAnchor="middle" className="fill-background text-[11px] font-black uppercase">{spendLabel}</text>
          <text x="230" y="110" textAnchor="middle" className="fill-background text-[11px] font-black uppercase">{outcomeLabel}</text>
        </svg>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <motion.p
            className="text-3xl font-black text-brutal-red"
            initial={reduced ? {} : { opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: delay + 0.6 }}
          >
            {spendValue}
          </motion.p>
          <p className="text-xs font-black uppercase text-background">Spent</p>
        </div>
        <div className="text-center">
          <motion.p
            className="text-3xl font-black text-brutal-cyan"
            initial={reduced ? {} : { opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: delay + 0.8 }}
          >
            {outcomeValue}
          </motion.p>
          <p className="text-xs font-black uppercase text-background">Outcome</p>
        </div>
      </div>

      <p className="text-sm font-bold text-muted text-center">{detail}</p>
    </div>
  );
}

export function HistoricalWasteComparison() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-8">
      <SectionHeader
        title="Spend More. Get Worse."
        subtitle="Your species has a pattern: increase the budget, worsen the outcome, declare victory, repeat."
        size="lg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
        <DivergingArrows
          title="War on Terror"
          spendLabel="Spending"
          spendValue="$8T"
          outcomeLabel="Attacks"
          outcomeValue="17×"
          detail="Attacks: ~1,000/yr → ~17,000/yr"
          delay={0}
        />
        <DivergingArrows
          title="War on Drugs"
          spendLabel="Spending"
          spendValue={`$${drugWarCostB}B/yr`}
          outcomeLabel="OD Deaths"
          outcomeValue="20×"
          detail="Overdoses: 6,000 → 108,000/yr"
          delay={0.3}
        />
      </div>

      <p className="text-sm font-bold text-muted-foreground max-w-xl">
        On my planet, when you spend more money and things get worse, you stop spending.
        Your species does not do this.
      </p>
    </div>
  );
}
