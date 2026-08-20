"use client"

import { motion } from "framer-motion"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { getSiteConfig } from "../../lib/site-config"
import {
  GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024,
  TREATY_ANNUAL_FUNDING,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
} from "@optimitron/data/parameters"
import { formatParameter } from "@optimitron/data/parameters/compact-format"

// Derived values from parameters using formatParameter utility
const remainingMilitaryBudget = formatParameter(GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024, { precision: 3 })
const treatyFunding = formatParameter(TREATY_ANNUAL_FUNDING)
const currentGovTrials = formatParameter(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL)
// Government clinical trials post-treaty = current government trial spending + treaty funding
const totalGovTrialsValue =
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value + TREATY_ANNUAL_FUNDING.value
const totalGovTrials = formatParameter({
  ...GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  value: totalGovTrialsValue,
})
// Calculate percentages for the visualization bar (need raw values for math)
const currentPct = (GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value / totalGovTrialsValue) * 100
const treatyPct = 100 - currentPct
// Width of the government-trials bar relative to the military bar (as a % of the military bar length)
const govTrialsBarWidthPct =
  (totalGovTrialsValue / GLOBAL_MILITARY_SPENDING_POST_TREATY_ANNUAL_2024.value) * 100

export default function TreatyVisualization() {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent

  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg" className="overflow-hidden">
      <Container className="overflow-hidden">
        <motion.div
          initial={{ scale: 25, rotate: -40 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.87, 0, 0.13, 1] }}
          className="font-black uppercase text-center mb-4 text-4xl text-foreground sm:text-6xl"
        >
          THE 1% TREATY
        </motion.div>
        <div className="font-black uppercase text-center leading-tight mb-6 space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-lg sm:text-xl lg:text-3xl"
          >
            Would REDIRECT
          </motion.div>
          <motion.div
            initial={{ scale: 15, rotate: 20 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1], delay: 0.5 }}
            className="text-xl text-brutal-pink sm:text-3xl"
          >
            1% OF GLOBAL MILITARY SPENDING
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-lg sm:text-xl lg:text-3xl"
          >
            TO RADICALLY ACCELERATE MEDICAL PROGRESS BY ALLOWING ANY PATIENT TO PARTICIPATE IN PRAGMATIC TRIALS
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* With 1% Treaty */}
          <div>
            <div className="space-y-6">
              {/* Military Bar - After Treaty */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                  className="flex items-center justify-between mb-2"
                >
                  <div className="text-base sm:text-lg md:text-xl font-black uppercase">MILITARY</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black text-brutal-pink">{remainingMilitaryBudget}</div>
                </motion.div>
                <motion.div
                  data-visual-force-complete
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 1 }}
                  style={{ originX: 0, width: "99%" }}
                  className="relative h-20 border-2 border-primary flex"
                >
                  {/* Remaining 99% - remainingMilitaryBudget */}
                  <div className="bg-brutal-pink flex items-center justify-end flex-1 pr-4">
                    <span className="text-base sm:text-lg md:text-xl font-black text-brutal-pink-foreground uppercase">
                      1% REDUCTION 👉
                    </span>
                  </div>
                  {/* 1% transferred - $27B - shown as thin yellow stripe */}
                  <div className="bg-brutal-yellow border-l-2 border-primary" style={{ width: "1%" }} />
                </motion.div>
              </div>

              {/* Government Clinical Trials Bar - After Treaty */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                  className="flex items-center justify-between mb-2"
                >
                  <div className="text-base sm:text-lg md:text-xl font-black uppercase">GOV. CLINICAL TRIALS</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-black text-brutal-cyan">{totalGovTrials}</div>
                </motion.div>
                <div className="flex items-center gap-4">
                  <motion.div
                    data-visual-force-complete
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.87, 0, 0.13, 1], delay: 1.3 }}
                    style={{ originX: 0, width: `${govTrialsBarWidthPct.toFixed(2)}%` }}
                    className="relative h-20 border-2 border-primary flex"
                  >
                    {/* Original portion - calculated percentage of the bar - no text inside */}
                    <div className="bg-brutal-cyan" style={{ width: `${currentPct.toFixed(1)}%` }} />
                    {/* New treaty portion - calculated percentage of the bar - no text inside */}
                    <div className="bg-brutal-yellow border-l-2 border-primary" style={{ width: `${treatyPct.toFixed(1)}%` }} />
                  </motion.div>
                  {/* Labels moved outside to the right */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 1.6 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-brutal-cyan border-2 border-primary" />
                      <span className="text-sm sm:text-base font-black uppercase text-accent-foreground">
                        {currentGovTrials} CURRENT
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-brutal-yellow border-2 border-primary" />
                      <span className="text-sm sm:text-base font-black uppercase text-accent-foreground">
                        👈+{treatyFunding} INCREASE FROM 1% TREATY
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          <Card className="bg-primary border-4 border-primary p-6 sm:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-center space-y-3">
              {showPoliticalContent ? (
                <>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground uppercase">
                    DON'T WORRY.
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground uppercase">
                    with the remaining {remainingMilitaryBudget}, WE'D STILL HAVE ENOUGH BULLETS, MISSILES, AND NUCLEAR BOMBS TO KILL EVERY MAN, WOMAN, AND CHILD ON EARTH 19 TIMES
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground uppercase">
                     (which should be more than sufficient)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground uppercase">
                    THE REMAINING {remainingMilitaryBudget}
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-primary-foreground uppercase">
                    MAINTAINS NUCLEAR ARSENALS WITH DESTRUCTIVE CAPACITY EXCEEDING THE GLOBAL POPULATION BY A FACTOR OF 19
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </SectionContainer>
  )
}
