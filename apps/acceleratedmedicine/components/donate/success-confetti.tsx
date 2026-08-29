"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"

/** Fires the celebration once on mount; purely decorative. */
export function SuccessConfetti() {
  useEffect(() => {
    let stopped = false
    const settleForVisualCapture = () => {
      stopped = true
      confetti.reset()
    }
    window.addEventListener(
      "optimitron:visual-capture",
      settleForVisualCapture,
    )
    const end = Date.now() + 3000
    const frame = () => {
      if (stopped) return
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
      if (!stopped && Date.now() < end) requestAnimationFrame(frame)
    }
    frame()

    return () => {
      window.removeEventListener(
        "optimitron:visual-capture",
        settleForVisualCapture,
      )
      confetti.reset()
    }
  }, [])

  return null
}
