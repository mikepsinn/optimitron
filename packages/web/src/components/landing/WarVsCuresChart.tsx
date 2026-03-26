"use client";

import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/section-container";
import { Stat } from "@/components/ui/stat";
import {
  fmtParam,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_MED_RESEARCH_SPENDING,
} from "@optimitron/data/parameters";
const MILITARY_SPENDING = GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value / 1e9; // in billions
const MEDICAL_RESEARCH = GLOBAL_MED_RESEARCH_SPENDING.value / 1e9; // in billions
const RATIO = Math.round(MILITARY_SPENDING / MEDICAL_RESEARCH);
const MEDICAL_BAR_PCT = ((MEDICAL_RESEARCH / MILITARY_SPENDING) * 100).toFixed(1);
const milFmt = fmtParam({ ...GLOBAL_MILITARY_SPENDING_ANNUAL_2024, unit: "USD" });
const medFmt = fmtParam({ ...GLOBAL_MED_RESEARCH_SPENDING, unit: "USD" });

export function WarVsCuresChart() {
  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg" className="overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-base lg:text-2xl font-bold uppercase text-center mb-0 sm:text-2xl"
        >
          Your species spends
        </motion.p>
        <motion.h2
          initial={{ scale: 10, rotate: 15 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1], delay: 0.2 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase text-center mb-0"
        >
          {RATIO}X more on <span className="text-brutal-pink">war</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-base lg:text-2xl font-bold uppercase text-center mb-8 sm:text-2xl"
        >
          than curing all diseases combined
        </motion.p>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Military Bar */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex items-center justify-between mb-2"
            >
              <div className="text-lg sm:text-xl md:text-2xl font-black uppercase">Military</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-brutal-pink">
                <Stat param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} format={(p) => fmtParam({ ...p, unit: "USD" })} />
              </div>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 0.6 }}
              style={{ originX: 0 }}
              className="relative h-20 sm:h-24 bg-brutal-pink border-4 border-primary"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg md:text-xl font-black text-brutal-pink-foreground uppercase text-center">
                  {milFmt} for blowing things up
                </span>
              </div>
            </motion.div>
          </div>

          {/* Medical Research Bar */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="flex items-center justify-between mb-2"
            >
              <div className="text-lg sm:text-xl md:text-2xl font-black uppercase">Medical Research</div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-brutal-cyan">
                <Stat param={GLOBAL_MED_RESEARCH_SPENDING} format={(p) => fmtParam({ ...p, unit: "USD" })} />
              </div>
            </motion.div>
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 0.9 }}
                style={{ originX: 0, width: `${MEDICAL_BAR_PCT}%` }}
                className="relative h-20 sm:h-24 bg-brutal-cyan border-4 border-primary"
              />
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.2 }}
                className="text-sm sm:text-lg font-black uppercase whitespace-nowrap"
              >
                {medFmt} for <br />
                not dying
              </motion.span>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 1.4 }}
          className="text-center text-sm text-muted-foreground font-bold mt-8 max-w-2xl mx-auto"
        >
          Sources: SIPRI Military Expenditure Database 2024, WHO Global Health R&D Observatory.
          The tiny cyan bar is to scale. That&apos;s not a rendering error.
        </motion.p>
      </div>
    </SectionContainer>
  );
}
