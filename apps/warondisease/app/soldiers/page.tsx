import { Layout } from "@/components/layout"
import { prisma } from "@/lib/prisma"
import { IMPACT_PER_VOTE } from "@/lib/impact-ledger"
import { SoldiersLeaderboard } from "./soldiers-leaderboard"
import type { BadgeType } from "@optimitron/db"
import { getBadgeName } from "@/lib/activity-descriptions"
import { countTreatyVotes } from "@/lib/treaty-votes.server"

export default async function SoldiersPage() {
  const publicUsers = await prisma.user.findMany({
    where: {
      isPublic: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      username: true,
      location: true,
      bio: true,
      image: true,
      createdAt: true,
      badges: {
        select: {
          type: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  const soldiers = await Promise.all(
    publicUsers.map(async (user) => {
      const referralCount = await countTreatyVotes({ referredByUserId: user.id })
      const inverseKills = Math.round(referralCount * IMPACT_PER_VOTE.lives)

      const displayName = user.name || user.username || "Anonymous"
      const avatar = displayName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      const badges = user.badges.map((badge) => getBadgeName(badge.type as BadgeType))

      return {
        id: user.id,
        name: displayName,
        username: user.username,
        location: user.location || "Unknown",
        story: user.bio || "Fighting to eradicate preventable disease.",
        inverseKills,
        referrals: referralCount,
        joinDate: user.createdAt.toISOString(),
        badges,
        avatar: user.image || avatar,
      }
    }),
  )

  // rank by referral count descending for leaderboard display
  soldiers.sort((a, b) => b.referrals - a.referrals)

  // Sort by inverse kills descending (highest impact first)
  soldiers.sort((a, b) => b.inverseKills - a.inverseKills)

  // Calculate aggregate stats
  const totalSoldiers = soldiers.length
  const totalReferrals = soldiers.reduce((sum, s) => sum + s.referrals, 0)
  const totalInverseKills = soldiers.reduce((sum, s) => sum + s.inverseKills, 0)

  return (
    <Layout>
      <SoldiersLeaderboard
        soldiers={soldiers}
        totalSoldiers={totalSoldiers}
        totalReferrals={totalReferrals}
        totalInverseKills={totalInverseKills}
      />
    </Layout>
  )
}
