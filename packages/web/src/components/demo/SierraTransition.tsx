"use client";

import { type Variants } from "framer-motion";
import { useSierraGame, type SierraAct } from "./SierraGameContext";

// ---------------------------------------------------------------------------
// Transition variants per act
// ---------------------------------------------------------------------------

type TransitionStyle =
  | "glitch"
  | "save-restore"
  | "room-slide"
  | "inventory-equip"
  | "dissolve"
  | "default";

const actToTransition: Record<SierraAct, TransitionStyle> = {
  I: "glitch",
  turn: "save-restore",
  "II-solution": "room-slide",
  "II-game": "room-slide",
  "II-money": "room-slide",
  "II-accountability": "room-slide",
  "II-armory": "inventory-equip",
  "II-climax": "dissolve",
  III: "dissolve",
};

// ---------------------------------------------------------------------------
// Framer Motion variant sets
// ---------------------------------------------------------------------------

const glitchVariants: Variants = {
  initial: {
    opacity: 0,
    filter: "brightness(3)",
    clipPath: "inset(0 0 0 0)",
  },
  animate: {
    opacity: 1,
    filter: "brightness(1)",
    clipPath: "inset(0 0 0 0)",
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    filter: "brightness(2)",
    clipPath: "inset(10% 0 20% 0)",
    transition: { duration: 0.2 },
  },
};

const saveRestoreVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    filter: "brightness(0)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "brightness(1)",
    transition: { duration: 1.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    filter: "brightness(2)",
    transition: { duration: 0.6 },
  },
};

const roomSlideVariants: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -60,
    transition: { duration: 0.25 },
  },
};

const inventoryEquipVariants: Variants = {
  initial: { opacity: 0, y: 80, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    y: -40,
    transition: { duration: 0.2 },
  },
};

const dissolveVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

const defaultVariants: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

const variantMap: Record<TransitionStyle, Variants> = {
  glitch: glitchVariants,
  "save-restore": saveRestoreVariants,
  "room-slide": roomSlideVariants,
  "inventory-equip": inventoryEquipVariants,
  dissolve: dissolveVariants,
  default: defaultVariants,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the Framer Motion variants for the current Sierra act.
 */
export function useSierraTransition(): Variants {
  const { state } = useSierraGame();

  const style = actToTransition[state.act] ?? "default";
  return variantMap[style];
}

export { defaultVariants };
