"use client"

import { motion } from "framer-motion"
import { getSiteConfig } from "../../lib/site-config"
import { VoteOrShareButton } from "../shared/VoteOrShareButton"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { ChevronDown } from "lucide-react"

export default function HeroSection() {
  const config = getSiteConfig()
  const showPoliticalContent = config.showPoliticalContent
  const brutalEase: [number, number, number, number] = [0.87, 0, 0.13, 1]
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0,
      },
    },
  }

  const wordVariants = {
    hidden: { scale: 20, rotate: -25 },
    visible: {
      scale: 1,
      rotate: 0,
        transition: {
          duration: 0.5,
          ease: brutalEase, // Aggressive easeInOutExpo
        },
      },
  }

  const crazyVariants = {
    hidden: { scale: 25, rotate: 45 },
    visible: {
      scale: [25, 0.8, 1],
      rotate: [45, -15, 0],
        transition: {
          duration: 0.6,
          ease: brutalEase,
          times: [0, 0.7, 1],
        },
    },
  }

  const handleConvinceMeClick = () => {
    // Scroll past the vote section to the evidence
    const target = document.getElementById("problem-statement") || document.getElementById("horrible-problems-section")
    target?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <SectionContainer bgColor="background" borderPosition="bottom" className="py-32 overflow-hidden">
      <Container className="px-6">
        <motion.div
          className="flex flex-col items-center gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {showPoliticalContent ? (
            <>
              {/* Main hook - big and bold */}
              <motion.h1
                variants={wordVariants}
                className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tighter"
              >
                95% OF DISEASES HAVE
              </motion.h1>
              <motion.h1
                variants={wordVariants}
                className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tighter"
              >
                ZERO
              </motion.h1>
              <motion.h1
                variants={crazyVariants}
                whileHover={{
                  rotate: [0, -5, 5, -5, 5, 0],
                  skewX: [0, 5, -5, 0],
                  transition: { duration: 0.5, ease: "linear" }
                }}
                whileTap={{ scale: 0.9, rotate: -10 }}
                className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter text-brutal-pink cursor-pointer"
              >
                TREATMENTS.
              </motion.h1>

              {/* The question - smaller, conversational */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold max-w-4xl leading-tight"
              >
                Is it OK if we allocate 1% of our apocalypse monies to curing them?
              </motion.p>
            </>
          ) : (
            <>
              <motion.h1
                variants={wordVariants}
                className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter"
              >
                THE
              </motion.h1>
              <motion.h1
                variants={wordVariants}
                className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter"
              >
                GLOBAL SURVEY
              </motion.h1>
              <motion.h1
                variants={wordVariants}
                className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter"
              >
                ON
              </motion.h1>
              <motion.h1
                variants={crazyVariants}
                whileHover={{
                  rotate: [0, -8, 8, -8, 8, 0],
                  skewX: [0, 8, -8, 0],
                  transition: { duration: 0.6, ease: "linear" }
                }}
                whileTap={{ scale: 0.9, rotate: -10 }}
                className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter text-brutal-pink cursor-pointer"
              >
                HUMAN VALUES
              </motion.h1>
            </>
          )}

          {/* Two CTAs for political content, single for survey */}
          {showPoliticalContent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-4"
            >
              <VoteOrShareButton
                variant="hero"
                size="lg"
                className="!shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                forceText="FINE..."
                onClick={(e: React.MouseEvent) => {
                  const target = e.currentTarget as HTMLAnchorElement
                  if (window.location.pathname === "/" && target.getAttribute("href") === "/#vote") {
                    e.preventDefault()
                    document.getElementById("vote")?.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              />
              <Button
                variant="outline"
                size="lg"
                onClick={handleConvinceMeClick}
                className="border-4 border-primary bg-background text-foreground font-black uppercase text-lg px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                YOU'RE CRAZY <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 30, rotate: 180, opacity: 0 }}
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
                  delay: 0.8,
                },
                rotate: {
                  duration: 0.6,
                  ease: brutalEase,
                  delay: 0.8,
                },
                opacity: {
                  duration: 0.6,
                  ease: brutalEase,
                  delay: 0.8,
                },
                y: {
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: 1.4,
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
              className="mt-6 inline-block"
            >
              <VoteOrShareButton
                variant="hero"
                size="lg"
                className="!shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:!shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                forceText="Answer the Question"
                onClick={(e: React.MouseEvent) => {
                  const target = e.currentTarget as HTMLAnchorElement
                  if (window.location.pathname === "/" && target.getAttribute("href") === "/#vote") {
                    e.preventDefault()
                    document.getElementById("vote")?.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </Container>
    </SectionContainer>
  )
}
