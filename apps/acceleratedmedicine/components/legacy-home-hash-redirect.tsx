"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { getLegacyHomeHashRedirect } from "@/lib/legacy-home-hash"

/** Keeps old `/#section` links working after the homepage change. */
export function LegacyHomeHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const target = getLegacyHomeHashRedirect(
      window.location.hash,
      (id) => document.getElementById(id) !== null,
    )
    if (target) router.replace(target)
  }, [router])

  return null
}
