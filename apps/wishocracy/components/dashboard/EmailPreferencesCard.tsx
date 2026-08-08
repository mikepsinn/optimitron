"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DashboardData, DashboardUser } from "@/types/dashboard"
import { updateUserProfile } from "@/app/dashboard/actions"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface EmailPreferencesCardProps {
  user: DashboardData["user"]
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
  className?: string
}

export function EmailPreferencesCard({ user, onUserChange, onRefresh, className }: EmailPreferencesCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updatePreferences = async (data: Partial<Pick<DashboardUser, "weeklyDigest" | "emailNotifications" | "newsletterSubscribed">>) => {
    try {
      setIsUpdating(true)
      await updateUserProfile(data)
      onUserChange({ ...user, ...data })
      onRefresh()
    } catch (error) {
      console.error("Failed to update email preferences:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleEmailNotifications = () => {
    updatePreferences({ emailNotifications: !user.emailNotifications })
  }

  const toggleWeeklyDigest = () => {
    if (!user.emailNotifications) {
      return
    }

    updatePreferences({ weeklyDigest: !user.weeklyDigest })
  }

  const toggleNewsletterSubscribed = () => {
    if (!user.emailNotifications) {
      return
    }

    updatePreferences({ newsletterSubscribed: !user.newsletterSubscribed })
  }

  return (
    <Card className={cn("border-2 border-primary mb-8", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">📧 EMAIL PREFERENCES</CardTitle>
        <CardDescription className="font-bold">Manage how we communicate with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border-2 border-primary bg-background">
          <div>
            <Label className="text-sm font-bold uppercase">Email Notifications</Label>
            <p className="text-xs text-muted-foreground">Master toggle for all email communications</p>
          </div>
          <Button
            onClick={toggleEmailNotifications}
            variant={user.emailNotifications ? "default" : "outline"}
            className="border-2 border-primary"
            disabled={isUpdating}
          >
            {user.emailNotifications ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border-2 border-primary bg-background">
          <div>
            <Label className="text-sm font-bold uppercase">Weekly Digest Emails</Label>
            <p className="text-xs text-muted-foreground">
              Get your stats, new referrals, and leaderboard position every Monday
            </p>
          </div>
          <Button
            onClick={toggleWeeklyDigest}
            variant={user.weeklyDigest && user.emailNotifications ? "default" : "outline"}
            className="border-2 border-primary"
            disabled={!user.emailNotifications || isUpdating}
          >
            {user.weeklyDigest && user.emailNotifications ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border-2 border-primary bg-background">
          <div>
            <Label className="text-sm font-bold uppercase">Subscribe for Updates</Label>
            <p className="text-xs text-muted-foreground">
              Receive updates on campaign progress, new features, and impact reports
            </p>
          </div>
          <Button
            onClick={toggleNewsletterSubscribed}
            variant={user.newsletterSubscribed && user.emailNotifications ? "default" : "outline"}
            className="border-2 border-primary"
            disabled={!user.emailNotifications || isUpdating}
          >
            {user.newsletterSubscribed && user.emailNotifications ? "ON" : "OFF"}
          </Button>
        </div>

        {!user.emailNotifications && (
          <div className="p-4 border-2 border-dashed border-primary bg-brutal-yellow">
            <p className="text-sm font-bold text-center">
              ⚠️ Email notifications are disabled. Enable them to receive weekly updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

