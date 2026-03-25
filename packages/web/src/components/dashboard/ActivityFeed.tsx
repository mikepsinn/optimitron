import { Card } from "@/components/retroui/Card"
import type { DashboardActivity } from "@/types/dashboard"

interface ActivityFeedProps {
  activities: DashboardActivity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="border-4 border-primary" id="activity">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase">RECENT ACTIVITY</Card.Title>
        <Card.Description className="font-bold">Your latest contributions</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border-4 border-primary bg-background">
                <div className="h-10 w-10 rounded-full bg-brutal-cyan border-4 border-primary flex items-center justify-center shrink-0 text-xl">
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
      </Card.Content>
    </Card>
  )
}
