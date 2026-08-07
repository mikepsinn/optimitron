"use client";

import { type ReactNode, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 30 },
  down: { x: 0, y: -30 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
  none: { x: 0, y: 0 },
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className,
  once = true,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  const hasHydrated = useHydrated();
  const { x, y } = offsets[direction];
  // Automation (screenshots, copy previews, e2e) must capture the settled
  // content, never a scroll-position-dependent fade frame. Render-time check
  // so below-fold content is never faded out in the first place; markup is
  // identical either way, only motion props change.
  const isAutomation = typeof navigator !== "undefined" && navigator.webdriver;
  const shouldAnimate = hasHydrated && !prefersReducedMotion && !isAutomation;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={
        shouldAnimate && !isInView
          ? { opacity: 0, x, y }
          : { opacity: 1, x: 0, y: 0 }
      }
      transition={
        shouldAnimate
          ? { duration, delay, ease: "easeOut" }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}
