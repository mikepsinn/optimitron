"use client"

import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import type { DashboardSocialAccount } from "@/types/dashboard"
import { FaGithub, FaXTwitter, FaDiscord, FaTelegram, FaEthereum } from "react-icons/fa6"
import { signIn } from "next-auth/react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
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
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const getAccount = (platform: string) =>
    socialAccounts.find((sa) => sa.platform === platform)

  const handleConnectSocial = async (provider: string) => {
    await signIn(provider.toLowerCase(), { callbackUrl: "/dashboard" })
  }

  const handleConnectWallet = async (platform: string) => {
    const connector = connectors[0]
    if (!connector) return

    connect(
      { connector },
      {
        onSuccess: async (data) => {
          const walletAddress = data.accounts[0]
          if (!walletAddress) return

          try {
            await fetch("/api/social-accounts/connect-wallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ platform, walletAddress }),
            })
            onRefresh()
          } catch (error) {
            console.error("Failed to save wallet connection:", error)
          }
        },
      },
    )
  }

  const handleDisconnect = async (platform: string, isWallet: boolean) => {
    try {
      const response = await fetch("/api/social-accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })

      if (response.ok) {
        if (isWallet && isConnected) {
          disconnect()
        }
        onRefresh()
      } else {
        console.error("Failed to disconnect account")
      }
    } catch (error) {
      console.error("Error disconnecting account:", error)
    }
  }

  const getWalletDisplayValue = (row: PlatformRow) => {
    const account = getAccount(row.key)
    if (account?.walletAddress) {
      return `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}`
    }
    if (isConnected && address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return "Not connected"
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
            const isWalletConnected = row.isWallet && (!!account || (isConnected && !!address))
            const isSocialConnected = !row.isWallet && !!account

            const displayValue = row.isWallet
              ? getWalletDisplayValue(row)
              : account
                ? account.username || "Connected"
                : "Not connected"

            const connected = isWalletConnected || isSocialConnected

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
                  onClick={() => {
                    if (connected) {
                      void handleDisconnect(row.key, row.isWallet)
                    } else if (row.isWallet) {
                      void handleConnectWallet(row.key)
                    } else {
                      void handleConnectSocial(row.key)
                    }
                  }}
                >
                  {connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}
