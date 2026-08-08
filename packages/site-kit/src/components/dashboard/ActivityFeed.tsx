import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardActivity } from "@/types/dashboard"
import { cn } from "@/lib/utils"

interface ActivityFeedProps {
  activities: DashboardActivity[]
  frameless?: boolean
  className?: string
}

export function ActivityFeed({ activities, frameless = false, className }: ActivityFeedProps) {
  const content = (
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 border-2 border-primary bg-background">
            <div className="h-10 w-10 rounded-full bg-brutal-cyan border-2 border-primary flex items-center justify-center shrink-0 text-xl">
              {activity.emoji}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{activity.text}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-8">No recent activity</p>
      )}
    </div>
  )

  if (frameless) {
    return (
      <div id="activity" className={cn("space-y-3", className)}>
        {content}
      </div>
    )
  }

  return (
    <Card className={cn("border-2 border-primary", className)} id="activity">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">RECENT ACTIVITY</CardTitle>
        <CardDescription className="font-bold">Your latest contributions</CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

