"use client"

import dynamic from "next/dynamic"

const WishocracySection = dynamic(
  () => import("@/components/wishocracy/wishocracy-section"),
  { ssr: false }
)

export default function VotePage() {
  return (
    <main>
      <WishocracySection />
    </main>
  )
}
