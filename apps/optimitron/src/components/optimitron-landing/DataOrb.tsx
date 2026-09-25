"use client";

import { useEffect, useRef } from "react";
import { useLiveMotion } from "./use-live-motion";

interface OrbNode {
  lat: number;
  lon: number;
  pulse: number;
  size: number;
  link: number;
}

interface Packet {
  from: OrbNode;
  to: OrbNode;
  progress: number;
}

const NODE_COUNT = 20;
const MAX_PACKETS = 5;

// Seeded so the still frame (screenshots, reduced motion) is identical on
// every render.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withAlpha(rgb: string, alpha: number): string {
  const channels = rgb.match(/\d+(\.\d+)?/g)?.slice(0, 3).join(",") ?? "0,0,0";
  return `rgba(${channels},${alpha})`;
}

/**
 * A wireframe globe of data sources passing packets to each other: the
 * cross-jurisdiction panel the generators learn from. Drawn in the current
 * text color, so it is black on white and white on black.
 */
export function DataOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useLiveMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const random = seededRandom(42);
    const nodes: OrbNode[] = Array.from({ length: NODE_COUNT }, () => ({
      lat: random() * Math.PI - Math.PI / 2,
      lon: random() * Math.PI * 2,
      pulse: random() * Math.PI * 2,
      size: random() * 1.6 + 1.2,
      link: random(),
    }));
    const packets: Packet[] = [];
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let size = 0;
    let time = 0;
    let frame = 0;

    const resize = () => {
      size = canvas.clientWidth || 180;
      canvas.width = size * pixelRatio;
      canvas.height = size * pixelRatio;
    };

    const draw = () => {
      const ink = getComputedStyle(canvas).color;
      const center = size / 2;
      const radius = size * 0.44;
      const project = (node: OrbNode) => {
        const lon = node.lon + time * 0.2;
        return {
          x: center + radius * Math.cos(node.lat) * Math.sin(lon),
          y: center + radius * Math.sin(node.lat),
          z: radius * Math.cos(node.lat) * Math.cos(lon),
        };
      };

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);

      context.strokeStyle = withAlpha(ink, 0.9);
      context.lineWidth = 1;
      context.beginPath();
      context.arc(center, center, radius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = withAlpha(ink, 0.28);
      context.lineWidth = 0.7;
      for (let meridian = 0; meridian < 12; meridian++) {
        context.beginPath();
        for (let step = 0; step <= 100; step++) {
          const lat = (step / 100) * Math.PI - Math.PI / 2;
          const lon = (meridian / 12) * Math.PI * 2 + time * 0.1;
          const z = radius * Math.cos(lat) * Math.cos(lon);
          if (z > 0 || step === 0) {
            context.lineTo(
              center + radius * Math.cos(lat) * Math.sin(lon),
              center + radius * Math.sin(lat),
            );
          }
        }
        context.stroke();
      }
      for (let parallel = 1; parallel < 4; parallel++) {
        const lat = (parallel / 4) * Math.PI - Math.PI / 2;
        const ringRadius = radius * Math.cos(lat);
        context.beginPath();
        context.ellipse(
          center,
          center + radius * Math.sin(lat),
          ringRadius,
          ringRadius * 0.18,
          0,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }

      nodes.forEach((node, index) => {
        const point = project(node);
        if (point.z <= 0) return;
        const pulse = (Math.sin(time * 3 + node.pulse) * 0.5 + 1) * node.size;
        context.fillStyle = ink;
        context.beginPath();
        context.arc(point.x, point.y, pulse, 0, Math.PI * 2);
        context.fill();

        nodes.forEach((other, otherIndex) => {
          if (index >= otherIndex) return;
          const otherPoint = project(other);
          if (otherPoint.z <= 0) return;
          const distance = Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y);
          if (distance >= size * 0.42) return;
          const strength = (node.link + other.link) / 2;
          const alpha = Math.max(
            0,
            (0.45 + Math.sin(time * 2) * 0.1 - distance / (size * 0.8)) * strength,
          );
          context.strokeStyle = withAlpha(ink, alpha);
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(otherPoint.x, otherPoint.y);
          context.stroke();
        });
      });

      for (let index = packets.length - 1; index >= 0; index--) {
        const packet = packets[index]!;
        packet.progress += 0.02;
        const from = project(packet.from);
        const to = project(packet.to);
        const x = from.x + (to.x - from.x) * packet.progress;
        const y = from.y + (to.y - from.y) * packet.progress;
        context.fillStyle = ink;
        context.beginPath();
        context.arc(x, y, 2.2, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = withAlpha(ink, 0.35);
        context.lineWidth = 1;
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.stroke();
        if (packet.progress >= 1) packets.splice(index, 1);
      }
    };

    const tick = () => {
      time += 0.02;
      if (Math.random() < 0.05 && packets.length < MAX_PACKETS) {
        const from = nodes[Math.floor(Math.random() * nodes.length)]!;
        const to = nodes[(nodes.indexOf(from) + 1 + Math.floor(Math.random() * (nodes.length - 1))) % nodes.length]!;
        packets.push({ from, to, progress: 0 });
      }
      draw();
      frame = requestAnimationFrame(tick);
    };

    const onResize = () => {
      resize();
      if (!live) draw();
    };

    resize();
    if (live) {
      frame = requestAnimationFrame(tick);
    } else {
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [live]);

  return (
    <canvas
      aria-hidden="true"
      className="block aspect-square w-full max-w-[200px] text-foreground"
      ref={canvasRef}
    />
  );
}
