import type { DocumentReviewPanelReview } from "@/lib/tasks/document-review.server";

export type DocumentAdoptionBlockerKind =
  | "AWAITING_RESPONSE"
  | "AWAITING_VERIFICATION"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "ABSTAINED"
  | "DELIVERY_REJECTED"
  | "STALE";

export interface DocumentAdoptionReadiness {
  blockerCount: number;
  blockers: Array<{
    kind: DocumentAdoptionBlockerKind;
    reviewTaskId: string;
    reviewerName: string;
  }>;
  canAdopt: boolean;
  label: string;
  status: "ADOPTED" | "BLOCKED" | "NO_REVIEWS" | "READY";
  waiverCount: number;
}

function isBlockerKind(
  state: DocumentReviewPanelReview["state"],
): state is DocumentAdoptionBlockerKind {
  return state !== "APPROVED";
}

/**
 * Mirrors the client-side part of the server adoption gate. The server remains
 * authoritative and revalidates every review, delivery check, and waiver.
 */
export function deriveDocumentAdoptionReadiness(input: {
  adopted: boolean;
  reviews: DocumentReviewPanelReview[];
  waiverReasons: Record<string, string | undefined>;
}): DocumentAdoptionReadiness {
  if (input.adopted) {
    return {
      blockerCount: 0,
      blockers: [],
      canAdopt: false,
      label: "This exact version is adopted.",
      status: "ADOPTED",
      waiverCount: 0,
    };
  }

  if (input.reviews.length === 0) {
    return {
      blockerCount: 0,
      blockers: [],
      canAdopt: false,
      label: "Request at least one independent review before adoption.",
      status: "NO_REVIEWS",
      waiverCount: 0,
    };
  }

  const unresolvedRequired = input.reviews.filter(
    (review) => review.required && isBlockerKind(review.state),
  );
  const waived = unresolvedRequired.filter(
    (review) =>
      (input.waiverReasons[review.reviewTaskId]?.trim().length ?? 0) >= 10,
  );
  const waivedIds = new Set(waived.map((review) => review.reviewTaskId));
  const blockers = unresolvedRequired
    .filter((review) => !waivedIds.has(review.reviewTaskId))
    .map((review) => ({
      kind: review.state as DocumentAdoptionBlockerKind,
      reviewerName: review.reviewer.displayName,
      reviewTaskId: review.reviewTaskId,
    }));

  if (blockers.length > 0) {
    return {
      blockerCount: blockers.length,
      blockers,
      canAdopt: false,
      label: `${blockers.length} required ${blockers.length === 1 ? "review needs" : "reviews need"} approval or a reasoned waiver.`,
      status: "BLOCKED",
      waiverCount: waived.length,
    };
  }

  return {
    blockerCount: 0,
    blockers: [],
    canAdopt: true,
    label:
      waived.length > 0
        ? `Ready to adopt with ${waived.length} recorded ${waived.length === 1 ? "waiver" : "waivers"}.`
        : "Ready to adopt with all required reviews approved.",
    status: "READY",
    waiverCount: waived.length,
  };
}
