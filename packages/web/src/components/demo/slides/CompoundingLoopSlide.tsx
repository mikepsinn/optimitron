"use client";

import { useReducedMotion, motion } from "framer-motion";
import { CountUp } from "@/components/animations/CountUp";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";

const ARCADE = "font-pixel";

const LOOP_NODES = [
  { label: "REDIRECT $27B", emoji: "💰" },
  { label: "CURE DISEASES\n(44× CHEAPER)", emoji: "🧪" },
  { label: "UNLOCK 13% GDP\n($15T/yr)", emoji: "📈" },
  { label: "MORE REVENUE\n→ BIGGER BUDGET", emoji: "🔄" },
];

/** Compounding loop slide — feedback loop + GDP trajectories */
export default function CompoundingLoopSlide() {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 sm:px-8 overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={reduced ? false : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${ARCADE} text-xl sm:text-2xl md:text-3xl text-foreground uppercase mb-4`}
      >
        THE COMPOUNDING LOOP
      </motion.h2>

      {/* Circular flow diagram */}
      <div className="relative w-full max-w-lg mx-auto mb-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {LOOP_NODES.map((node, i) => (
            <motion.div
              key={node.label}
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.25, type: "spring", stiffness: 200 }}
              className={`border-4 border-primary px-3 py-2 sm:px-4 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                i % 2 === 0 ? "bg-brutal-cyan" : "bg-brutal-yellow"
              }`}
            >
              <span className="text-xl sm:text-2xl">{node.emoji}</span>
              <p
                className={`${ARCADE} text-[10px] sm:text-xs text-foreground uppercase leading-tight mt-1 whitespace-pre-line`}
              >
                {node.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Animated arrows between nodes */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Top arrow: left → right */}
          <div className="absolute top-[25%] left-[48%] translate-x-[-50%]">
            <motion.span
              animate={reduced ? {} : { x: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className={`${ARCADE} text-lg sm:text-2xl text-foreground`}
            >
              →
            </motion.span>
          </div>
          {/* Right arrow: top → bottom */}
          <div className="absolute top-[48%] right-[18%] sm:right-[20%]">
            <motion.span
              animate={reduced ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className={`${ARCADE} text-lg sm:text-2xl text-foreground`}
            >
              ↓
            </motion.span>
          </div>
          {/* Bottom arrow: right → left */}
          <div className="absolute bottom-[25%] left-[48%] translate-x-[-50%]">
            <motion.span
              animate={reduced ? {} : { x: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className={`${ARCADE} text-lg sm:text-2xl text-foreground`}
            >
              ←
            </motion.span>
          </div>
          {/* Left arrow: bottom → top */}
          <div className="absolute top-[48%] left-[18%] sm:left-[20%]">
            <motion.span
              animate={reduced ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
              className={`${ARCADE} text-lg sm:text-2xl text-foreground`}
            >
              ↑
            </motion.span>
          </div>
        </motion.div>
      </div>

      {/* ROI comparison bars */}
      <div className="w-full max-w-lg space-y-2 mb-4">
        <div>
          <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground text-left mb-1`}>
            💥 MILITARY: $1 IN → $0.60 OUT
          </p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 0.6 }}
            transition={{ duration: 1, delay: 1.5, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="h-6 sm:h-8 bg-brutal-red border-4 border-primary"
          />
        </div>
        <div>
          <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground text-left mb-1`}>
            🧪 HEALTHCARE: $1 IN → $1.80 OUT
          </p>
          <motion.div
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 1.8, ease: [0.87, 0, 0.13, 1] }}
            style={{ originX: 0 }}
            className="h-6 sm:h-8 bg-brutal-cyan border-4 border-primary"
          />
        </div>
      </div>

      {/* GDP Trajectory Chart */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        className="w-full max-w-2xl mb-3"
      >
        <GdpTrajectoryChart className="border-4 border-primary bg-background p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
      </motion.div>

      {/* Three trajectory labels with CountUp */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-3 sm:gap-6"
      >
        <div className="border-4 border-primary bg-muted px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className={`${ARCADE} text-[10px] sm:text-xs text-muted-foreground uppercase`}>STATUS QUO 2.5%/YR</p>
          <p className={`${ARCADE} text-lg sm:text-xl text-foreground`}>
            $<CountUp value={12500} prefix="" suffix="" duration={2} />
          </p>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className={`${ARCADE} text-[10px] sm:text-xs text-foreground uppercase`}>TREATY 17.9%/YR</p>
          <p className={`${ARCADE} text-lg sm:text-xl text-foreground`}>
            $<CountUp value={339000} prefix="" suffix="" duration={2.5} />
          </p>
        </div>
        <div className="border-4 border-primary bg-brutal-cyan px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className={`${ARCADE} text-[10px] sm:text-xs text-foreground uppercase`}>WISHONIA 25.4%/YR</p>
          <p className={`${ARCADE} text-lg sm:text-xl text-foreground`}>
            $<CountUp value={1160000} prefix="" suffix="" duration={3} />
          </p>
        </div>
      </motion.div>
    </div>
  );
}
