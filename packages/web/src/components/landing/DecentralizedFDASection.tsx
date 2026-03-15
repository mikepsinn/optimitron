"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { dfdaSpecPaperLink } from "@/lib/routes";

const comparisons = [
  {
    label: "Cost per Patient",
    current: { value: 41000, display: "$41,000", color: "bg-brutal-red" },
    optimized: { value: 929, display: "$929", color: "bg-brutal-cyan" },
    ratio: "44x cheaper",
    ratioColor: "text-brutal-cyan",
  },
  {
    label: "Annual Capacity",
    current: { value: 1.9, display: "1.9M/yr", color: "bg-brutal-red/60" },
    optimized: { value: 23.4, display: "23.4M/yr", color: "bg-brutal-cyan" },
    ratio: "12x more",
    ratioColor: "text-brutal-cyan",
  },
  {
    label: "Queue to Test All Treatments",
    current: { value: 443, display: "443 years", color: "bg-brutal-red" },
    optimized: { value: 36, display: "36 years", color: "bg-brutal-cyan" },
    ratio: "12x faster",
    ratioColor: "text-brutal-cyan",
  },
];

export function DecentralizedFDASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <section className="bg-brutal-cyan/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Your Decentralized FDA
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Your FDA makes treatments wait 8.2 years AFTER they&apos;ve been proven safe. This replaces the theatre with infrastructure.
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
                  <span className="text-sm font-black uppercase text-black/60">
                    {comp.label}
                  </span>
                  <span className={`text-lg sm:text-xl font-black ${comp.ratioColor}`}>
                    {comp.ratio}
                  </span>
                </motion.div>

                {/* Current (status quo) bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-black/40 w-16 shrink-0">
                      Current
                    </span>
                    <div className="flex-grow relative h-10 bg-black/5 border border-black/10">
                      <motion.div
                        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.1 + i * 0.15,
                          ease: [0.87, 0, 0.13, 1],
                        }}
                        style={{ originX: 0, width: `${currentPct}%` }}
                        className={`absolute inset-y-0 left-0 ${comp.current.color} border-r-2 border-black/20`}
                      />
                      <div className="absolute inset-0 flex items-center pl-3">
                        <span className="text-sm font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                          {comp.current.display}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optimized (dFDA) bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-black/40 w-16 shrink-0">
                      dFDA
                    </span>
                    <div className="flex-grow relative h-10 bg-black/5 border border-black/10">
                      <motion.div
                        initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2 + i * 0.15,
                          ease: [0.87, 0, 0.13, 1],
                        }}
                        style={{ originX: 0, width: `${optPct}%` }}
                        className={`absolute inset-y-0 left-0 ${comp.optimized.color} border-r-2 border-black/20`}
                      />
                      <div className="absolute inset-0 flex items-center pl-3">
                        <span className="text-sm font-black text-black">
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
            className="p-4 border-2 border-black bg-brutal-cyan/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 bg-black text-white">
                Stage 1
              </span>
              <span className="text-xs font-black">~$1/patient</span>
            </div>
            <p className="text-sm text-black/70 font-medium">
              Real-world evidence from existing data — prescriptions, wearables, lab results. Pattern recognition, not recruitment.
            </p>
          </motion.div>
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="p-4 border-2 border-black bg-brutal-pink/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 bg-black text-white">
                Stage 2
              </span>
              <span className="text-xs font-black">~$929/patient</span>
            </div>
            <p className="text-sm text-black/70 font-medium">
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
          <p className="text-sm text-black/50 font-bold mb-3">
            Every treatment gets an Outcome Label — effectiveness, side effects, optimal dosage — from millions of real patients.
          </p>
          <NavItemLink
            item={dfdaSpecPaperLink}
            variant="custom"
            external
            className="inline-flex items-center text-sm font-black text-brutal-cyan uppercase hover:text-black transition-colors"
          >
            Read the dFDA spec &rarr;
          </NavItemLink>
        </motion.div>
      </div>
    </section>
  );
}
