"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { ReferralLinkEditorCard } from "@/components/dashboard/ReferralLinkEditor"
import type { SiteUserFraming } from "@/lib/site"
import type { DashboardUser } from "@/types/dashboard"

const STORAGE_KEY = "referralLinkBannerDismissed"
const LEGACY_STORAGE_KEY = "playerNameBannerDismissed"

interface ReferralLinkBannerProps {
  user: DashboardUser
  referralLink: string
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
  className?: string
  dismissible?: boolean
  userFraming?: SiteUserFraming
  variant?: "default" | "treaty"
}

function getBaseUrlFromReferralLink(referralLink: string) {
  try {
    return new URL(referralLink).origin
  } catch {
    const marker = "/vote/"
    const markerIndex = referralLink.indexOf(marker)
    return markerIndex >= 0 ? referralLink.slice(0, markerIndex) : referralLink
  }
}

export function ReferralLinkBanner({
  user,
  referralLink,
  onUserChange,
  onRefresh,
  className,
  dismissible = true,
  variant = "default",
}: ReferralLinkBannerProps) {
  const [dismissed, setDismissed] = useState(dismissible)

  useEffect(() => {
    if (!dismissible) return
    const wasDismissed =
      localStorage.getItem(STORAGE_KEY) === "true" ||
      localStorage.getItem(LEGACY_STORAGE_KEY) === "true"
    if (wasDismissed) {
      localStorage.setItem(STORAGE_KEY, "true")
    }
    setDismissed(wasDismissed)
  }, [dismissible])

  if (dismissible && dismissed) return null

  return (
    <div className="relative">
      {dismissible ? (
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "true")
            localStorage.removeItem(LEGACY_STORAGE_KEY)
            setDismissed(true)
          }}
          className="absolute right-3 top-3 z-10 rounded-sm p-1 transition-colors hover:bg-foreground/10"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5 stroke-[3px]" />
        </button>
      ) : null}
      <ReferralLinkEditorCard
        user={user}
        baseUrl={getBaseUrlFromReferralLink(referralLink)}
        onUserChange={onUserChange}
        onRefresh={onRefresh}
        variant={variant}
        cardClassName={className}
      />
    </div>
  )
}
