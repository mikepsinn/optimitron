"use client"

import { useEffect } from "react"

/** Opens the question a link points at (/faq#trials-randomized), since some browsers leave it closed. */
export function OpenFaqFromHash() {
  useEffect(() => {
    const open = () => {
      const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      if (target instanceof HTMLDetailsElement && !target.open) {
        target.open = true
        target.scrollIntoView({ block: "start" })
      }
    }
    open()
    window.addEventListener("hashchange", open)
    return () => window.removeEventListener("hashchange", open)
  }, [])
  return null
}
