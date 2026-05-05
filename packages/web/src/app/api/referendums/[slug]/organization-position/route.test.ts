import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  OrgType,
  ReferendumStatus,
  VotePosition,
} from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  canManageOrganization: vi.fn(),
  createOrganizationWithOwner: vi.fn(),
  positionFindUnique: vi.fn(),
  positionUpsert: vi.fn(),
  referendumFindUnique: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/organization.server", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/organization.server")
  >("@/lib/organization.server");
  return {
    ...actual,
    canManageOrganization: mocks.canManageOrganization,
    createOrganizationWithOwner: mocks.createOrganizationWithOwner,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: {
      findUnique: mocks.referendumFindUnique,
    },
    organizationReferendumPosition: {
      findUnique: mocks.positionFindUnique,
      upsert: mocks.positionUpsert,
    },
  },
}));

import { POST } from "./route";

const ACTIVE_REFERENDUM = {
  id: "ref_1",
  status: ReferendumStatus.ACTIVE,
  deletedAt: null,
};

function makeRequest(body: Record<string, unknown>) {
  return new Request(
    "http://localhost/api/referendums/one-percent-treaty/organization-position",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function makeParams(slug = "one-percent-treaty") {
  return { params: Promise.resolve({ slug }) };
}

describe("POST /api/referendums/[slug]/organization-position", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.referendumFindUnique.mockResolvedValue(ACTIVE_REFERENDUM);
    mocks.canManageOrganization.mockResolvedValue(true);
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_new",
      status: OrgStatus.APPROVED,
    });
    mocks.positionFindUnique.mockResolvedValue(null);
    mocks.positionUpsert.mockResolvedValue({
      id: "position_1",
      organizationId: "org_new",
      referendumId: "ref_1",
      position: VotePosition.YES,
      status: OrganizationReferendumPositionStatus.APPROVED,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const res = await POST(
      makeRequest({ position: "YES", organizationId: "org_1" }),
      makeParams(),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for an invalid position", async () => {
    const res = await POST(
      makeRequest({ position: "MAYBE", organizationId: "org_1" }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "position must be YES, NO, or ABSTAIN",
    });
    expect(mocks.referendumFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or deleted referendum", async () => {
    mocks.referendumFindUnique.mockResolvedValue(null);

    const res = await POST(
      makeRequest({ position: "YES", organizationId: "org_1" }),
      makeParams("missing-ref"),
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      error: "Referendum not found",
    });
    expect(mocks.referendumFindUnique).toHaveBeenCalledWith({
      where: { slug: "missing-ref" },
      select: { id: true, status: true, deletedAt: true },
    });
  });

  it("returns 400 when the referendum is not accepting signatures", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      ...ACTIVE_REFERENDUM,
      status: ReferendumStatus.CLOSED,
    });

    const res = await POST(
      makeRequest({ position: "YES", organizationId: "org_1" }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error:
        "This referendum is not currently accepting organization signatures",
    });
  });

  it("creates a new organization and YES position as approved", async () => {
    const res = await POST(
      makeRequest({
        position: "yes",
        statement: "Move the money from war to medicine.",
        newOrganization: {
          name: "  The Useful Institute  ",
          type: OrgType.NONPROFIT,
          website: "https://useful.example",
          description: "An organization with a spine.",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    expect(mocks.createOrganizationWithOwner).toHaveBeenCalledWith(
      {
        name: "The Useful Institute",
        type: OrgType.NONPROFIT,
        website: "https://useful.example/",
        description: "An organization with a spine.",
        logo: null,
        contactEmail: null,
        status: OrgStatus.APPROVED,
      },
      "user_1",
      { rejectDuplicates: false },
    );
    expect(mocks.positionUpsert).toHaveBeenCalledWith({
      where: {
        organizationId_referendumId: {
          organizationId: "org_new",
          referendumId: "ref_1",
        },
      },
      update: {
        position: VotePosition.YES,
        statement: "Move the money from war to medicine.",
        submittedByUserId: "user_1",
        approvedByUserId: null,
        deletedAt: null,
        status: OrganizationReferendumPositionStatus.APPROVED,
      },
      create: {
        organizationId: "org_new",
        referendumId: "ref_1",
        position: VotePosition.YES,
        statement: "Move the money from war to medicine.",
        submittedByUserId: "user_1",
        status: OrganizationReferendumPositionStatus.APPROVED,
      },
    });
  });

  it("rejects unsafe logo URLs before creating a new organization", async () => {
    const res = await POST(
      makeRequest({
        position: "YES",
        newOrganization: {
          name: "  The Useful Institute  ",
          logo: "data:image/svg+xml,<svg onload=alert(1)>",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid logo URL",
    });
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    expect(mocks.positionUpsert).not.toHaveBeenCalled();
  });

  it("rejects unsafe website URLs before creating a new organization", async () => {
    const res = await POST(
      makeRequest({
        position: "YES",
        newOrganization: {
          name: "  The Useful Institute  ",
          website: "javascript:alert(1)",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid website URL",
    });
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    expect(mocks.positionUpsert).not.toHaveBeenCalled();
  });

  it("lets an existing organization manager sign immediately", async () => {
    mocks.positionUpsert.mockResolvedValue({
      id: "position_existing",
      organizationId: "org_existing",
      referendumId: "ref_1",
      position: VotePosition.YES,
      status: OrganizationReferendumPositionStatus.APPROVED,
    });

    const res = await POST(
      makeRequest({
        position: "YES",
        statement: null,
        organizationId: "org_existing",
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    expect(mocks.canManageOrganization).toHaveBeenCalledWith(
      "user_1",
      "org_existing",
    );
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    expect(mocks.positionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          organizationId: "org_existing",
          status: OrganizationReferendumPositionStatus.APPROVED,
        }),
        update: expect.objectContaining({
          status: OrganizationReferendumPositionStatus.APPROVED,
        }),
      }),
    );
  });

  it("does not let a non-manager sign for an existing organization", async () => {
    mocks.canManageOrganization.mockResolvedValue(false);

    const res = await POST(
      makeRequest({ position: "YES", organizationId: "org_existing" }),
      makeParams(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "You do not have permission to manage this organization",
    });
    expect(mocks.positionUpsert).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "rejected",
      existing: {
        id: "position_removed",
        status: OrganizationReferendumPositionStatus.REJECTED,
        deletedAt: null,
      },
    },
    {
      label: "deleted",
      existing: {
        id: "position_deleted",
        status: OrganizationReferendumPositionStatus.APPROVED,
        deletedAt: new Date("2026-05-01T00:00:00.000Z"),
      },
    },
  ])(
    "keeps $label organization position takedowns in place",
    async ({ existing }) => {
      mocks.positionFindUnique.mockResolvedValue(existing);

      const res = await POST(
        makeRequest({ position: "YES", organizationId: "org_existing" }),
        makeParams(),
      );

      expect(res.status).toBe(409);
      await expect(res.json()).resolves.toEqual({
        error: "This organization's signatory record was removed by an admin.",
      });
      expect(mocks.positionUpsert).not.toHaveBeenCalled();
    },
  );
});
