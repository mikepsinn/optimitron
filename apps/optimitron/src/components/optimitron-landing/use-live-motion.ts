"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * True when the landing page may animate: after hydration, without a
 * reduced-motion preference, and outside browser automation.
 *
 * Screenshots and copy previews run under `navigator.webdriver` and need the
 * settled final frame. Visual capture zeroes CSS animation durations, but it
 * cannot stop timers, `requestAnimationFrame` loops, or SVG `<animate>`
 * elements, so every animated tile checks this hook and renders its final
 * state instead. Lazy state (not an effect) so the value is already correct
 * on the first client render.
 */
export function useLiveMotion(): boolean {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion();
  const [isAutomation] = useState(
    () => typeof navigator !== "undefined" && navigator.webdriver === true,
  );
  return hydrated && !prefersReducedMotion && !isAutomation;
}
