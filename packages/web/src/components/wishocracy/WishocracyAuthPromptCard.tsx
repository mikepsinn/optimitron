"use client"

import { RefObject } from "react"

interface WishocracyAuthPromptCardProps {
  show: boolean
  isAuthenticated: boolean
  comparisonsCount: number
  referralCode: string | null
  authCardRef: RefObject<HTMLDivElement>
  onDismiss: () => void
}

// Auth disabled — this component renders nothing
export function WishocracyAuthPromptCard(_props: WishocracyAuthPromptCardProps) {
  return null
}
