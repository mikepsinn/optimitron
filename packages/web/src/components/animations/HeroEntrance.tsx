"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function HeroEntrance({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const items = Children.toArray(children);

  return (
    <>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: i * 0.15,
            ease: "easeOut",
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}
