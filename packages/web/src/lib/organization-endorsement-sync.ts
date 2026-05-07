"use client";

import {
  storage,
  type PendingOrganizationEndorsementDraft,
} from "@/lib/storage";

const LOCK_TTL_MS = 15_000;

export interface SyncedOrganizationEndorsement {
  draft: PendingOrganizationEndorsementDraft;
  organizationId: string;
  organizationName: string;
  taskId?: string | null;
}

export interface OrganizationEndorsementSyncResult {
  failedDrafts: PendingOrganizationEndorsementDraft[];
  skippedBecauseLocked: boolean;
  syncedDrafts: PendingOrganizationEndorsementDraft[];
  syncedOrganizations: SyncedOrganizationEndorsement[];
}

function createOwnerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `organization-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function acquireLock(ownerId: string): boolean {
  const now = Date.now();
  const existing = storage.getPendingOrganizationEndorsementsSyncLock();
  if (existing && existing.expiresAt > now && existing.ownerId !== ownerId) {
    return false;
  }
  storage.setPendingOrganizationEndorsementsSyncLock({
    ownerId,
    expiresAt: now + LOCK_TTL_MS,
  });
  const confirmed = storage.getPendingOrganizationEndorsementsSyncLock();
  return confirmed?.ownerId === ownerId;
}

function releaseLock(ownerId: string): void {
  const existing = storage.getPendingOrganizationEndorsementsSyncLock();
  if (!existing || existing.ownerId === ownerId) {
    storage.clearPendingOrganizationEndorsementsSyncLock();
  }
}

function renewLock(ownerId: string): boolean {
  const existing = storage.getPendingOrganizationEndorsementsSyncLock();
  if (!existing || existing.ownerId !== ownerId) {
    return false;
  }
  storage.setPendingOrganizationEndorsementsSyncLock({
    ownerId,
    expiresAt: Date.now() + LOCK_TTL_MS,
  });
  const confirmed = storage.getPendingOrganizationEndorsementsSyncLock();
  return confirmed?.ownerId === ownerId;
}

function draftPayload(draft: PendingOrganizationEndorsementDraft) {
  return {
    newOrganization: {
      description: draft.description ?? null,
      name: draft.organizationName,
      website: draft.website ?? null,
    },
    position: "YES",
    statement: draft.statement ?? null,
  };
}

function parsePostResponse(
  value: unknown,
): { organizationId: string; taskId?: string | null } | null {
  if (typeof value !== "object" || value === null) return null;
  const organizationId = (value as { organizationId?: unknown }).organizationId;
  if (typeof organizationId !== "string" || organizationId.trim() === "") {
    return null;
  }
  const rawTaskId = (value as { taskId?: unknown }).taskId;
  return {
    organizationId,
    taskId:
      typeof rawTaskId === "string" && rawTaskId.trim() ? rawTaskId : null,
  };
}

export async function postOrganizationEndorsementDraft(
  draft: PendingOrganizationEndorsementDraft,
): Promise<SyncedOrganizationEndorsement | null> {
  const response = await fetch(
    `/api/referendums/${encodeURIComponent(draft.referendumSlug)}/organization-position`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload(draft)),
    },
  );
  if (!response.ok) return null;
  const payload = parsePostResponse(await response.json().catch(() => null));
  if (!payload) return null;
  return {
    draft,
    organizationId: payload.organizationId,
    organizationName: draft.organizationName,
    taskId: payload.taskId ?? null,
  };
}

export async function syncPendingOrganizationEndorsements(): Promise<OrganizationEndorsementSyncResult> {
  const ownerId = createOwnerId();
  if (!acquireLock(ownerId)) {
    return {
      failedDrafts: [],
      skippedBecauseLocked: true,
      syncedDrafts: [],
      syncedOrganizations: [],
    };
  }

  const syncedDrafts: PendingOrganizationEndorsementDraft[] = [];
  const syncedOrganizations: SyncedOrganizationEndorsement[] = [];
  const failedDrafts: PendingOrganizationEndorsementDraft[] = [];

  try {
    const drafts = storage.getPendingOrganizationEndorsements();
    for (const draft of drafts) {
      if (!renewLock(ownerId)) {
        failedDrafts.push(draft);
        continue;
      }
      try {
        const organization = await postOrganizationEndorsementDraft(draft);
        if (organization) {
          storage.removePendingOrganizationEndorsements([draft.clientDraftId]);
          syncedDrafts.push(draft);
          syncedOrganizations.push(organization);
        } else {
          failedDrafts.push(draft);
        }
      } catch {
        failedDrafts.push(draft);
      }
    }

    return {
      failedDrafts,
      skippedBecauseLocked: false,
      syncedDrafts,
      syncedOrganizations,
    };
  } finally {
    releaseLock(ownerId);
  }
}
