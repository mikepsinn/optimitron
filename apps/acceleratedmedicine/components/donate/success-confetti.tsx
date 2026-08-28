"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"

/** Fires the celebration once on mount; purely decorative. */
export function SuccessConfetti() {
  useEffect(() => {
    const end = Date.now() + 3000
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FF6B9D", "#00D4FF", "#FFE66D"],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FF6B9D", "#00D4FF", "#FFE66D"],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  return null
}
