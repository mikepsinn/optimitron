import { TaskClaimPolicy } from "@optimitron/db";

type ResolveTaskClaimSettingsInput = {
  assigneeOrganizationId?: string | null;
  assigneePersonId?: string | null;
  currentClaimPolicy?: TaskClaimPolicy | null;
  currentMaxClaims?: number | null;
  requestedClaimPolicy?: TaskClaimPolicy | null;
  requestedMaxClaims?: number | null;
};

export function resolveTaskClaimSettings({
  assigneeOrganizationId,
  assigneePersonId,
  currentClaimPolicy,
  currentMaxClaims,
  requestedClaimPolicy,
  requestedMaxClaims,
}: ResolveTaskClaimSettingsInput) {
  const isAssigned = Boolean(assigneeOrganizationId || assigneePersonId);
  const claimPolicy = isAssigned
    ? TaskClaimPolicy.ASSIGNED_ONLY
    : (requestedClaimPolicy ??
      currentClaimPolicy ??
      TaskClaimPolicy.OPEN_SINGLE);
  const maxClaims =
    claimPolicy === TaskClaimPolicy.OPEN_MANY
      ? requestedMaxClaims !== undefined
        ? requestedMaxClaims
        : currentClaimPolicy === TaskClaimPolicy.OPEN_MANY
          ? (currentMaxClaims ?? null)
          : null
      : null;

  if (maxClaims != null && (!Number.isInteger(maxClaims) || maxClaims < 1)) {
    throw new Error("maxClaims must be at least 1 for OPEN_MANY tasks.");
  }

  return { claimPolicy, maxClaims };
}

export function verifiedClaimClosesTask(claimPolicy: TaskClaimPolicy) {
  return claimPolicy !== TaskClaimPolicy.OPEN_MANY;
}
