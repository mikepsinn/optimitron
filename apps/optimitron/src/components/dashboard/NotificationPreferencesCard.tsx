"use client"

import { Card } from "@/components/retroui/Card"
import { Accordion } from "@/components/retroui/Accordion"
import { Checkbox } from "@/components/retroui/Checkbox"
import { Label } from "@/components/retroui/Label"
import type { DashboardNotificationPreference } from "@/types/dashboard"
import { useState } from "react"

type NotificationType = {
  type: string
  label: string
  description: string
}

const CAMPAIGN_NOTIFICATION_TYPES = [
  { type: "REFERRAL_SIGNUP", label: "Referral Sign-ups", description: "When someone you referred joins" },
  { type: "REFERENDUM_MILESTONE", label: "Referendum Milestones", description: "Progress updates on referendums" },
  { type: "SURVEY_INVITE", label: "Survey Invites", description: "Invitations to participate in surveys" },
] as const satisfies readonly NotificationType[]

const MORE_NOTIFICATION_TYPES = [
  { type: "DAILY_CHECKIN_REMINDER", label: "Daily Check-in", description: "Reminder to log your measurements" },
  { type: "ORGANIZATION_INVITE", label: "Organization Invites", description: "Invitations to join organizations" },
  { type: "SYSTEM_ANNOUNCEMENT", label: "System Announcements", description: "Platform updates and news" },
  { type: "BADGE_EARNED", label: "Badge Earned", description: "When you earn a new badge" },
  { type: "DEPOSIT_CONFIRMED", label: "Deposit Confirmed", description: "When your prize deposit is confirmed" },
] as const satisfies readonly NotificationType[]

const CHANNELS = [
  { channel: "EMAIL", label: "Email" },
  { channel: "IN_APP", label: "In-App" },
  { channel: "PUSH", label: "Push" },
] as const

interface NotificationPreferencesCardProps {
  preferences: DashboardNotificationPreference[]
  onRefresh: () => void
}

export function NotificationPreferencesCard({ preferences, onRefresh }: NotificationPreferencesCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const isEnabled = (type: string, channel: string): boolean => {
    const pref = preferences.find((p) => p.type === type && p.channel === channel)
    return pref?.enabled ?? true
  }

  const updatePreference = async (type: string, channel: string, enabled: boolean) => {
    try {
      setIsUpdating(true)
      await fetch("/api/dashboard/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, channel, enabled }),
      })
      onRefresh()
    } catch (error) {
      console.error("Failed to update notification preference:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const renderPreferenceRow = (nt: NotificationType) => (
    <div
      key={nt.type}
      className="border-2 border-foreground bg-background p-4"
    >
      <div>
        <Label className="text-sm font-bold uppercase">{nt.label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{nt.description}</p>
      </div>
      <div
        className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"
        role="group"
        aria-label={`${nt.label} notification channels`}
      >
        {CHANNELS.map((ch) => {
          const enabled = isEnabled(nt.type, ch.channel)
          const checkboxId = `notification-${nt.type.toLowerCase()}-${ch.channel.toLowerCase()}`

          return (
            <div key={ch.channel} className="inline-flex items-center gap-2">
              <Checkbox
                id={checkboxId}
                checked={enabled}
                onCheckedChange={(checked) => updatePreference(nt.type, ch.channel, checked === true)}
                disabled={isUpdating}
                className="border-2 border-foreground accent-foreground"
              />
              <Label
                htmlFor={checkboxId}
                className="cursor-pointer select-none text-xs font-bold uppercase text-foreground"
              >
                {ch.label}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Card
      data-testid="notification-preferences-card"
      className="mb-8 border-2 border-foreground bg-background shadow-none"
    >
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">NOTIFICATION PREFERENCES</Card.Title>
        <Card.Description className="font-bold">Choose how and when to be bothered.</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-3">
        {CAMPAIGN_NOTIFICATION_TYPES.map(renderPreferenceRow)}

        <Accordion type="single" collapsible>
          <Accordion.Item
            value="more-notifications"
            className="rounded-none border-2 border-foreground bg-background shadow-none hover:shadow-none data-[state=open]:shadow-none"
          >
            <Accordion.Header className="px-4 py-3 text-left text-sm font-bold uppercase text-foreground">
              <span>More notifications</span>
            </Accordion.Header>
            <Accordion.Content unstyled className="space-y-3 border-t-2 border-foreground p-3 sm:p-4">
              {MORE_NOTIFICATION_TYPES.map(renderPreferenceRow)}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Card.Content>
    </Card>
  )
}
