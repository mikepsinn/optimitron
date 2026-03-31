import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWishBalance } from "@/lib/wishes.server";

/**
 * GET /api/game-stats — lightweight stats for the global score bar.
 * Returns wishes, VOTE balance, referral count, and comparison count.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const [wishes, referralCount, comparisonCount] = await Promise.all([
    getWishBalance(userId),
    prisma.referral.count({ where: { referredByUserId: userId } }),
    prisma.activity.count({
      where: { userId, type: "SUBMITTED_COMPARISON" },
    }),
  ]);

  return NextResponse.json({
    authenticated: true,
    wishes,
    // VOTE points = referrals. 1 point per verified voter recruited. No wallet required.
    votePoints: referralCount,
    referrals: referralCount,
    comparisons: comparisonCount,
  });
}
