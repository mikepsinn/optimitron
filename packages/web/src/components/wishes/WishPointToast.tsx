"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playWishSound } from "@/lib/wish-sound";

interface WishPointToastProps {
  amount: number;
  label: string;
  onDone: () => void;
}

/** Particle that flies outward from center */
function Sparkle({ delay, angle }: { delay: number; angle: number }) {
  const distance = 80 + Math.random() * 120;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;
  const symbols = ["✦", "⭐", "✨", "💫", "⚡"];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]!;

  return (
    <motion.span
      initial={{ opacity: 1, scale: 1.5, x: 0, y: 0 }}
      animate={{ opacity: 0, scale: 0, x, y }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="absolute text-lg pointer-events-none"
      style={{ left: "50%", top: "40%" }}
    >
      {symbol}
    </motion.span>
  );
}

export function WishPointToast({ amount, label, onDone }: WishPointToastProps) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");

  useEffect(() => {
    playWishSound(amount);
    // Star flies in → hold → fly out
    const showTimer = setTimeout(() => setPhase("show"), 400);
    const exitTimer = setTimeout(() => setPhase("exit"), 2800);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, [amount]);

  const sparkleCount = Math.min(amount * 4, 20);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {phase !== "exit" ? (
        <motion.div
          key="toast"
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          {/* Background flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-brutal-yellow"
          />

          {/* Main star — flies in from top, scales up, then flies out */}
          <motion.div
            initial={{ y: -300, scale: 0, rotate: -180 }}
            animate={{
              y: 0,
              scale: [0, 1.4, 1],
              rotate: [-180, 15, 0],
            }}
            exit={{ y: -400, scale: 0.3, opacity: 0, rotate: 180 }}
            transition={{
              y: { type: "spring", stiffness: 300, damping: 20 },
              scale: { duration: 0.5, ease: "easeOut" },
              rotate: { duration: 0.5, ease: "easeOut" },
            }}
            className="relative"
          >
            {/* Star icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 3, duration: 0.3, delay: 0.4, ease: "easeInOut" }}
              className="text-center"
            >
              <span className="text-7xl sm:text-8xl drop-shadow-[0_0_20px_rgba(255,200,0,0.8)]">
                ⭐
              </span>
            </motion.div>

            {/* Points text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
              className="text-center mt-2"
            >
              <div className="border-4 border-primary bg-brutal-yellow px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] inline-block">
                <span className="text-4xl sm:text-5xl font-black text-foreground">
                  +{amount}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-foreground ml-2">
                  {amount === 1 ? "Wish" : "Wishes"}
                </span>
              </div>
            </motion.div>

            {/* Reason label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm font-black uppercase text-foreground text-center mt-3 tracking-wider"
            >
              {label}
            </motion.p>

            {/* Sparkle burst */}
            {Array.from({ length: sparkleCount }).map((_, i) => (
              <Sparkle
                key={i}
                delay={0.2 + i * 0.03}
                angle={(i / sparkleCount) * Math.PI * 2}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
