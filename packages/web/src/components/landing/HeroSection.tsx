"use client";

import { motion } from "framer-motion";
import { GameCTA } from "@/components/ui/game-cta";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { TAGLINES, CTA } from "@/lib/messaging";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0,
    },
  },
};

const wordVariants = {
  hidden: { scale: 20, rotate: -25 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
    },
  },
};

const gameVariants = {
  hidden: { scale: 25, rotate: 45 },
  visible: {
    scale: [25, 0.8, 1],
    rotate: [45, -15, 0],
    transition: {
      duration: 0.6,
      ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
      times: [0, 0.7, 1],
    },
  },
};

export function HeroSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="bottom"
      className="overflow-hidden"
    >
      <Container className="py-24 sm:py-32">
        <motion.div
          className="flex flex-col items-center gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={wordVariants}
            className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tighter"
          >
            THE EARTH
          </motion.h1>
          <motion.h1
            variants={wordVariants}
            className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tighter"
          >
            OPTIMIZATION
          </motion.h1>
          <motion.h1
            variants={gameVariants}
            whileHover={{
              rotate: [0, -5, 5, -5, 5, 0],
              skewX: [0, 5, -5, 0],
              transition: { duration: 0.5, ease: "linear" },
            }}
            whileTap={{ scale: 0.9, rotate: -10 }}
            className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tighter text-brutal-pink cursor-pointer"
          >
            GAME.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold max-w-4xl leading-tight"
          >
            {TAGLINES.gameObjective}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-3 text-center text-base sm:text-lg md:text-xl font-bold text-muted-foreground max-w-3xl leading-tight"
          >
            {TAGLINES.alignTheSuperintelligence} Vote. Share. Win.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-4"
          >
            <GameCTA href="#vote" variant="primary" size="lg">
              {CTA.playNow}
            </GameCTA>
            <GameCTA href="#rules" variant="yellow" size="lg">
              {CTA.seeTheRules}
            </GameCTA>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-4 text-lg sm:text-xl font-black text-muted-foreground uppercase"
          >
            Free. 30 seconds. No catch.
          </motion.p>
        </motion.div>
      </Container>
    </SectionContainer>
  );
}
