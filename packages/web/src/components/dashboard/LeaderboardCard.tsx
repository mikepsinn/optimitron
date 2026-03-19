import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardUser, LeaderboardEntry, DashboardStats } from "@/types/dashboard"

interface LeaderboardCardProps {
  leaderboard: LeaderboardEntry[]
  user: DashboardUser
  stats: DashboardStats
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

export function LeaderboardCard({ leaderboard, user, stats }: LeaderboardCardProps) {
  const isCurrentUserInTop10 = leaderboard.some((entry) => entry.userId === user.id)
  const leaderboardWithUser = isCurrentUserInTop10
    ? leaderboard
    : [
        ...leaderboard.slice(0, 3),
        {
          rank: stats.rank,
          userId: user.id,
          name: user.username || user.name,
          image: user.image,
          referrals: stats.referrals,
        },
      ]

  return (
    <Card className="border-4 border-primary" id="leaderboard">
      <CardHeader>
        <CardTitle className="text-2xl font-black uppercase">LEADERBOARD</CardTitle>
        <CardDescription className="font-bold">
          Humans who have done the most to fix their planet. The bar is low
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardWithUser.map((entry) => {
            const isCurrentUser = entry.userId === user.id
            return (
              <div
                key={`${entry.rank}-${entry.userId}`}
                className={`flex items-center justify-between p-3 border-4 border-primary ${
                  isCurrentUser ? "bg-brutal-pink" : "bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black w-8">#{entry.rank}</div>
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt={entry.name}
                      className="h-10 w-10 rounded-full border-4 border-primary object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brutal-cyan border-4 border-primary flex items-center justify-center font-black text-sm">
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
      </CardContent>
    </Card>
  )
}
