"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { ArrowDown } from "lucide-react"

export function InstituteHero() {
  const brutalEase: [number, number, number, number] = [0.87, 0, 0.13, 1]

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.querySelector('[data-how-it-works]')
    howItWorksSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToJoin = () => {
    const registerSection = document.querySelector('[data-register-section]')
    registerSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0,
      },
    },
  }

  const wordVariants = {
    hidden: { scale: 15, rotate: -20 },
    visible: {
      scale: 1,
      rotate: 0,
        transition: {
          duration: 0.5,
          ease: brutalEase,
        },
      },
  }

  const highlightVariants = {
    hidden: { scale: 20, rotate: 30 },
    visible: {
      scale: [20, 0.9, 1],
      rotate: [30, -10, 0],
        transition: {
          duration: 0.6,
          ease: brutalEase,
          times: [0, 0.7, 1],
        },
    },
  }

  return (
    <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg" className="py-32 overflow-hidden">
      <Container className="px-6">
        <motion.div
          className="flex flex-col items-center gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={highlightVariants}
            whileHover={{
              rotate: [0, -5, 5, -5, 5, 0],
              scale: 1.05,
              transition: { duration: 0.5, ease: "linear" }
            }}
            className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight tracking-tighter text-brutal-cyan cursor-default max-w-5xl"
          >
            BECOME A PARTNER INSTITUTE
          </motion.h1>
          <motion.h1
            variants={wordVariants}
            className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tighter max-w-4xl"
          >
            FOR THE GLOBAL CLINICAL TRIAL
          </motion.h1>
          <motion.h1
            variants={wordVariants}
            className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tighter text-brutal-pink"
          >
            ABUNDANCE SURVEY
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl font-bold max-w-3xl mx-auto text-center text-background/90 mt-6"
          >
            Host a short, nonpartisan survey for your supporters, get policy-grade data on how much they want governments to invest in clinical trials, and use it to strengthen your grants, advocacy, and fundraising.
          </motion.p>

          <motion.div
            initial={{ scale: 25, rotate: 180, opacity: 0 }}
            animate={{
              scale: [1, 1.05, 1],
              rotate: 0,
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              scale: {
                duration: 0.6,
                ease: brutalEase,
                delay: 1.0,
              },
              rotate: {
                duration: 0.6,
                ease: brutalEase,
                delay: 1.0,
              },
              opacity: {
                duration: 0.6,
                ease: brutalEase,
                delay: 1.0,
              },
              y: {
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
                delay: 1.6,
              },
            }}
            whileHover={{
              rotate: [0, 3, -3, 3, -3, 0],
              x: [0, -4, 4, -4, 4, 0],
              y: [0, -4, 4, -4, 4, 0],
              transition: {
                duration: 0.4,
                ease: "linear",
              },
            }}
            whileTap={{ scale: 0.9, rotate: 5, transition: { duration: 0.1 } }}
            className="mt-8 inline-block"
          >
            <Button
              onClick={scrollToJoin}
              size="lg"
              className="bg-brutal-pink text-foreground border-4 border-primary hover:bg-brutal-yellow font-black uppercase text-xl sm:text-2xl px-10 sm:px-16 py-6 sm:py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              BECOME A PARTNER NOW
              <ArrowDown className="ml-3 h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            onClick={scrollToHowItWorks}
            className="mt-4 text-lg font-bold text-brutal-cyan hover:text-brutal-yellow transition-colors cursor-pointer underline underline-offset-4"
          >
            See how it works ↓
          </motion.button>
        </motion.div>
      </Container>
    </SectionContainer>
  )
}
