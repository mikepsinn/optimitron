"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  TREATY_VS_BED_NETS_MULTIPLIER,
  TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER,
  BED_NETS_COST_PER_DALY,
  TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG,
} from "@/lib/parameters-calculations-citations";
import { SectionHeader } from "@/components/ui/section-header";
import { CountUp } from "@/components/animations/CountUp";
import { BrutalCard } from "@/components/ui/brutal-card";

const multiplier = Math.round(TREATY_VS_BED_NETS_MULTIPLIER.value);
const riskAdjusted = Math.round(TREATY_EXPECTED_VS_BED_NETS_MULTIPLIER.value).toLocaleString();
const bedNetCost = `$${BED_NETS_COST_PER_DALY.value.toFixed(0)}`;
const treatyCost = `$${TREATY_COST_PER_DALY_TRIAL_CAPACITY_PLUS_EFFICACY_LAG.value.toFixed(5)}`;

export function CostEffectivenessComparison() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-8">
      <p className="text-sm font-black text-foreground uppercase tracking-[0.3em] mb-4">
        vs. Bed Nets
      </p>

      {/* Giant animated multiplier */}
      <div className="text-7xl sm:text-8xl md:text-9xl font-black text-brutal-pink mb-4">
        <CountUp value={multiplier} duration={2} suffix="×" />
      </div>
      <p className="text-xl sm:text-2xl font-black text-foreground uppercase mb-8">
        More cost-effective than bed nets
      </p>

      {/* Animated comparison bars */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-right w-32 text-sm font-black text-foreground uppercase">Bed nets</div>
          <motion.div
            className="h-10 bg-brutal-yellow border-4 border-primary flex items-center px-3"
            initial={reduced ? { width: "100%" } : { width: 0 }}
            animate={isInView ? { width: "100%" } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <span className="text-sm font-black text-foreground whitespace-nowrap">{bedNetCost}/DALY</span>
          </motion.div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right w-32 text-sm font-black text-foreground uppercase">1% Treaty</div>
          <motion.div
            className="h-10 bg-brutal-cyan border-4 border-primary flex items-center px-3"
            initial={reduced ? { width: "2%" } : { width: 0 }}
            animate={isInView ? { width: "2%" } : {}}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "visible", minWidth: 0 }}
          >
            <span className="text-sm font-black text-foreground whitespace-nowrap">{treatyCost}</span>
          </motion.div>
        </div>
      </div>

      {/* Risk-adjusted callout */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        <BrutalCard shadowSize={4} className="max-w-lg">
          <p className="text-sm font-bold text-foreground">
            Even adjusted for political risk at 1% success probability:{" "}
            <span className="font-black text-brutal-pink">{riskAdjusted}&times;</span>{" "}
            more cost-effective than bed nets.
          </p>
        </BrutalCard>
      </motion.div>
    </div>
  );
}
