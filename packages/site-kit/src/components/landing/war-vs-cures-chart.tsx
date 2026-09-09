"use client"

import { motion } from "framer-motion"
import { AllocationBar } from "@optimitron/neobrutalist-ui/ui/allocation-bar"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { getSiteConfig } from "../../lib/site-config"
import {
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
} from "@optimitron/data/parameters"
import { formatParameter, getParameterValue } from "@optimitron/data/parameters/compact-format"

interface WarVsCuresChartProps {
  showReasonLabel?: boolean
}

export default function WarVsCuresChart({ showReasonLabel = true }: WarVsCuresChartProps) {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent

  const militarySpending = formatParameter(GLOBAL_MILITARY_SPENDING_ANNUAL_2024)
  const clinicalTrials = formatParameter(GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL)
  const ratio = getParameterValue(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO, "round")
  const militaryLabel = showPoliticalContent ? "WEAPONS AND MILITARY" : "MILITARY"
  const trialLabel = showPoliticalContent ? "PUBLICLY FUNDED CLINICAL TRIALS" : "CLINICAL TRIALS"

  return (
    <SectionContainer bgColor="background" borderPosition="bottom" padding="lg" className="overflow-hidden">
      <Container className="overflow-hidden">
        {showPoliticalContent && showReasonLabel && (
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
          {ratio}X MORE ON <span className="text-brutal-pink">{militaryLabel}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-base lg:text-2xl font-bold uppercase text-center mb-6 leading-7 sm:text-2xl"
        >
          THAN {trialLabel}
        </motion.p>

        <div className="max-w-4xl mx-auto space-y-6">
          <AllocationBar
            label={militaryLabel}
            size="large"
            showTrack={false}
            maxValue={GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value}
            segments={[{
              label: militaryLabel,
              value: GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value,
              displayValue: militarySpending,
              colorClassName: "bg-brutal-pink",
              valueClassName: "text-brutal-pink",
              content: (
                <span className="text-lg sm:text-xl md:text-2xl font-black text-brutal-pink-foreground uppercase text-center">
                  {militarySpending} FOR<br />{militaryLabel}
                </span>
              ),
            }]}
          />
          <AllocationBar
            label={trialLabel}
            size="large"
            showTrack={false}
            maxValue={GLOBAL_MILITARY_SPENDING_ANNUAL_2024.value}
            segments={[{
              label: trialLabel,
              value: GLOBAL_GOVERNMENT_CLINICAL_TRIALS_SPENDING_ANNUAL.value,
              displayValue: clinicalTrials,
              colorClassName: "bg-brutal-cyan",
              valueClassName: "text-brutal-cyan",
            }]}
          />
        </div>
      </Container>
    </SectionContainer>
  )
}
