"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: string;
}

const STAR_COUNT = 130;
const STAR_COLORS = ["#f2e8d2", "#f2e8d2", "#f2e8d2", "#57d7f2", "#f2b53c"];

/**
 * Performance-cheap starfield for the hero only: one canvas, ~130 stars,
 * opacity twinkle on requestAnimationFrame. Pauses on hidden tabs and
 * renders a single static frame under prefers-reduced-motion.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let stars: Star[] = [];
    let raf = 0;
    let running = true;

    const seed = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.85 ? Math.random() * 1.1 + 0.3 : Math.random() * 1.8 + 1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.1,
        color: STAR_COLORS[i % STAR_COLORS.length] ?? "#f2e8d2",
      }));
    };

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const alpha = reducedMotion
          ? 0.55
          : 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(s.phase + (t / 1000) * s.speed));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    seed();
    if (reducedMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      seed();
      if (reducedMotion) draw(0);
    };

    const onVisibility = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas aria-hidden="true" className="er-hero-canvas" ref={canvasRef} />;
}
