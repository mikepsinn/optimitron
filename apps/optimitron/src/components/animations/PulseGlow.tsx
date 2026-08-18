"use client";

import { type ReactNode, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function PulseGlow({
  children,
  color = "rgba(220, 38, 38, 0.5)",
  className,
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={
        isInView
          ? {
              boxShadow: [
                `0 0 20px ${color.replace(/[\d.]+\)$/, "0.4)")}`,
                `0 0 40px ${color.replace(/[\d.]+\)$/, "0.7)")}`,
                `0 0 20px ${color.replace(/[\d.]+\)$/, "0.4)")}`,
              ],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
