"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Target, Check, Clock, X as XIcon, Send, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardReferralInvitation } from "@/types/dashboard"
import { createLogger } from "@/lib/logger"

const log = createLogger("referral-invitations-card")

interface ReferralInvitationsCardProps {
  invitations: DashboardReferralInvitation[]
  referralLink: string
  frameless?: boolean
  className?: string
}

const statusStyles: Record<
  DashboardReferralInvitation["status"],
  { bg: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { bg: "bg-background", label: "Pending", icon: Clock },
  REMINDED: { bg: "bg-brutal-yellow", label: "Reminded", icon: Send },
  VOTED: { bg: "bg-brutal-cyan", label: "Voted", icon: Check },
  DECLINED: { bg: "bg-brutal-pink", label: "Declined", icon: XIcon },
}

/**
 * Lists the user's directed referral invitations, with reminder copy and status buttons.
 */
export function ReferralInvitationsCard({
  invitations,
  referralLink,
  frameless = false,
  className,
}: ReferralInvitationsCardProps) {
  const router = useRouter()
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const votedCount = invitations.filter((c) => c.status === "VOTED").length
  const pendingCount = invitations.filter(
    (c) => c.status === "PENDING" || c.status === "REMINDED"
  ).length
  const totalCount = invitations.length

  const updateStatus = async (id: string, status: DashboardReferralInvitation["status"]) => {
    setWorkingId(id)
    try {
      await fetch("/api/referral-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      router.refresh()
    } catch (err) {
      log.error("Failed to update referral invitation", { error: err })
    } finally {
      setWorkingId(null)
    }
  }

  const copyReminder = async (invitation: DashboardReferralInvitation) => {
    const firstName = invitation.recipientName.split(" ")[0]
    const msg = `Hey ${firstName} - quick reminder, did you get a chance to vote for the 1% Treaty yet? Here's my link: ${invitation.referralUrl || referralLink}`
    try {
      await navigator.clipboard.writeText(msg)
      setCopiedId(invitation.id)
      setTimeout(() => setCopiedId(null), 2000)
      // Mark as reminded in the background (non-blocking)
      if (invitation.status === "PENDING") {
        updateStatus(invitation.id, "REMINDED")
      }
    } catch {
      // clipboard blocked — silent fail is fine, user can still update status manually
    }
  }

  const content = (
    <>
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border-4 border-primary bg-brutal-cyan p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-2xl sm:text-3xl font-black">{votedCount}</div>
          <div className="text-[10px] sm:text-xs font-black uppercase">Voted</div>
        </div>
        <div className="border-4 border-primary bg-brutal-yellow p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-2xl sm:text-3xl font-black">{pendingCount}</div>
          <div className="text-[10px] sm:text-xs font-black uppercase">Pending</div>
        </div>
        <div className="border-4 border-primary bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="text-2xl sm:text-3xl font-black">{totalCount}</div>
          <div className="text-[10px] sm:text-xs font-black uppercase">Total</div>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="border-4 border-dashed border-primary bg-background p-6 text-center">
          <p className="font-bold text-sm">
            You haven&apos;t invited anyone yet. Send one invitation and it appears here with nudge buttons.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((c) => {
            const style = statusStyles[c.status]
            const StatusIcon = style.icon
            const working = workingId === c.id
            const copied = copiedId === c.id
            return (
              <div
                key={c.id}
                className={cn(
                  "border-4 border-primary p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  style.bg
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-black text-base sm:text-lg truncate">
                      {c.recipientName}
                    </div>
                    <div className="inline-flex items-center gap-1 border-2 border-primary bg-background px-2 py-0.5 text-[10px] font-black uppercase shrink-0">
                      <StatusIcon className="w-3 h-3" />
                      {style.label}
                    </div>
                  </div>
                  {c.inviteeContact && (
                    <div className="text-xs font-bold font-mono text-muted-foreground truncate max-w-[200px]">
                      {c.inviteeContact}
                    </div>
                  )}
                </div>
                {c.status !== "VOTED" && c.status !== "DECLINED" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => copyReminder(c)}
                      disabled={working}
                      size="sm"
                      className="bg-foreground text-background border-4 border-primary font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copied ? "Copied!" : "Copy reminder"}
                    </Button>
                    <Button
                      onClick={() => updateStatus(c.id, "VOTED")}
                      disabled={working}
                      size="sm"
                      variant="outline"
                      className="bg-background border-4 border-primary font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Voted
                    </Button>
                    <Button
                      onClick={() => updateStatus(c.id, "DECLINED")}
                      disabled={working}
                      size="sm"
                      variant="outline"
                      className="bg-background border-4 border-primary font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <XIcon className="w-3 h-3 mr-1" />
                      Give up
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  if (frameless) {
    return <div className={cn("space-y-0", className)}>{content}</div>
  }

  return (
    <Card
      className={cn(
        "bg-background border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brutal-yellow border-4 border-primary w-12 h-12 flex items-center justify-center">
          <Target className="w-6 h-6 stroke-[3px]" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase">Your Invitations</h2>
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">
            People you invited — pending, reminded, and confirmed.
          </p>
        </div>
      </div>
      {content}
    </Card>
  )
}
