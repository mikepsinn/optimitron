"use client"

import { Card } from "@/components/retroui/Card"
import { SocialShareButtons } from "@/components/sharing/social-share-buttons"
import { REFERRAL } from "@/lib/messaging"

interface ReferralLinkCardProps {
  referralLink: string
  className?: string
  id?: string
}

export function ReferralLinkCard({
  referralLink,
  className = "",
  id,
}: ReferralLinkCardProps) {
  return (
    <Card
      className={`border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-5 text-[var(--treaty-ink)] shadow-none ${className}`}
      id={id}
    >
      <h3 className="mb-3 text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">
        Now Get All Your Friends to Play!
      </h3>
      <p className="mb-4 text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
        {REFERRAL.earnOne}
      </p>

      <SocialShareButtons
        url={referralLink}
        text="Help optimize Earth. Every vote counts toward the tipping point."
      />
    </Card>
  )
}
