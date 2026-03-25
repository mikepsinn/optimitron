"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/retroui/Card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { useEffect, useState } from "react"
import { GLOBAL_DISEASE_DEATHS_DAILY } from "@/lib/parameters-calculations-citations"

export default function OpportunityCostTicker() {
  const [todayDeaths, setTodayDeaths] = useState(0)
  const [yearDeaths, setYearDeaths] = useState(0)

  useEffect(() => {
    const calculateInitialCounts = () => {
      const now = new Date()

      const deathsPerDay = GLOBAL_DISEASE_DEATHS_DAILY.value
      const deathsPerSecond = deathsPerDay / 86400

      const secondsSinceMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      const initialTodayDeaths = secondsSinceMidnight * deathsPerSecond

      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
      const secondsSinceYearStart = dayOfYear * 86400 + secondsSinceMidnight
      const initialYearDeaths = secondsSinceYearStart * deathsPerSecond

      setTodayDeaths(initialTodayDeaths)
      setYearDeaths(initialYearDeaths)
    }

    calculateInitialCounts()

    const interval = setInterval(() => {
      const deathsPerSecond = GLOBAL_DISEASE_DEATHS_DAILY.value / 86400
      setTodayDeaths((prev) => prev + deathsPerSecond)
      setYearDeaths((prev) => prev + deathsPerSecond)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString()
  }

  return (
    <SectionContainer bgColor="primary" borderPosition="bottom" padding="lg" className="border-background">
      <Container>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center text-brutal-yellow mb-8"
        >
          OPPORTUNITY COST CLOCK
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            <Card className="bg-brutal-pink border-4 border-background p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-brutal-pink-foreground tabular-nums mb-4">
                {formatNumber(todayDeaths)}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-brutal-pink-foreground uppercase">
                LIVES LOST TO POLICY INEFFICIENCY TODAY
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          >
            <Card className="bg-brutal-cyan border-4 border-background p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-brutal-cyan-foreground tabular-nums mb-4">
                {formatNumber(yearDeaths)}
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-black text-brutal-cyan-foreground uppercase">
                LIVES LOST THIS YEAR
              </div>
            </Card>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase text-primary-foreground leading-tight">
            while governments allocate trillions to weapons systems and zero to figuring out what actually works
          </div>
        </motion.div>
      </Container>
    </SectionContainer>
  )
}
