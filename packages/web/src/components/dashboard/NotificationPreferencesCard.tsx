"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DashboardNotificationPreference } from "@/types/dashboard"
import { useState } from "react"

const NOTIFICATION_TYPES = [
  { type: "REFERRAL_SIGNUP", label: "Referral Sign-ups", description: "When someone you referred joins" },
  { type: "REFERENDUM_MILESTONE", label: "Referendum Milestones", description: "Progress updates on referendums" },
  { type: "BADGE_EARNED", label: "Badge Earned", description: "When you earn a new badge" },
  { type: "DEPOSIT_CONFIRMED", label: "Deposit Confirmed", description: "When your prize deposit is confirmed" },
  { type: "SURVEY_INVITE", label: "Survey Invites", description: "Invitations to participate in surveys" },
  { type: "DAILY_CHECKIN_REMINDER", label: "Daily Check-in", description: "Reminder to log your measurements" },
  { type: "ORGANIZATION_INVITE", label: "Organization Invites", description: "Invitations to join organizations" },
  { type: "SYSTEM_ANNOUNCEMENT", label: "System Announcements", description: "Platform updates and news" },
] as const

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

  const togglePreference = async (type: string, channel: string) => {
    try {
      setIsUpdating(true)
      const currentValue = isEnabled(type, channel)
      await fetch("/api/dashboard/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, channel, enabled: !currentValue }),
      })
      onRefresh()
    } catch (error) {
      console.error("Failed to update notification preference:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="border-2 border-primary mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">NOTIFICATION PREFERENCES</CardTitle>
        <CardDescription className="font-bold">Choose how and when to be bothered</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel headers */}
        <div className="hidden sm:grid grid-cols-[1fr_repeat(3,80px)] gap-2 px-4 pb-2 border-b-2 border-primary">
          <div />
          {CHANNELS.map((ch) => (
            <div key={ch.channel} className="text-center">
              <Label className="text-xs font-black uppercase">{ch.label}</Label>
            </div>
          ))}
        </div>

        {/* Preference rows */}
        {NOTIFICATION_TYPES.map((nt) => (
          <div
            key={nt.type}
            className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(3,80px)] gap-2 p-4 border-2 border-primary bg-background items-center"
          >
            <div>
              <Label className="text-sm font-bold uppercase">{nt.label}</Label>
              <p className="text-xs text-muted-foreground">{nt.description}</p>
            </div>
            {CHANNELS.map((ch) => {
              const enabled = isEnabled(nt.type, ch.channel)
              return (
                <div key={ch.channel} className="flex sm:justify-center">
                  <Button
                    size="sm"
                    onClick={() => togglePreference(nt.type, ch.channel)}
                    variant={enabled ? "default" : "outline"}
                    className="border-2 border-primary w-16"
                    disabled={isUpdating}
                  >
                    {enabled ? "ON" : "OFF"}
                  </Button>
                </div>
              )
            })}
          </div>
        ))}

        <div className="p-4 border-2 border-dashed border-primary bg-brutal-yellow">
          <p className="text-sm font-bold text-center">
            On my planet, notifications take 0.003 seconds to process. You lot seem to need the option to ignore them entirely.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
