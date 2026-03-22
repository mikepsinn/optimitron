import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award } from "lucide-react"
import type { DashboardBadge } from "@/types/dashboard"

interface BadgesSectionProps {
  badges: DashboardBadge[]
}

export function BadgesSection({ badges }: BadgesSectionProps) {
  return (
    <Card className="border-4 border-primary mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase flex items-center gap-2">
          <Award className="h-6 w-6" />
          BADGES & ACHIEVEMENTS
        </CardTitle>
        <CardDescription className="font-bold">
          Your contributions to Earth optimization. Well done, human.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.length > 0 ? (
            badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 border-4 border-primary rounded-none ${
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
            <p className="text-center text-muted-foreground py-8 col-span-3">No achievements unlocked yet. On my planet we&apos;d call this &ldquo;a blank record.&rdquo; Yours is showing.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
