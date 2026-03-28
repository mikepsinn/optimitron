"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { dfdaSpecPaperLink } from "@/lib/routes";
import {
  fmtParam,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  EFFICACY_LAG_YEARS,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
const comparisons = [
  {
    label: "Cost per Patient",
    current: { value: TRADITIONAL_PHASE3_COST_PER_PATIENT.value, display: fmtParam(TRADITIONAL_PHASE3_COST_PER_PATIENT), color: "bg-brutal-red" },
    optimized: { value: DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT.value, display: fmtParam(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT), color: "bg-brutal-cyan" },
    ratio: "44x cheaper",
    ratioColor: "text-brutal-cyan",
  },
  {
    label: "Annual Capacity",
    current: { value: CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6, display: `${(CURRENT_TRIAL_SLOTS_AVAILABLE.value / 1e6).toFixed(1)}M/yr`, color: "bg-brutal-red" },
    optimized: { value: DFDA_PATIENTS_FUNDABLE_ANNUALLY.value / 1e6, display: `${(DFDA_PATIENTS_FUNDABLE_ANNUALLY.value / 1e6).toFixed(1)}M/yr`, color: "bg-brutal-cyan" },
    ratio: "12x more",
    ratioColor: "text-brutal-cyan",
  },
  {
    label: "Queue to Test All Treatments",
    current: { value: Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value), display: `${Math.round(DISEASES_WITHOUT_EFFECTIVE_TREATMENT.value / NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR.value)} years`, color: "bg-brutal-red" },
    optimized: { value: Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value), display: `${Math.round(DFDA_QUEUE_CLEARANCE_YEARS.value)} years`, color: "bg-brutal-cyan" },
    ratio: "12x faster",
    ratioColor: "text-brutal-cyan",
  },
];

export function DecentralizedFDASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section className="bg-brutal-cyan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
            Your Decentralized FDA
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-bold">
            Your FDA makes treatments wait <ParameterValue param={EFFICACY_LAG_YEARS} /> AFTER they&apos;ve been proven safe. Just sitting there. Being safe. While people die. This replaces the queue with maths.
          </p>
        </motion.div>

        {/* Comparison bars */}
        <div ref={ref} className="max-w-4xl mx-auto space-y-10 mb-12">
          {comparisons.map((comp, i) => {
            const max = Math.max(comp.current.value, comp.optimized.value);
            const currentPct = (comp.current.value / max) * 100;
            const optPct = (comp.optimized.value / max) * 100;

            return (
              <div key={comp.label}>
                <motion.div
                  initial={reduced ? {} : { opacity: 0, x: -40 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  className="flex items-center justify-between mb-2"
                >
                  <span className="text-sm font-black uppercase text-muted-foreground">
                    {comp.label}
                  </span>
                  <span className={`text-lg sm:text-xl font-black ${comp.ratioColor}`}>
                    {comp.ratio}
                  </span>
                </motion.div>

                {/* Current (status quo) bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                      Current
                    </span>
                    <div className="flex-grow relative h-10 bg-muted border border-primary">
                      <motion.div
                        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.1 + i * 0.15,
                          ease: [0.87, 0, 0.13, 1],
                        }}
                        style={{ originX: 0, width: `${currentPct}%` }}
                        className={`absolute inset-y-0 left-0 ${comp.current.color} border-r-2 border-primary`}
                      />
                      <div className="absolute inset-0 flex items-center pl-3">
                        <span className="text-sm font-black text-brutal-red-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                          {comp.current.display}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optimized (dFDA) bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-16 shrink-0">
                      dFDA
                    </span>
                    <div className="flex-grow relative h-10 bg-muted border border-primary">
                      <motion.div
                        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2 + i * 0.15,
                          ease: [0.87, 0, 0.13, 1],
                        }}
                        style={{ originX: 0, width: `${optPct}%` }}
                        className={`absolute inset-y-0 left-0 ${comp.optimized.color} border-r-2 border-primary`}
                      />
                      <div className="absolute inset-0 flex items-center pl-3">
                        <span className="text-sm font-black text-foreground">
                          {comp.optimized.display}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact stage descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="p-4 border-4 border-primary bg-brutal-cyan"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 bg-foreground text-background">
                Stage 1
              </span>
              <span className="text-xs font-black">~$1/patient</span>
            </div>
            <p className="text-sm text-foreground font-bold">
              Real-world evidence from existing data — prescriptions, wearables, lab results. Pattern recognition, not recruitment.
            </p>
          </motion.div>
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="p-4 border-4 border-primary bg-brutal-pink"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 bg-foreground text-background">
                Stage 2
              </span>
              <span className="text-xs font-black">~<ParameterValue param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT} /></span>
            </div>
            <p className="text-sm text-foreground font-bold">
              Pragmatic trials in routine care. Same doctors, same clinics, real patients. Rigorous evidence at human scale.
            </p>
          </motion.div>
        </div>

        {/* Consumer Reports line + link */}
        <motion.div
          initial={reduced ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground font-bold mb-3">
            Every treatment gets an Outcome Label — effectiveness, side effects, optimal dosage — from millions of real patients.
          </p>
          <NavItemLink
            item={dfdaSpecPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black text-brutal-cyan uppercase hover:text-foreground transition-colors"
          >
            Read the dFDA spec &rarr;
          </NavItemLink>
        </motion.div>
      </div>
    </section>
  );
}
