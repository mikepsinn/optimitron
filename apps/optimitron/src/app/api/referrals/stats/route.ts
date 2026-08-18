import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  getVerifiedVoteStats,
  getTopReferrersByVerifiedVotes,
  getGlobalVerifiedVoteCount,
} from "@/lib/verified-votes.server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [leaderboard, globalVerifiedVotes] = await Promise.all([
      getTopReferrersByVerifiedVotes(undefined, 10),
      getGlobalVerifiedVoteCount(),
    ]);

    if (!user) {
      return NextResponse.json({
        stats: null,
        leaderboard,
        globalProgress: { verifiedVotes: globalVerifiedVotes },
      });
    }

    const stats = await getVerifiedVoteStats(user.id);

    const rank =
      leaderboard.findIndex((e) => e.userId === user.id) + 1 || null;

    return NextResponse.json({
      stats: { ...stats, rank },
      leaderboard,
      globalProgress: { verifiedVotes: globalVerifiedVotes },
    });
  } catch (error) {
    console.error("[REFERRAL STATS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 },
    );
  }
}
