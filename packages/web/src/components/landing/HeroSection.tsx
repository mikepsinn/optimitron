"use client";

import { motion } from "framer-motion";
import { GameCTA } from "@/components/ui/game-cta";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { LiveDeathTicker } from "@/components/animations/LiveDeathTicker";
import { TAGLINES, CTA } from "@/lib/messaging";
import { ROUTES } from "@/lib/routes";

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
            PLAY THE
          </motion.h1>
          <motion.h1
            variants={wordVariants}
            className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none tracking-tighter"
          >
             EARTH OPTIMIZATION
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
            GAME!
          </motion.h1>

          <motion.p
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-center text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold max-w-4xl leading-tight"
          >
            {TAGLINES.gameObjective}
          </motion.p>

          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-4"
          >
            <GameCTA href={ROUTES.declaration} variant="secondary" size="lg">
              Read Declaration
            </GameCTA>
            <GameCTA href={ROUTES.tasks} variant="primary" size="lg">
              Open Top Tasks
            </GameCTA>
            <GameCTA href="#vote" variant="yellow" size="lg">
              {CTA.playNow}
            </GameCTA>
          </motion.div>

          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-6"
          >
            <LiveDeathTicker />
          </motion.div>
        </motion.div>
      </Container>
    </SectionContainer>
  );
}
