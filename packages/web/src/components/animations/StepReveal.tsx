"use client";

import { Children, type ReactNode, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function StepReveal({
  children,
  staggerDelay = 0.2,
  className,
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const prefersReducedMotion = useReducedMotion();
  // Automation (screenshots, copy previews, e2e) must capture every step
  // settled, never a stagger frame. Keep the motion.div wrappers so the DOM
  // shape matches the server render; only the motion props change.
  const isAutomation = typeof navigator !== "undefined" && navigator.webdriver;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={isAutomation ? false : { opacity: 0, y: 20, scale: 0.95 }}
          animate={
            isInView || isAutomation
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 20, scale: 0.95 }
          }
          transition={
            isAutomation
              ? { duration: 0 }
              : { duration: 0.4, delay: i * staggerDelay, ease: "easeOut" }
          }
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
