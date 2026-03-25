"use client"

import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import type { DashboardSocialAccount } from "@/types/dashboard"
import { FaGithub, FaXTwitter, FaDiscord, FaTelegram, FaEthereum } from "react-icons/fa6"
import { signIn } from "next-auth/react"
import type { ReactNode } from "react"

interface ConnectedAccountsCardProps {
  socialAccounts: DashboardSocialAccount[]
  onRefresh: () => void
}

interface PlatformRow {
  key: string
  label: string
  icon: ReactNode
  isWallet: boolean
}

const PLATFORMS: PlatformRow[] = [
  {
    key: "GITHUB",
    label: "GitHub",
    icon: <FaGithub className="h-6 w-6" />,
    isWallet: false,
  },
  {
    key: "TWITTER",
    label: "Twitter/X",
    icon: <FaXTwitter className="h-6 w-6 text-[#1DA1F2]" />,
    isWallet: false,
  },
  {
    key: "DISCORD",
    label: "Discord",
    icon: <FaDiscord className="h-6 w-6 text-[#5865F2]" />,
    isWallet: false,
  },
  {
    key: "TELEGRAM",
    label: "Telegram",
    icon: <FaTelegram className="h-6 w-6 text-[#0088CC]" />,
    isWallet: false,
  },
  {
    key: "ETHEREUM",
    label: "Ethereum",
    icon: <FaEthereum className="h-6 w-6 text-[#627EEA]" />,
    isWallet: true,
  },
  {
    key: "BASE",
    label: "Base",
    icon: <FaEthereum className="h-6 w-6 text-[#0052FF]" />,
    isWallet: true,
  },
]

export function ConnectedAccountsCard({ socialAccounts, onRefresh }: ConnectedAccountsCardProps) {
  const getAccount = (platform: string) =>
    socialAccounts.find((sa) => sa.platform === platform)

  const handleConnect = async (provider: string) => {
    await signIn(provider.toLowerCase(), { callbackUrl: "/dashboard" })
  }

  const handleDisconnect = async (platform: string) => {
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

  return (
    <Card className="border-4 border-primary">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">CONNECTED ACCOUNTS</Card.Title>
        <Card.Description className="font-bold">
          Link your accounts. Helps me verify you&apos;re real and not three bots in a trenchcoat
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {PLATFORMS.map((row) => {
            const account = getAccount(row.key)
            const displayValue = account
              ? row.isWallet
                ? account.walletAddress
                  ? `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}`
                  : "Connected"
                : account.username || "Connected"
              : "Not connected"

            return (
              <div key={row.key} className="flex items-center justify-between p-4 border-4 border-primary bg-background">
                <div className="flex items-center gap-3">
                  {row.icon}
                  <div>
                    <p className="font-black">{row.label}</p>
                    <p className="text-sm text-muted-foreground">{displayValue}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-4 border-primary bg-transparent"
                  onClick={() =>
                    account ? handleDisconnect(row.key) : handleConnect(row.key)
                  }
                >
                  {account ? "Disconnect" : "Connect"}
                </Button>
              </div>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}
