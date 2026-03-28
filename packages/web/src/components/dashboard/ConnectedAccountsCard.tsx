"use client"

import { Button } from "@/components/retroui/Button"
import { Card } from "@/components/retroui/Card"
import { WorldIdVerificationInline } from "@/components/personhood/WorldIdVerificationInline"
import {
  getVisibleConnectedAccountPlatforms,
  getVisibleIdentityAuthProviderIds,
  type IdentityAuthProviderId,
} from "@/lib/connected-accounts"
import type { DashboardSocialAccount } from "@/types/dashboard"
import { FaDiscord, FaEthereum, FaGithub, FaGoogle, FaTelegram, FaXTwitter } from "react-icons/fa6"
import { signIn } from "next-auth/react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import type { ReactNode } from "react"

interface ConnectedAccountsCardProps {
  availableAuthProviderIds: string[]
  linkedAuthProviderIds: string[]
  socialAccounts: DashboardSocialAccount[]
  onRefresh: () => void
}

interface AuthProviderRow {
  id: IdentityAuthProviderId
  label: string
  icon: ReactNode
}

interface PlatformRow {
  key: string
  label: string
  icon: ReactNode
  isWallet: boolean
}

const AUTH_PROVIDERS: AuthProviderRow[] = [
  {
    id: "google",
    label: "Google",
    icon: <FaGoogle className="h-6 w-6 text-[#4285F4]" />,
  },
]

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

export function ConnectedAccountsCard({
  availableAuthProviderIds,
  linkedAuthProviderIds,
  socialAccounts,
  onRefresh,
}: ConnectedAccountsCardProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const linkedAuthProviderIdSet = new Set(
    linkedAuthProviderIds.map((providerId) => providerId.toLowerCase()),
  )
  const visibleAuthProviderIds = getVisibleIdentityAuthProviderIds(
    availableAuthProviderIds,
    linkedAuthProviderIds,
  )
  const visibleAuthProviders = AUTH_PROVIDERS.filter((provider) =>
    visibleAuthProviderIds.includes(provider.id),
  )
  const visiblePlatforms = getVisibleConnectedAccountPlatforms(
    PLATFORMS,
    socialAccounts,
    availableAuthProviderIds,
  )

  const getAccount = (platform: string) =>
    socialAccounts.find((sa) => sa.platform === platform)

  const handleConnectSocial = async (provider: string) => {
    await signIn(provider.toLowerCase(), { callbackUrl: "/profile" })
  }

  const handleDisconnectAuth = async (providerId: string) => {
    try {
      const response = await fetch("/api/social-accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: providerId.toUpperCase() }),
      })

      if (response.ok) {
        onRefresh()
      } else {
        console.error("Failed to disconnect auth provider")
      }
    } catch (error) {
      console.error("Error disconnecting auth provider:", error)
    }
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

  const renderConnectionRow = ({
    buttonLabel,
    icon,
    key,
    label,
    onClick,
    value,
  }: {
    buttonLabel: string
    icon: ReactNode
    key: string
    label: string
    onClick: () => void
    value: string
  }) => (
    <div
      key={key}
      className="flex items-center justify-between gap-4 border-4 border-primary bg-background p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <p className="font-black">{label}</p>
          <p className="truncate text-sm text-muted-foreground">{value}</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="border-4 border-primary bg-transparent"
        onClick={onClick}
      >
        {buttonLabel}
      </Button>
    </div>
  )

  return (
    <Card className="border-4 border-primary">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">CONNECTED ACCOUNTS</Card.Title>
        <Card.Description className="font-bold">
          Link your sign-in, wallet, and proof-of-personhood signals. Helps me verify
          you&apos;re real and not three bots in a trenchcoat
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-6">
        {visibleAuthProviders.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Sign-In
            </p>
            {visibleAuthProviders.map((provider) => {
              const connected = linkedAuthProviderIdSet.has(provider.id)

              return renderConnectionRow({
                buttonLabel: connected ? "Disconnect" : "Connect",
                icon: provider.icon,
                key: provider.id,
                label: provider.label,
                onClick: () => {
                  if (connected) {
                    void handleDisconnectAuth(provider.id)
                  } else {
                    void handleConnectSocial(provider.id)
                  }
                },
                value: connected ? "Connected for sign-in" : "Not connected",
              })
            })}
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Social And Wallet
          </p>
          {visiblePlatforms.map((row) => {
            const account = getAccount(row.key)
            const isWalletConnected = row.isWallet && (!!account || (isConnected && !!address))
            const isSocialConnected = !row.isWallet && !!account

            const displayValue = row.isWallet
              ? getWalletDisplayValue(row)
              : account
                ? account.username || "Connected"
                : "Not connected"

            const connected = isWalletConnected || isSocialConnected

            return renderConnectionRow({
              buttonLabel: connected ? "Disconnect" : "Connect",
              icon: row.icon,
              key: row.key,
              label: row.label,
              onClick: () => {
                if (connected) {
                  void handleDisconnect(row.key, row.isWallet)
                } else if (row.isWallet) {
                  void handleConnectWallet(row.key)
                } else {
                  void handleConnectSocial(row.key)
                }
              },
              value: displayValue,
            })
          })}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Proof Of Personhood
          </p>
          <WorldIdVerificationInline />
        </div>
      </Card.Content>
    </Card>
  )
}
