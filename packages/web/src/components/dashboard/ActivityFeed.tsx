import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardActivity } from "@/types/dashboard"

interface ActivityFeedProps {
  activities: DashboardActivity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-2 border-primary" id="activity">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">RECENT ACTIVITY</CardTitle>
        <CardDescription className="font-bold">Your latest contributions</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
