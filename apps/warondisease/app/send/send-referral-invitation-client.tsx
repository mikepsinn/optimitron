"use client"

import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { AuthForm } from "@/components/auth/AuthForm"
import { ReferralSendLoop } from "@/components/landing/ReferralSendLoop"
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url"

export function SendReferralInvitationClient() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user
  const referralUrl = isAuthenticated ? buildUserReferralUrl(session.user, getBaseUrl()) : getBaseUrl()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="mb-2 text-3xl font-black uppercase">Send One More</h1>
        <p className="text-sm font-bold text-muted-foreground">
          The chain continues past round 2 only if someone keeps going.
        </p>
      </Card>

      {!isAuthenticated && (
        <Card className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-2 text-xl font-black uppercase">Verify to send tracked invites</h2>
          <AuthForm
            callbackUrl="/send"
            compact
            emailSuccessFooter="After verification, this page will let you send tracked invitations."
          />
        </Card>
      )}

      {isAuthenticated && (
        <ReferralSendLoop
          referralUrl={referralUrl}
          isAuthenticated={isAuthenticated}
          user={session?.user ?? null}
        />
      )}
    </div>
  )
}
