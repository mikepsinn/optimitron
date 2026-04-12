"use client";

import { storage } from "./storage";
import type { Session } from "next-auth";
import { getUsernameOrReferralCode } from "./referral.client";
import { API_ROUTES } from "./api-routes";
import { getTreatyWishocraticAllocation } from "./treaty-vote";
import { TREATY_REFERENDUM_SLUG } from "@optimitron/db";

const DEFAULT_REFERENDUM_SLUG = TREATY_REFERENDUM_SLUG;

async function syncTreatyWishocraticAllocation(): Promise<boolean> {
  const pendingAllocation = getTreatyWishocraticAllocation(storage.getPendingTreatyVote());
  if (!pendingAllocation) {
    return true;
  }

  try {
    const response = await fetch(API_ROUTES.wishocracy.allocations, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingAllocation),
    });

    if (response.ok) {
      return true;
    }

    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    console.error(
      "Failed to sync treaty allocation:",
      errorData.error || "Unknown error",
    );
    return false;
  } catch (error) {
    console.error("Failed to sync treaty allocation:", error);
    return false;
  }
}

async function syncReferendumVote(
  pendingAnswer: string,
  referredBy: string | null,
  session?: Session | null,
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/referendums/${DEFAULT_REFERENDUM_SLUG}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: pendingAnswer,
          ref: referredBy,
        }),
      },
    );

    if (response.ok) {
      const referralIdentifier = getUsernameOrReferralCode(session?.user);
      if (referralIdentifier) {
        storage.setVoteStatusCache({
          hasVoted: true,
          voteAnswer: pendingAnswer,
          referralCode: referralIdentifier,
        });
      }

      return true;
    }

    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    console.error(
      "Failed to sync vote:",
      errorData.error || "Unknown error",
    );
    return false;
  } catch (error) {
    console.error("Failed to sync vote:", error);
    return false;
  }
}

/**
 * Sync any staged landing-funnel data from localStorage:
 * - referendum vote via the referendum vote API
 * - treaty slider allocation via the Wishocracy allocation API
 */
export async function syncPendingTreatyVote(
  session?: Session | null,
  onSuccess?: () => void,
): Promise<boolean> {
  const pendingTreatyVote = storage.getPendingTreatyVote();
  const hasPendingVote = Boolean(pendingTreatyVote?.answer);
  const hasPendingAllocation = Boolean(getTreatyWishocraticAllocation(pendingTreatyVote));

  if (!pendingTreatyVote || (!hasPendingVote && !hasPendingAllocation)) {
    return false;
  }

  const allocationSynced = hasPendingAllocation
    ? await syncTreatyWishocraticAllocation()
    : true;
  const voteSynced = hasPendingVote
    ? await syncReferendumVote(pendingTreatyVote.answer, pendingTreatyVote.referredBy, session)
    : true;

  if (hasPendingVote && allocationSynced && voteSynced) {
    storage.removePendingTreatyVote();
  }

  if (allocationSynced && voteSynced) {
    onSuccess?.();
    return true;
  }

  return false;
}
