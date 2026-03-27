"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  fmtParam,
  PRIZE_POOL_HORIZON_MULTIPLE,
  VOTE_TOKEN_VALUE,
} from "@optimitron/data/parameters";
import { SectionHeader } from "@/components/ui/section-header";
import { BrutalCard } from "@/components/ui/brutal-card";
import { CountUp } from "@/components/animations/CountUp";

const poolMultiple = PRIZE_POOL_HORIZON_MULTIPLE.value;
const voteValue = VOTE_TOKEN_VALUE.value;

const deposit = 100;
const votes = 2;
const failReturn = Math.round(deposit * poolMultiple);
const winReturn = Math.round(votes * voteValue);

export function PrizeWorkedExample() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  return (
    <div ref={ref} className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-8">
      <SectionHeader
        title="The Worked Example"
        subtitle={`$${deposit} deposit + ${votes} friends recruited`}
      />

      {/* Fork diagram: deposit splits into two outcomes */}
      <div className="relative max-w-3xl w-full mb-8">
        {/* Deposit node */}
        <motion.div
          className="mx-auto w-48 mb-4"
          initial={reduced ? {} : { opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="border-4 border-primary bg-foreground p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-2xl font-black text-background">${deposit}</p>
            <p className="text-xs font-black uppercase text-muted">Deposited</p>
          </div>
        </motion.div>

        {/* Fork lines (SVG) */}
        <svg viewBox="0 0 400 40" className="w-full max-w-md mx-auto mb-4" aria-hidden>
          {/* Center down */}
          <motion.line
            x1="200" y1="0" x2="200" y2="15"
            stroke="currentColor" strokeWidth="3"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
          {/* Left branch */}
          <motion.path
            d="M200,15 L100,15 L100,40"
            fill="none" stroke="currentColor" strokeWidth="3"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          {/* Right branch */}
          <motion.path
            d="M200,15 L300,15 L300,40"
            fill="none" stroke="currentColor" strokeWidth="3"
            initial={reduced ? {} : { pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
        </svg>

        {/* Two outcome cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <BrutalCard bgColor="yellow" shadowSize={8}>
              <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block mb-3 uppercase">
                Targets Missed
              </div>
              <p className="text-sm font-bold text-foreground mb-2">
                ${deposit} &times; {poolMultiple.toFixed(1)}&times;
              </p>
              <p className="text-4xl sm:text-5xl font-black text-foreground">
                $<CountUp value={failReturn} duration={1.5} />
              </p>
              <p className="text-sm font-bold text-foreground mt-2">
                Your &ldquo;worst case&rdquo;
              </p>
            </BrutalCard>
          </motion.div>

          <motion.div
            initial={reduced ? {} : { opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <BrutalCard bgColor="cyan" shadowSize={8}>
              <div className="text-xs font-black px-2.5 py-1 bg-foreground text-background inline-block mb-3 uppercase">
                Targets Hit
              </div>
              <p className="text-sm font-bold text-foreground mb-2">
                {votes} VOTE &times; {fmtParam(VOTE_TOKEN_VALUE)} each
              </p>
              <p className="text-4xl sm:text-5xl font-black text-foreground">
                $<CountUp value={winReturn} duration={2} />
              </p>
              <p className="text-sm font-bold text-foreground mt-2">
                Plus a healthier, wealthier planet
              </p>
            </BrutalCard>
          </motion.div>
        </div>
      </div>

      {/* Break-even */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 1.4 }}
      >
        <BrutalCard shadowSize={4} className="max-w-md">
          <p className="text-lg font-black text-foreground">
            Break-even probability:{" "}
            <span className="text-brutal-pink">0.0067%</span>{" "}
            <span className="text-sm font-bold text-muted-foreground">(1 in 15,000)</span>
          </p>
        </BrutalCard>
      </motion.div>
    </div>
  );
}
