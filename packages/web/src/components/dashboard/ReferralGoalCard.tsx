import { Card } from "@/components/retroui/Card"
import type { DashboardStats } from "@/types/dashboard"
import { GAME } from "@/lib/messaging"

interface ReferralGoalCardProps {
  stats: DashboardStats
}

export function ReferralGoalCard({ stats }: ReferralGoalCardProps) {
  return (
    <Card className="border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] text-[var(--treaty-ink)] shadow-none">
      <Card.Header>
        <Card.Title className="text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">
          YOUR REFERRAL GOAL
        </Card.Title>
        <Card.Description className="text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
          QUEST: Get {GAME.referralGoal} friends to play. That&apos;s the reproductive number for ideas. Above 1.3 and this thing spreads on its own.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm font-bold">
              <span>{stats.referrals} referrals</span>
              <span>{stats.referrals >= GAME.referralGoal ? "✓ Goal Met!" : `${GAME.referralGoal - stats.referrals} more to goal`}</span>
            </div>
            <div className="h-2 overflow-hidden bg-[var(--treaty-ink)]/15">
              <div
                className="h-full bg-[var(--treaty-ink)] transition-all duration-500"
                style={{ width: `${Math.min((stats.referrals / GAME.referralGoal) * 100, 100)}%` }}
              />
            </div>
          </div>

          <details className="border-y border-[var(--treaty-ink)]/20 py-3">
            <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em] text-[var(--treaty-ink-muted)]">
              Milestones
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              {[
                { milestone: 1, label: "FIRST RECRUIT" },
                { milestone: GAME.referralGoal, label: "GOAL MET" },
                { milestone: 5, label: "POWER RECRUITER" },
                { milestone: 10, label: "SUPER SPREADER" },
              ].map((item) => (
                <div
                  key={item.milestone}
                  className={`border border-[var(--treaty-ink)]/30 p-2 text-center ${
                    stats.referrals >= item.milestone ? "" : "opacity-50"
                  }`}
                >
                  <div className="font-black">{item.milestone === 10 ? "10+" : item.milestone}</div>
                  <div>{item.label}</div>
                </div>
              ))}
            </div>
          </details>

          <p className="text-center text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
            {stats.referrals < GAME.referralGoal
              ? `Share your link — get ${GAME.referralGoal} friends to play!`
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
