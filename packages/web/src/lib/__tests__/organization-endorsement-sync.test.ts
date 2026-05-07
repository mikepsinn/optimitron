import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearPendingOrganizationEndorsementsSyncLock: vi.fn(),
  getPendingOrganizationEndorsements: vi.fn(),
  getPendingOrganizationEndorsementsSyncLock: vi.fn(),
  removePendingOrganizationEndorsements: vi.fn(),
  setPendingOrganizationEndorsementsSyncLock: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  storage: {
    clearPendingOrganizationEndorsementsSyncLock:
      mocks.clearPendingOrganizationEndorsementsSyncLock,
    getPendingOrganizationEndorsements:
      mocks.getPendingOrganizationEndorsements,
    getPendingOrganizationEndorsementsSyncLock:
      mocks.getPendingOrganizationEndorsementsSyncLock,
    removePendingOrganizationEndorsements:
      mocks.removePendingOrganizationEndorsements,
    setPendingOrganizationEndorsementsSyncLock:
      mocks.setPendingOrganizationEndorsementsSyncLock,
  },
}));

import {
  postOrganizationEndorsementDraft,
  syncPendingOrganizationEndorsements,
} from "../organization-endorsement-sync";

const draft = {
  clientDraftId: "org_draft_1",
  description: "A serious organization.",
  organizationName: "Coalition for Testable Medicine",
  originUrl: "https://warondisease.org/endorse",
  referendumSlug: "one-percent-treaty",
  statement: "We agree.",
  timestamp: "2026-05-06T12:00:00.000Z",
  version: 1,
  website: "https://example.org",
} as const;

describe("organization endorsement sync", () => {
  let lock: { expiresAt: number; ownerId: string } | null;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    lock = null;
    mocks.clearPendingOrganizationEndorsementsSyncLock.mockReset();
    mocks.getPendingOrganizationEndorsements.mockReset();
    mocks.getPendingOrganizationEndorsementsSyncLock.mockReset();
    mocks.removePendingOrganizationEndorsements.mockReset();
    mocks.setPendingOrganizationEndorsementsSyncLock.mockReset();
    mocks.getPendingOrganizationEndorsementsSyncLock.mockImplementation(
      () => lock,
    );
    mocks.setPendingOrganizationEndorsementsSyncLock.mockImplementation(
      (value) => {
        lock = value;
      },
    );
    mocks.clearPendingOrganizationEndorsementsSyncLock.mockImplementation(
      () => {
        lock = null;
      },
    );
  });

  it("posts and clears successful drafts", async () => {
    mocks.getPendingOrganizationEndorsements.mockReturnValue([draft]);
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        organizationId: "org_1",
        taskId: "task_1",
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncPendingOrganizationEndorsements();

    expect(result.syncedDrafts).toEqual([draft]);
    expect(result.syncedOrganizations).toEqual([
      {
        draft,
        organizationId: "org_1",
        organizationName: "Coalition for Testable Medicine",
        taskId: "task_1",
      },
    ]);
    expect(result.failedDrafts).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/referendums/one-percent-treaty/organization-position",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Coalition for Testable Medicine"),
      }),
    );
    expect(mocks.removePendingOrganizationEndorsements).toHaveBeenCalledWith([
      "org_draft_1",
    ]);
    expect(
      mocks.clearPendingOrganizationEndorsementsSyncLock,
    ).toHaveBeenCalled();
  });

  it("keeps failed drafts in local storage", async () => {
    mocks.getPendingOrganizationEndorsements.mockReturnValue([draft]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const result = await syncPendingOrganizationEndorsements();

    expect(result.syncedDrafts).toEqual([]);
    expect(result.syncedOrganizations).toEqual([]);
    expect(result.failedDrafts).toEqual([draft]);
    expect(mocks.removePendingOrganizationEndorsements).not.toHaveBeenCalled();
  });

  it("renews the sync lock before each draft post", async () => {
    const secondDraft = {
      ...draft,
      clientDraftId: "org_draft_2",
      organizationName: "Second Coalition",
    };
    mocks.getPendingOrganizationEndorsements.mockReturnValue([
      draft,
      secondDraft,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ organizationId: "org_1" }),
        ok: true,
      }),
    );

    await syncPendingOrganizationEndorsements();

    expect(mocks.setPendingOrganizationEndorsementsSyncLock).toHaveBeenCalledTimes(
      3,
    );
    expect(mocks.removePendingOrganizationEndorsements).toHaveBeenCalledWith([
      "org_draft_1",
    ]);
    expect(mocks.removePendingOrganizationEndorsements).toHaveBeenCalledWith([
      "org_draft_2",
    ]);
  });

  it("returns the created organization id from a successful post", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ organizationId: "org_1" }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postOrganizationEndorsementDraft(draft)).resolves.toEqual({
      draft,
      organizationId: "org_1",
      organizationName: "Coalition for Testable Medicine",
      taskId: null,
    });
  });

  it("skips sync when another tab owns an active lock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00.000Z"));
    lock = {
      ownerId: "other-tab",
      expiresAt: Date.now() + 10_000,
    };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncPendingOrganizationEndorsements();

    expect(result.skippedBecauseLocked).toBe(true);
    expect(result.syncedOrganizations).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
