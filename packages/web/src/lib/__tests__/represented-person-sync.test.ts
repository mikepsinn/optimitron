import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearPendingRepresentedPeopleSyncLock: vi.fn(),
  getPendingRepresentedPeople: vi.fn(),
  getPendingRepresentedPeopleSyncLock: vi.fn(),
  removePendingRepresentedPeople: vi.fn(),
  setPendingRepresentedPeopleSyncLock: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    clearPendingRepresentedPeopleSyncLock:
      mocks.clearPendingRepresentedPeopleSyncLock,
    getPendingRepresentedPeople: mocks.getPendingRepresentedPeople,
    getPendingRepresentedPeopleSyncLock:
      mocks.getPendingRepresentedPeopleSyncLock,
    removePendingRepresentedPeople: mocks.removePendingRepresentedPeople,
    setPendingRepresentedPeopleSyncLock:
      mocks.setPendingRepresentedPeopleSyncLock,
  },
}));

import {
  postRepresentedPersonDraft,
  syncPendingRepresentedPeople,
} from "../represented-person-sync";

const draft = {
  authorityConfirmed: true,
  clientDraftId: "draft_1",
  displayName: "Kay Elaine Sinn",
  healthDisclosureConfirmed: false,
  isPublic: true,
  firstName: "Kay",
  middleName: "Elaine",
  lastName: "Sinn",
  originUrl: "https://warondisease.org/people",
  publicDisplayAcknowledged: true,
  referendumSlug: "one-percent-treaty",
  showConditionPublicly: false,
  timestamp: "2026-05-05T12:00:00.000Z",
  version: 1,
} as const;

describe("represented person sync", () => {
  let lock: { expiresAt: number; ownerId: string } | null;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    lock = null;
    mocks.clearPendingRepresentedPeopleSyncLock.mockReset();
    mocks.getPendingRepresentedPeople.mockReset();
    mocks.getPendingRepresentedPeopleSyncLock.mockReset();
    mocks.removePendingRepresentedPeople.mockReset();
    mocks.setPendingRepresentedPeopleSyncLock.mockReset();
    mocks.getPendingRepresentedPeopleSyncLock.mockImplementation(() => lock);
    mocks.setPendingRepresentedPeopleSyncLock.mockImplementation((value) => {
      lock = value;
    });
    mocks.clearPendingRepresentedPeopleSyncLock.mockImplementation(() => {
      lock = null;
    });
  });

  it("posts and clears successful drafts", async () => {
    mocks.getPendingRepresentedPeople.mockReturnValue([draft]);
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        person: { displayName: "Kay Elaine Sinn", id: "person_1" },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncPendingRepresentedPeople();

    expect(result.syncedDrafts).toEqual([draft]);
    expect(result.syncedPeople).toEqual([
      { displayName: "Kay Elaine Sinn", draft, personId: "person_1" },
    ]);
    expect(result.failedDrafts).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/referendums/one-percent-treaty/represented-people",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("draft_1"),
      }),
    );
    expect(mocks.removePendingRepresentedPeople).toHaveBeenCalledWith([
      "draft_1",
    ]);
    expect(mocks.clearPendingRepresentedPeopleSyncLock).toHaveBeenCalled();
  });

  it("keeps failed drafts in local storage", async () => {
    mocks.getPendingRepresentedPeople.mockReturnValue([draft]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await syncPendingRepresentedPeople();

    expect(result.syncedDrafts).toEqual([]);
    expect(result.syncedPeople).toEqual([]);
    expect(result.failedDrafts).toEqual([draft]);
    expect(mocks.removePendingRepresentedPeople).not.toHaveBeenCalled();
  });

  it("returns the created person id from a successful post", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        person: { displayName: "Kay Elaine Sinn", id: "person_1" },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postRepresentedPersonDraft(draft)).resolves.toEqual({
      displayName: "Kay Elaine Sinn",
      draft,
      personId: "person_1",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/referendums/one-percent-treaty/represented-people",
      expect.objectContaining({
        body: expect.stringContaining('"authorityConfirmed":true'),
      }),
    );
  });

  it("posts the public display and health disclosure flags from the pending draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        person: { displayName: "Kay Elaine Sinn", id: "person_1" },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await postRepresentedPersonDraft({
      ...draft,
      conditionName: "dementia",
      healthDisclosureConfirmed: true,
      showConditionPublicly: true,
    });

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string,
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      authorityConfirmed: true,
      healthDisclosureConfirmed: true,
      firstName: "Kay",
      middleName: "Elaine",
      lastName: "Sinn",
      publicDisplayAcknowledged: true,
      showConditionPublicly: true,
    });
  });

  it("normalizes stored draft privacy flags to explicit booleans", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        person: { displayName: "Kay Elaine Sinn", id: "person_1" },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await postRepresentedPersonDraft({
      ...draft,
      isPublic: "yes" as never,
    });

    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string,
    ) as Record<string, unknown>;
    expect(body.isPublic).toBe(false);
  });

  it("skips sync when another tab owns an active lock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T12:00:00.000Z"));
    lock = {
      ownerId: "other-tab",
      expiresAt: Date.now() + 10_000,
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncPendingRepresentedPeople();

    expect(result.skippedBecauseLocked).toBe(true);
    expect(result.syncedPeople).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
