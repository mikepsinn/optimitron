import { Card } from "@/components/retroui/Card"
import { Target } from "lucide-react"
import type { DashboardStats } from "@/types/dashboard"

interface ReferralGoalCardProps {
  stats: DashboardStats
}

export function ReferralGoalCard({ stats }: ReferralGoalCardProps) {
  return (
    <Card className="border-4 border-primary mb-8 bg-brutal-pink">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <Target className="h-6 w-6" />
          YOUR REFERRAL GOAL
        </Card.Title>
        <Card.Description className="text-foreground font-bold">
          QUEST: Recruit 2 players. That&apos;s the reproductive number for ideas. Above 1.3 and this thing spreads on its own.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>{stats.referrals} referrals</span>
              <span>{stats.referrals >= 2 ? "✓ Goal Met!" : `${2 - stats.referrals} more to goal`}</span>
            </div>
            <div className="h-8 bg-background border-4 border-primary rounded-none overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${stats.referrals >= 2 ? "bg-brutal-cyan" : "bg-primary"}`}
                style={{ width: `${Math.min((stats.referrals / 2) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { milestone: 1, label: "FIRST RECRUIT", icon: "🎯" },
              { milestone: 2, label: "GOAL MET", icon: "✅" },
              { milestone: 5, label: "POWER RECRUITER", icon: "💪" },
              { milestone: 10, label: "SUPER SPREADER", icon: "🚀" },
            ].map((item) => (
              <div
                key={item.milestone}
                className={`p-3 border-4 border-primary text-center ${
                  stats.referrals >= item.milestone ? "bg-brutal-cyan" : "bg-background opacity-50"
                }`}
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="font-black text-xs">{item.milestone === 10 ? "10+" : item.milestone}</div>
                <div className="text-xs">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm font-bold text-center">
            {stats.referrals < 2
              ? "Share your referral link to reach your goal!"
              : stats.referrals < 5
                ? "You're in the top 50%! Can you reach 5?"
                : stats.referrals < 10
                  ? "You're in the top 20%! Can you reach 10?"
                  : "You're a LEGENDARY recruiter! 🏆"}
          </p>
        </div>
      </Card.Content>
    </Card>
  )
}
