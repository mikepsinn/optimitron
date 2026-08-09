import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardData, LeaderboardEntry } from "@/types/dashboard"
import { cn } from "@/lib/utils"

interface LeaderboardCardProps {
  leaderboard: LeaderboardEntry[]
  user: DashboardData["user"]
  stats: DashboardData["stats"]
  showPoliticalContent: boolean
  frameless?: boolean
  className?: string
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

export function LeaderboardCard({
  leaderboard,
  user,
  stats,
  showPoliticalContent,
  frameless = false,
  className,
}: LeaderboardCardProps) {
  const isCurrentUserInTop10 = leaderboard.some((entry) => entry.userId === user.id)
  const leaderboardWithUser = isCurrentUserInTop10
    ? leaderboard
    : [
        ...leaderboard.slice(0, 3),
        {
          rank: stats.rank,
          userId: user.id,
          // Use username if set, otherwise name (matches privacy settings)
          name: user.username || user.name,
          image: user.image,
          referrals: stats.referrals,
        },
      ]

  const content = (
    <div className="space-y-3">
      {leaderboardWithUser.map((entry) => {
        const isCurrentUser = entry.userId === user.id
        return (
          <div
            key={`${entry.rank}-${entry.userId}`}
            className={`flex items-center justify-between p-3 border-2 border-primary ${
              isCurrentUser ? "bg-brutal-pink" : "bg-background"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black w-8">#{entry.rank}</div>
              {entry.image ? (
                <img
                  src={entry.image}
                  alt={entry.name}
                  className="h-10 w-10 rounded-full border-2 border-primary object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brutal-cyan border-2 border-primary flex items-center justify-center font-black text-sm">
                  {getInitials(entry.name)}
                </div>
              )}
              <div>
                <p className="font-black">
                  {entry.name} {isCurrentUser && "(YOU)"}
                </p>
                <p className="text-sm text-muted-foreground">{entry.referrals} referrals</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  if (frameless) {
    return (
      <div className={cn("space-y-0", className)} id="leaderboard">
        {content}
      </div>
    )
  }

  return (
    <Card className={cn("border-2 border-primary", className)} id="leaderboard">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">LEADERBOARD</CardTitle>
        <CardDescription className="font-bold">
          Top contributors to {showPoliticalContent ? "the campaign" : "the study"}
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
