"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardData } from "@/types/dashboard"
import { FaGoogle, FaGithub, FaXTwitter, FaDiscord } from "react-icons/fa6"
import { signIn } from "next-auth/react"
import { trackSocialAccountLinked } from "@/lib/analytics"
import { cn } from "@/lib/utils"

interface ConnectedAccountsCardProps {
  socialAccounts: DashboardData["socialAccounts"]
  enabledProviders: DashboardData["enabledProviders"]
  onRefresh: () => void
  className?: string
}

export function ConnectedAccountsCard({ socialAccounts, enabledProviders, onRefresh, className }: ConnectedAccountsCardProps) {
  const handleConnectSocial = async (provider: string) => {
    // Track social account linking intent
    const currentConnectedCount = Object.values(socialAccounts).filter(Boolean).length
    trackSocialAccountLinked({
      provider,
      totalConnected: currentConnectedCount + 1, // Optimistically track
    })
    await signIn(provider, { callbackUrl: "/dashboard" })
  }

  const handleDisconnectSocial = async (platform: string) => {
    try {
      const response = await fetch("/api/social-accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })

      if (response.ok) {
        onRefresh()
      } else {
        console.error("Failed to disconnect account")
      }
    } catch (error) {
      console.error("Error disconnecting account:", error)
    }
  }

  const rows = [
    {
      key: "google",
      label: "Google",
      icon: FaGoogle({ className: "h-6 w-6 text-[#4285F4]" }),
      enabled: enabledProviders.google,
      value: socialAccounts.google,
    },
    {
      key: "github",
      label: "GitHub",
      icon: FaGithub({ className: "h-6 w-6" }),
      enabled: enabledProviders.github,
      value: socialAccounts.github,
    },
    {
      key: "twitter",
      label: "Twitter/X",
      icon: FaXTwitter({ className: "h-6 w-6 text-[#1DA1F2]" }),
      enabled: enabledProviders.twitter,
      value: socialAccounts.twitter,
    },
    {
      key: "discord",
      label: "Discord",
      icon: FaDiscord({ className: "h-6 w-6 text-[#5865F2]" }),
      enabled: enabledProviders.discord,
      value: socialAccounts.discord,
    },
  ] as const

  const hasProviders = rows.some((row) => row.enabled)

  return (
    <Card className={cn("border-2 border-primary", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">CONNECTED ACCOUNTS</CardTitle>
        <CardDescription className="font-bold">
          Link multiple accounts for identity verification and earn the Social Warrior Service Medal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hasProviders ? (
            rows
              .filter((row) => row.enabled)
              .map((row) => (
                <div key={row.key} className="flex items-center justify-between p-4 border-2 border-primary bg-background">
                  <div className="flex items-center gap-3">
                    {row.icon}
                    <div>
                      <p className="font-black">{row.label}</p>
                      <p className="text-sm text-muted-foreground">{row.value || "Not connected"}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-2 border-primary bg-transparent"
                    onClick={() => (row.value ? handleDisconnectSocial(row.key) : handleConnectSocial(row.key))}
                  >
                    {row.value ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-primary bg-muted rounded-none">
              <p className="font-bold text-muted-foreground">
                No social providers configured. Add OAuth credentials to your .env file to enable social account linking.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

