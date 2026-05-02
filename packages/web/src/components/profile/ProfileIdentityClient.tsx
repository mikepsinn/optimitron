"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArcadeTag } from "@/components/ui/arcade-tag"
import { ReferralLinkBanner } from "@/components/dashboard/ReferralLinkBanner"
import { ProfileCard } from "@/components/dashboard/ProfileCard"
import { ConnectedAccountsCard } from "@/components/dashboard/ConnectedAccountsCard"
import { EmailSignatureCard } from "@/components/dashboard/EmailSignatureCard"
import { WorldIdVerificationCard } from "@/components/personhood/WorldIdVerificationCard"
import { buildUserReferralUrl } from "@/lib/url"
import type { DashboardUser, DashboardSocialAccount } from "@/types/dashboard"

interface ProfileIdentityClientProps {
  initialUser: DashboardUser
  socialAccounts: DashboardSocialAccount[]
  availableAuthProviderIds: string[]
  linkedAuthProviderIds: string[]
}

export function ProfileIdentityClient({
  initialUser,
  socialAccounts,
  availableAuthProviderIds,
  linkedAuthProviderIds,
}: ProfileIdentityClientProps) {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [user, setUser] = useState(initialUser)
  const referralLink = buildUserReferralUrl(user)

  const refreshPage = () => {
    void updateSession()
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <ArcadeTag>Identity</ArcadeTag>
        <h1 className="text-4xl sm:text-5xl font-black uppercase mb-2">
          YOUR <span className="text-brutal-pink">PROFILE</span>
        </h1>
        <p className="text-base font-bold text-muted-foreground">
          Tell the system who you are. Name, face, connected accounts, and the signature you
          leave on every email.
        </p>
      </div>

      <div className="space-y-8">
        <ReferralLinkBanner
          user={user}
          referralLink={referralLink}
          onUserChange={setUser}
          onRefresh={refreshPage}
        />

        <ProfileCard user={user} onUserChange={setUser} onRefresh={refreshPage} />

        <ConnectedAccountsCard
          availableAuthProviderIds={availableAuthProviderIds}
          linkedAuthProviderIds={linkedAuthProviderIds}
          socialAccounts={socialAccounts}
          onRefresh={refreshPage}
        />

        <WorldIdVerificationCard show />

        <EmailSignatureCard referralLink={referralLink} userName={user.name} />
      </div>
    </div>
  )
}
