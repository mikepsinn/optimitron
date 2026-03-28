"use client"

import Link from "next/link"
import { Card } from "@/components/retroui/Card"
import { CopyLinkButton } from "@/components/sharing/copy-link-button"
import { SocialShareButtons } from "@/components/sharing/social-share-buttons"
import { ROUTES } from "@/lib/routes"

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
      <h3 className="text-2xl sm:text-3xl font-black uppercase text-center mb-3">
        Now Get All Your Friends to Play!
      </h3>
      <p className="font-bold text-base sm:text-lg text-center mb-4">
        Every friend you get to help Optimize Earth earns 1 VOTE point!
      </p>

      <div className="mb-2">
        <CopyLinkButton url={referralLink} variant="landing" />
      </div>

      <SocialShareButtons
        url={referralLink}
        text="Help optimize Earth. Every vote counts toward the tipping point."
      />

      <div className="mt-6 text-center">
        <Link
          href={ROUTES.dashboard}
          className="text-sm font-black uppercase text-foreground hover:text-brutal-pink transition-colors"
        >
          Go to Dashboard &rarr;
        </Link>
      </div>
    </Card>
  )
}
