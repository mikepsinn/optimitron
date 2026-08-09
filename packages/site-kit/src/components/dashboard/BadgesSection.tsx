import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"
import type { DashboardBadge } from "@/types/dashboard"
import { cn } from "@/lib/utils"

interface BadgesSectionProps {
  badges: DashboardBadge[]
  showPoliticalContent: boolean
  frameless?: boolean
  className?: string
}

export function BadgesSection({ badges, showPoliticalContent, frameless = false, className }: BadgesSectionProps) {
  const content = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.length > 0 ? (
        badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 border-2 border-primary rounded-none ${
              badge.earned ? "bg-brutal-yellow" : "bg-muted opacity-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <Award className={`h-8 w-8 shrink-0 ${badge.earned ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <h3 className="font-black uppercase text-sm">{badge.name}</h3>
                <p className="text-xs">{badge.description}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-8 col-span-3">
          No medals earned yet. Keep helping {showPoliticalContent ? "the campaign" : "the study"}.
        </p>
      )}
    </div>
  )

  if (frameless) {
    return <div className={cn("space-y-0", className)}>{content}</div>
  }

  return (
    <Card className={cn("border-2 border-primary mb-8", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Award className="h-6 w-6" />
          MEDALS & SERVICE AWARDS
        </CardTitle>
        <CardDescription className="font-bold space-y-1">
          <span>Your contributions to {showPoliticalContent ? "the campaign" : "the study"}</span>
          <span>Thank you for your service in the War on Disease! 🫡</span>
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
