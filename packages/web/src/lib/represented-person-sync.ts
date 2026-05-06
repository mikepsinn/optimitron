"use client";

import {
  storage,
  type PendingRepresentedPersonDraft,
} from "@/lib/storage";

const LOCK_TTL_MS = 15_000;

export interface RepresentedPersonSyncResult {
  failedDrafts: PendingRepresentedPersonDraft[];
  skippedBecauseLocked: boolean;
  syncedDrafts: PendingRepresentedPersonDraft[];
  syncedPeople: SyncedRepresentedPerson[];
}

export interface SyncedRepresentedPerson {
  displayName: string;
  draft: PendingRepresentedPersonDraft;
  personId: string;
}

function createOwnerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `represented-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function acquireLock(ownerId: string): boolean {
  const now = Date.now();
  const existing = storage.getPendingRepresentedPeopleSyncLock();
  if (existing && existing.expiresAt > now && existing.ownerId !== ownerId) {
    return false;
  }
  storage.setPendingRepresentedPeopleSyncLock({
    ownerId,
    expiresAt: now + LOCK_TTL_MS,
  });
  const confirmed = storage.getPendingRepresentedPeopleSyncLock();
  return confirmed?.ownerId === ownerId;
}

function releaseLock(ownerId: string): void {
  const existing = storage.getPendingRepresentedPeopleSyncLock();
  if (!existing || existing.ownerId === ownerId) {
    storage.clearPendingRepresentedPeopleSyncLock();
  }
}

function draftPayload(draft: PendingRepresentedPersonDraft) {
  return {
    clientDraftId: draft.clientDraftId,
    conditionName: draft.conditionName ?? "",
    displayName: draft.displayName,
    isPublic: draft.isPublic,
    lifeStatus: draft.lifeStatus ?? "UNKNOWN",
    originUrl: draft.originUrl,
    publicComment: draft.publicComment ?? "",
    relationshipType: draft.relationshipType ?? "",
  };
}

export async function postRepresentedPersonDraft(
  draft: PendingRepresentedPersonDraft,
): Promise<SyncedRepresentedPerson | null> {
  const response = await fetch(
    `/api/referendums/${draft.referendumSlug}/represented-people`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftPayload(draft)),
    },
  );
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as {
    person?: { displayName?: string; id?: string };
  } | null;
  const personId = payload?.person?.id;
  if (!personId) return null;
  return {
    displayName: payload?.person?.displayName ?? draft.displayName,
    draft,
    personId,
  };
}

export async function syncPendingRepresentedPeople(): Promise<RepresentedPersonSyncResult> {
  const ownerId = createOwnerId();
  if (!acquireLock(ownerId)) {
    return {
      failedDrafts: [],
      skippedBecauseLocked: true,
      syncedDrafts: [],
      syncedPeople: [],
    };
  }

  const syncedDrafts: PendingRepresentedPersonDraft[] = [];
  const syncedPeople: SyncedRepresentedPerson[] = [];
  const failedDrafts: PendingRepresentedPersonDraft[] = [];

  try {
    const drafts = storage.getPendingRepresentedPeople();
    for (const draft of drafts) {
      try {
        const person = await postRepresentedPersonDraft(draft);
        if (person) {
          syncedDrafts.push(draft);
          syncedPeople.push(person);
        } else {
          failedDrafts.push(draft);
        }
      } catch {
        failedDrafts.push(draft);
      }
    }

    if (syncedDrafts.length > 0) {
      storage.removePendingRepresentedPeople(
        syncedDrafts.map((draft) => draft.clientDraftId),
      );
    }

    return {
      failedDrafts,
      skippedBecauseLocked: false,
      syncedDrafts,
      syncedPeople,
    };
  } finally {
    releaseLock(ownerId);
  }
}
