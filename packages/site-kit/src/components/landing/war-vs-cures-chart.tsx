"use client"

import { motion } from "framer-motion"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { getSiteConfig } from "../../lib/site-config"
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@optimitron/data/parameters"
import { formatParameter, getParameterValue } from "@optimitron/data/parameters/compact-format"

export default function WarVsCuresChart() {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent

  const militarySpending = formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024)
  const clinicalTrials = formatParameter(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL)
  const ratio = getParameterValue(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO, "round")

  const trialsBarWidth = (GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value / GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value * 100).toFixed(2)

  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg" className="overflow-hidden">
      <Container className="overflow-hidden">
        {showPoliticalContent && (
          <motion.h2
            initial={{ scale: 20, rotate: -25 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-center mb-4"
          >
            REASON 2.
          </motion.h2>
        )}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base lg:text-2xl font-bold uppercase text-center mb-0 sm:text-2xl"
        >
          GOVERNMENTS SPEND
        </motion.p>
        <motion.h2
          initial={{ scale: 15, rotate: 20 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1], delay: 0.3 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase text-center mb-0"
        >
          {ratio}X MORE ON <span className="text-brutal-pink">WAR</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-base lg:text-2xl font-bold uppercase text-center mb-6 leading-7 sm:text-2xl"
        >
          THAN CLINICAL TRIALS TO DISCOVER NEW TREATMENTS FOR DISEASES
        </motion.p>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Military Bar */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="flex items-center justify-between mb-2"
              >
                <div className="text-lg sm:text-xl md:text-2xl font-black uppercase">MILITARY</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-brutal-pink">{militarySpending}</div>
              </motion.div>
              <motion.div
                data-visual-force-complete
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 0.7 }}
                style={{ originX: 0 }}
                className="relative h-24 bg-brutal-pink border-2 border-primary"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg sm:text-xl md:text-2xl font-black text-brutal-pink-foreground uppercase">
                    {militarySpending} FOR <br />
                    {showPoliticalContent ? "MASS MURDER CAPACITY" : "MILITARY SYSTEMS"}
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
                transition={{ duration: 0.4, delay: 0.9 }}
                className="flex items-center justify-between mb-2"
              >
                <div className="text-lg sm:text-xl md:text-2xl font-black uppercase">CLINICAL TRIALS</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-brutal-cyan">{clinicalTrials}</div>
              </motion.div>
              <div className="flex items-center gap-4">
                <motion.div
                  data-visual-force-complete
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 1 }}
                  style={{ originX: 0, width: `${trialsBarWidth}%` }}
                  className="relative h-24 bg-brutal-cyan border-2 border-primary"
                />
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 1.3 }}
                  className="text-base font-black uppercase whitespace-nowrap text-foreground sm:text-xl"
                >
                  {clinicalTrials} FOR <br />
                  CLINICAL TRIALS
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </SectionContainer>
  )
}
