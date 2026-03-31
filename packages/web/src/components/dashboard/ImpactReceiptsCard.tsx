"use client"

import Link from "next/link"
import { Card } from "@/components/retroui/Card"
import { ScrollText, ExternalLink } from "lucide-react"
import type { DashboardImpactReceipts, DashboardImpactReceipt } from "@/types/dashboard"

interface ImpactReceiptsCardProps {
  receipts: DashboardImpactReceipts
}

const STATUS_STYLES: Record<DashboardImpactReceipt["statusTone"], string> = {
  success: "bg-brutal-cyan text-brutal-cyan-foreground",
  accent: "bg-brutal-yellow text-brutal-yellow-foreground",
  muted: "bg-muted text-foreground",
}

export function ImpactReceiptsCard({ receipts }: ImpactReceiptsCardProps) {
  const hasReceipts = receipts.items.length > 0
  const walletLabel =
    receipts.walletCount > 0
      ? `On-chain PRIZE deposits are scanned from ${receipts.walletCount} known wallet${receipts.walletCount === 1 ? "" : "s"} and cached for a few minutes.`
      : "Link a wallet, or cast a verified vote from the same wallet you use for the PRIZE, so on-chain receipts can be discovered automatically."

  return (
    <Card className="border-4 border-primary mt-8 bg-background">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          IMPACT RECEIPTS
        </Card.Title>
        <Card.Description className="font-bold text-foreground">
          Derived from verified personhood, referral impact, and on-chain PRIZE deposits. Hypercert publication can sit on top of this later without becoming the source of truth.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        {hasReceipts ? (
          <div className="space-y-3">
            {receipts.items.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} />
            ))}
          </div>
        ) : (
          <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black uppercase text-sm mb-2">No receipts yet</p>
            <p className="font-bold text-sm text-muted-foreground">
              Verify personhood, recruit a voter, or make a PRIZE deposit and the first receipt will appear here.
            </p>
          </div>
        )}

        <p className="text-xs font-bold uppercase text-muted-foreground">
          {walletLabel}
        </p>
      </Card.Content>
    </Card>
  )
}

function ReceiptRow({ receipt }: { receipt: DashboardImpactReceipt }) {
  const content = (
    <div className="border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">
            {receipt.icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black uppercase">{receipt.title}</p>
              <span className={`border-2 border-primary px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLES[receipt.statusTone]}`}>
                {receipt.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {receipt.description}
            </p>
            {receipt.timeLabel ? (
              <p className="mt-2 text-xs font-black uppercase text-primary">
                {receipt.timeLabel}
              </p>
            ) : null}
          </div>
        </div>
        {receipt.href ? (
          <span className="flex-shrink-0 text-primary">
            <ExternalLink className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </div>
  )

  if (!receipt.href) {
    return content
  }

  if (receipt.external) {
    return (
      <a href={receipt.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  if (receipt.href.startsWith("#")) {
    return <a href={receipt.href}>{content}</a>
  }

  return <Link href={receipt.href}>{content}</Link>
}
