"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { DEATHS_PER_SECOND } from "@/lib/collapse-projections";

interface Skull {
  id: number;
  x: number;
  delay: number;
  size: number;
}

/**
 * Real-time counter: "X people died while you read this section"
 */
export function DeathsSinceViewing({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  const [count, setCount] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) {
      start.current = null;
      setCount(0);
      return;
    }
    start.current = Date.now();
    const interval = setInterval(() => {
      if (start.current) {
        setCount(Math.floor(((Date.now() - start.current) / 1000) * DEATHS_PER_SECOND));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isInView]);

  if (count <= 0) return <div ref={ref} className={className} />;

  return (
    <div ref={ref} className={className}>
      <p className="text-sm font-black text-brutal-red uppercase text-center">
        {count.toLocaleString()} people died while you read this section
      </p>
    </div>
  );
}

/**
 * Falling skull rain — 💀 emojis drift down from the top of the container
 * while the section is in view.
 */
export function SkullRain({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [skulls, setSkulls] = useState<Skull[]>([]);
  const nextId = useRef(0);

  const addSkull = useCallback(() => {
    const skull: Skull = {
      id: nextId.current++,
      x: Math.random() * 96 + 2, // 2-98% to avoid edge clipping
      delay: Math.random() * 0.5,
      size: 1.2 + Math.random() * 1.4, // 1.2-2.6rem
    };
    setSkulls((prev) => {
      // Cap at 150 to prevent DOM bloat — remove oldest
      const next = [...prev, skull];
      return next.length > 150 ? next.slice(next.length - 150) : next;
    });
  }, []);

  // Emit skulls while in view
  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    // ~3 skulls/second (each represents ~50 deaths at 150K/day rate)
    const interval = setInterval(addSkull, 330);
    return () => clearInterval(interval);
  }, [isInView, prefersReducedMotion, addSkull]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div ref={ref} className={className}>
      {/* Falling skulls */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {skulls.map((skull) => (
          <span
            key={skull.id}
            className="absolute animate-[skull-fall_8s_linear_forwards]"
            style={{
              left: `${skull.x}%`,
              top: "-2rem",
              animationDelay: `${skull.delay}s`,
              fontSize: `${skull.size}rem`,
              opacity: 0.15,
            }}
          >
            💀
          </span>
        ))}
      </div>

      {/* Fog at the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--foreground)) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
