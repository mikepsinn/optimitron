"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  scale: number;
  opacity: number;
  rotation: number;
  vx: number;
  vy: number;
}

interface ParticleEmitterProps {
  emoji?: string | string[];
  rate?: number; // particles per second
  lifetime?: number; // ms
  direction?: "up" | "down" | "left" | "right" | "radial" | "fall";
  speed?: number;
  spread?: number; // degrees
  className?: string;
  active?: boolean;
  burst?: number; // emit this many immediately
  gravity?: number;
  fadeOut?: boolean;
  shrink?: boolean;
  rotate?: boolean;
}

export function ParticleEmitter({
  emoji = "⭐",
  rate = 5,
  lifetime = 2000,
  direction = "up",
  speed = 50,
  spread = 45,
  className,
  active = true,
  burst,
  gravity = 0,
  fadeOut = true,
  shrink = true,
  rotate = false,
}: ParticleEmitterProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [nextId, setNextId] = useState(0);

  const getEmoji = useCallback(() => {
    if (Array.isArray(emoji)) {
      return emoji[Math.floor(Math.random() * emoji.length)];
    }
    return emoji;
  }, [emoji]);

  const createParticle = useCallback((x?: number, y?: number): Particle => {
    const baseAngle = {
      up: -90,
      down: 90,
      left: 180,
      right: 0,
      radial: Math.random() * 360,
      fall: 90 + (Math.random() - 0.5) * 30,
    }[direction];

    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const rad = (angle * Math.PI) / 180;
    const v = speed * (0.5 + Math.random() * 0.5);

    return {
      id: nextId,
      x: x ?? 50,
      y: y ?? 50,
      emoji: getEmoji(),
      scale: 0.5 + Math.random() * 0.5,
      opacity: 1,
      rotation: Math.random() * 360,
      vx: Math.cos(rad) * v,
      vy: Math.sin(rad) * v,
    };
  }, [direction, spread, speed, nextId, getEmoji]);

  // Burst effect
  useEffect(() => {
    if (burst && active) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < burst; i++) {
        newParticles.push({
          ...createParticle(),
          id: nextId + i,
        });
      }
      setParticles((prev) => [...prev, ...newParticles]);
      setNextId((prev) => prev + burst);
    }
  }, [burst, active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Continuous emission
  useEffect(() => {
    if (!active || rate <= 0) return;

    const interval = setInterval(() => {
      setParticles((prev) => [...prev, createParticle()]);
      setNextId((prev) => prev + 1);
    }, 1000 / rate);

    return () => clearInterval(interval);
  }, [active, rate, createParticle]);

  // Animation loop
  useEffect(() => {
    const startTimes = new Map<number, number>();
    
    const animate = () => {
      const now = performance.now();

      setParticles((prev) =>
        prev
          .map((p) => {
            if (!startTimes.has(p.id)) {
              startTimes.set(p.id, now);
            }
            const elapsed = now - (startTimes.get(p.id) || now);
            const progress = elapsed / lifetime;

            if (progress >= 1) return null;

            return {
              ...p,
              x: p.x + p.vx * 0.016, // ~60fps
              y: p.y + p.vy * 0.016 + gravity * 0.016,
              vy: p.vy + gravity * 0.5,
              opacity: fadeOut ? 1 - progress : 1,
              scale: shrink ? p.scale * (1 - progress * 0.5) : p.scale,
              rotation: rotate ? p.rotation + 5 : p.rotation,
            };
          })
          .filter(Boolean) as Particle[]
      );
    };

    const frame = setInterval(animate, 16);
    return () => clearInterval(frame);
  }, [lifetime, gravity, fadeOut, shrink, rotate]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transition-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            fontSize: "1.5rem",
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
