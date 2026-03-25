"use client"

import { Card } from "@/components/retroui/Card"
import { CopyLinkButton } from "@/components/sharing/copy-link-button"
import { SocialShareButtons } from "@/components/sharing/social-share-buttons"

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
      className={`bg-background border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}
      id={id}
    >
      <p className="font-bold text-base sm:text-lg text-center mb-2">
        Your referral code. Every verified voter you recruit earns you 1 VOTE point.
      </p>

      <div className="mb-2">
        <CopyLinkButton url={referralLink} variant="landing" />
      </div>

      <SocialShareButtons
        url={referralLink}
        text="Help optimize Earth. Every vote counts toward the tipping point."
      />
    </Card>
  )
}
