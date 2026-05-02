"use client"

import { Card } from "@/components/retroui/Card"
import { ReferralLinkEditor } from "@/components/dashboard/ReferralLinkEditor"
import type { DashboardUser } from "@/types/dashboard"

interface ReferralLinkCardProps {
  user: DashboardUser
  baseUrl: string
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
  className?: string
  id?: string
}

export function ReferralLinkCard({
  user,
  baseUrl,
  onUserChange,
  onRefresh,
  className = "",
  id,
}: ReferralLinkCardProps) {
  return (
    <Card
      className={`border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-5 text-[var(--treaty-ink)] shadow-none ${className}`}
      id={id}
    >
      <ReferralLinkEditor
        user={user}
        baseUrl={baseUrl}
        onUserChange={onUserChange}
        onRefresh={onRefresh}
        variant="treaty"
        title="Your voting link"
        description="Make it readable. Copy it. Send it to one human."
      />
    </Card>
  )
}
