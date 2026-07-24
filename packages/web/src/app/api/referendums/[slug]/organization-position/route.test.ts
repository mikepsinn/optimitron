import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationReferendumPositionStatus,
  OrgStatus,
  OrgType,
  ReferendumStatus,
  VotePosition,
} from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  assertOrganizationCanBePubliclyReferenced: vi.fn(),
  canManageOrganization: vi.fn(),
  createOrganizationWithOwner: vi.fn(),
  ensureOrganizationTreatyActivationTask: vi.fn(),
  organizationFindFirst: vi.fn(),
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
    assertOrganizationCanBePubliclyReferenced:
      mocks.assertOrganizationCanBePubliclyReferenced,
    canManageOrganization: mocks.canManageOrganization,
    createOrganizationWithOwner: mocks.createOrganizationWithOwner,
    ensureOrganizationTreatyActivationTask:
      mocks.ensureOrganizationTreatyActivationTask,
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: {
      findUnique: mocks.referendumFindUnique,
    },
    organization: {
      findFirst: mocks.organizationFindFirst,
    },
    organizationReferendumPosition: {
      findUnique: mocks.positionFindUnique,
      upsert: mocks.positionUpsert,
    },
  },
}));

import { POST } from "./route";
import { ORGANIZATION_ACTIVATION_TASK_TITLE } from "@/lib/messaging";

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
    mocks.assertOrganizationCanBePubliclyReferenced.mockResolvedValue(
      undefined,
    );
    mocks.canManageOrganization.mockResolvedValue(true);
    mocks.organizationFindFirst.mockResolvedValue(null);
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_new",
      name: "New Organization",
      slug: "new-organization",
      status: OrgStatus.APPROVED,
    });
    mocks.ensureOrganizationTreatyActivationTask.mockResolvedValue({
      id: "task_1",
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
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
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_new",
      name: "The Useful Institute",
      slug: "the-useful-institute",
      status: OrgStatus.APPROVED,
    });

    const res = await POST(
      makeRequest({
        position: "yes",
        statement: "Move the money from war to medicine.",
        newOrganization: {
          name: "  The Useful Institute  ",
          type: OrgType.NONPROFIT,
          website: "https://useful.example",
          donationUrl: "https://useful.example/donate",
          description: "An organization with a spine.",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      organizationId: "org_new",
      taskId: "task_1",
      success: true,
    });
    expect(mocks.createOrganizationWithOwner).toHaveBeenCalledWith(
      {
        name: "The Useful Institute",
        type: OrgType.NONPROFIT,
        website: "https://useful.example/",
        description: "An organization with a spine.",
        donationUrl: "https://useful.example/donate",
        squareLogoUrl: null,
        wordmarkLogoUrl: null,
        contactEmail: null,
        status: OrgStatus.APPROVED,
      },
      "user_1",
      { rejectDuplicates: false },
    );
    expect(mocks.ensureOrganizationTreatyActivationTask).toHaveBeenCalledWith(
      {
        organizationId: "org_new",
        organizationName: "The Useful Institute",
        organizationSlug: "the-useful-institute",
      },
      "user_1",
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

  it("uses the signed-in demo email when Institute for Accelerated Medicine creates an organization", async () => {
    mocks.requireAuth.mockResolvedValue({
      userEmail: "demo@thinkbynumbers.org",
      userId: "demo-user-id",
    });
    mocks.createOrganizationWithOwner.mockResolvedValue({
      id: "org_iam",
      name: "Institute for Accelerated Medicine",
      slug: "institute-for-accelerated-medicine",
      status: OrgStatus.APPROVED,
    });
    mocks.ensureOrganizationTreatyActivationTask.mockResolvedValue({
      id: "task_iam",
      title: ORGANIZATION_ACTIVATION_TASK_TITLE,
    });

    const res = await POST(
      makeRequest({
        position: "YES",
        newOrganization: {
          name: "Institute for Accelerated Medicine",
          website: "https://acceleratedmedicine.org",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      organizationId: "org_iam",
      taskId: "task_iam",
      success: true,
    });
    expect(mocks.createOrganizationWithOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: "demo@thinkbynumbers.org",
        name: "Institute for Accelerated Medicine",
        status: OrgStatus.APPROVED,
        website: "https://acceleratedmedicine.org/",
      }),
      "demo-user-id",
      { rejectDuplicates: false },
    );
    expect(mocks.ensureOrganizationTreatyActivationTask).toHaveBeenCalledWith(
      {
        organizationId: "org_iam",
        organizationName: "Institute for Accelerated Medicine",
        organizationSlug: "institute-for-accelerated-medicine",
      },
      "demo-user-id",
    );
  });

  it("rejects unsafe square logo URLs before creating a new organization", async () => {
    const res = await POST(
      makeRequest({
        position: "YES",
        newOrganization: {
          name: "  The Useful Institute  ",
          squareLogoUrl: "data:image/svg+xml,<svg onload=alert(1)>",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid square logo URL",
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

  it("rejects unsafe donation URLs before creating a new organization", async () => {
    const res = await POST(
      makeRequest({
        position: "YES",
        newOrganization: {
          name: "  The Useful Institute  ",
          donationUrl: "javascript:alert(1)",
        },
      }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid donation URL",
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
    await expect(res.json()).resolves.toMatchObject({
      organizationId: "org_existing",
      taskId: "task_1",
      success: true,
    });
    expect(mocks.canManageOrganization).toHaveBeenCalledWith(
      "user_1",
      "org_existing",
    );
    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    expect(mocks.ensureOrganizationTreatyActivationTask).toHaveBeenCalledWith(
      {
        organizationId: "org_existing",
        organizationName: undefined,
        organizationSlug: undefined,
      },
      "user_1",
    );
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

  it("keeps the signature when the activation task side effect fails", async () => {
    mocks.ensureOrganizationTreatyActivationTask.mockRejectedValue(
      new Error("email provider exploded"),
    );

    const res = await POST(
      makeRequest({
        position: "YES",
        organizationId: "org_existing",
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      organizationId: "org_existing",
      taskId: null,
      success: true,
    });
    expect(mocks.positionUpsert).toHaveBeenCalled();
  });

  it("does not create an outreach task for non-YES positions", async () => {
    const res = await POST(
      makeRequest({
        position: "ABSTAIN",
        organizationId: "org_existing",
      }),
      makeParams(),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      organizationId: "org_existing",
      taskId: null,
      success: true,
    });
    expect(mocks.ensureOrganizationTreatyActivationTask).not.toHaveBeenCalled();
  });

  it("rejects a public referendum signature from a private organization", async () => {
    mocks.assertOrganizationCanBePubliclyReferenced.mockRejectedValue(
      new Error("Organization is private"),
    );

    const res = await POST(
      makeRequest({ position: "YES", organizationId: "org_private" }),
      makeParams(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error:
        "Organization must be approved and public before signing a public referendum",
    });
    expect(
      mocks.assertOrganizationCanBePubliclyReferenced,
    ).toHaveBeenCalledWith("org_private");
    expect(mocks.positionUpsert).not.toHaveBeenCalled();
    expect(mocks.ensureOrganizationTreatyActivationTask).not.toHaveBeenCalled();
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
