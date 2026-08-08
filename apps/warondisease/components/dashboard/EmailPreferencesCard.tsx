"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { DashboardData, DashboardUser } from "@/types/dashboard"
import { updateUserProfile } from "@/app/dashboard/actions"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { createLogger } from "@/lib/logger"

const log = createLogger("email-preferences")

interface EmailPreferencesCardProps {
  user: DashboardData["user"]
  onUserChange: (user: DashboardUser) => void
  onRefresh: () => void
  className?: string
}

export function EmailPreferencesCard({ user, onUserChange, onRefresh, className }: EmailPreferencesCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleNewsletter = async () => {
    const next = !user.newsletterSubscribed
    try {
      setIsUpdating(true)
      await updateUserProfile({ newsletterSubscribed: next })
      onUserChange({ ...user, newsletterSubscribed: next })
      onRefresh()
    } catch (error) {
      log.error("Failed to update email preferences", { error })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className={cn("border-2 border-primary mb-8", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">EMAIL PREFERENCES</CardTitle>
        <CardDescription className="font-bold">How we email you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border-2 border-primary bg-background">
          <div>
            <Label className="text-sm font-bold uppercase">Subscribe for updates</Label>
            <p className="text-xs text-muted-foreground">
              Campaign progress, product updates, and impact reports
            </p>
          </div>
          <Button
            onClick={toggleNewsletter}
            variant={user.newsletterSubscribed ? "default" : "outline"}
            className="border-2 border-primary"
            disabled={isUpdating}
          >
            {user.newsletterSubscribed ? "ON" : "OFF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
