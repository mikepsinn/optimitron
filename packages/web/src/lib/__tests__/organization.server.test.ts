import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContentVisibility,
  OrganizationMemberRole,
  OrgStatus,
  OrgType,
  TaskClaimPolicy,
} from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  organizationFindFirst: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationMemberFindFirst: vi.fn(),
  organizationMemberUpsert: vi.fn(),
  taskFindFirst: vi.fn(),
  transaction: vi.fn(),
  txOrganizationCreate: vi.fn(),
  txOrganizationFindFirst: vi.fn(),
  txOrganizationFindUnique: vi.fn(),
  txOrganizationMemberCreate: vi.fn(),
  txTaskCreate: vi.fn(),
  txTaskFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    organization: {
      findFirst: mocks.organizationFindFirst,
      findUnique: mocks.organizationFindUnique,
    },
    organizationMember: {
      findFirst: mocks.organizationMemberFindFirst,
      upsert: mocks.organizationMemberUpsert,
    },
    task: {
      findFirst: mocks.taskFindFirst,
    },
  },
}));

import {
  assertOrganizationCanBePrivate,
  assertOrganizationCanBePubliclyReferenced,
  canManageOrganization,
  canUserViewOrganization,
  createOrganizationWithOwner,
  getOrganizationAccessWhere,
  PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR,
  upsertTrustedOrganization,
} from "@/lib/organization.server";

describe("organization.server", () => {
  const makeTx = () => ({
    organization: {
      create: mocks.txOrganizationCreate,
      findFirst: mocks.txOrganizationFindFirst,
      findUnique: mocks.txOrganizationFindUnique,
    },
    organizationMember: {
      create: mocks.txOrganizationMemberCreate,
    },
    task: {
      create: mocks.txTaskCreate,
      findFirst: mocks.txTaskFindFirst,
    },
  });

  // The planning-branch ensure and the duplicate-name guard both go through
  // tx.organization.findFirst; the membership lookup is the one with a
  // `members` filter.
  const routeOrganizationFindFirst = (organization: {
    id: string;
    name: string;
  }) => {
    mocks.txOrganizationFindFirst.mockImplementation(
      async (args: { where?: { members?: unknown } }) =>
        args?.where?.members ? organization : null,
    );
  };

  const routeTaskFindFirst = () => {
    mocks.txTaskFindFirst.mockImplementation(
      async (args: { where?: { id?: string } }) =>
        args?.where?.id === "optimize-earth" ? { id: "optimize-earth" } : null,
    );
  };

  beforeEach(() => {
    mocks.transaction.mockReset();
    mocks.txOrganizationCreate.mockReset();
    mocks.txOrganizationFindFirst.mockReset();
    mocks.txOrganizationFindUnique.mockReset();
    mocks.txOrganizationMemberCreate.mockReset();
    mocks.txTaskCreate.mockReset();
    mocks.txTaskFindFirst.mockReset();
    mocks.organizationFindUnique.mockReset();
    mocks.organizationFindFirst.mockReset();
    mocks.organizationMemberFindFirst.mockReset();
    mocks.organizationMemberUpsert.mockReset();
    mocks.taskFindFirst.mockReset();
  });

  it("creates approved orgs with an owner membership and planning root for public creation", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback(makeTx()),
    );
    routeOrganizationFindFirst({ id: "org_1", name: "Test Org" });
    routeTaskFindFirst();
    mocks.txOrganizationFindUnique.mockResolvedValue(null);
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_1" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });
    mocks.txTaskCreate.mockResolvedValue({
      id: "task_1",
      taskKey: "planner:organization:org_1",
      title: "Optimize Test Org",
    });

    await createOrganizationWithOwner({ name: "Test Org" }, "user_1");

    expect(mocks.txOrganizationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: "user_1",
          name: "Test Org",
          status: OrgStatus.APPROVED,
          visibility: ContentVisibility.PUBLIC,
        }),
      }),
    );
    expect(mocks.txOrganizationMemberCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "org_1",
        role: OrganizationMemberRole.OWNER,
        userId: "user_1",
      },
    });
    // The planning root is created in the same transaction with the exact
    // shape the lazy ensure validates: rooted, private, org-owned.
    expect(mocks.txTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          createdByUserId: "user_1",
          isPublic: false,
          ownerOrganizationId: "org_1",
          parentTaskId: "optimize-earth",
          taskKey: "planner:organization:org_1",
          title: "Optimize Test Org",
        }),
      }),
    );
  });

  it("fails org creation when the planning-root ensure fails for any other reason", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback(makeTx()),
    );
    // Membership lookup comes back empty → the ensure throws its access
    // error, which must NOT be swallowed like the missing-root case.
    mocks.txOrganizationFindFirst.mockResolvedValue(null);
    routeTaskFindFirst();
    mocks.txOrganizationFindUnique.mockResolvedValue(null);
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_1" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });

    await expect(
      createOrganizationWithOwner({ name: "Test Org" }, "user_1"),
    ).rejects.toThrow(
      "Organization planning requires OWNER, ADMIN, or MEMBER access.",
    );
    expect(mocks.txTaskCreate).not.toHaveBeenCalled();
  });

  it("still creates the org when the optimize-earth root is not seeded", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback(makeTx()),
    );
    routeOrganizationFindFirst({ id: "org_1", name: "Test Org" });
    mocks.txTaskFindFirst.mockResolvedValue(null);
    mocks.txOrganizationFindUnique.mockResolvedValue(null);
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_1" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });

    const organization = await createOrganizationWithOwner(
      { name: "Test Org" },
      "user_1",
    );

    expect(organization).toEqual({ id: "org_1" });
    expect(mocks.txTaskCreate).not.toHaveBeenCalled();
  });

  it("creates approved MCP organizations with generated slugs and strict uniqueness", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback(makeTx()),
    );
    routeOrganizationFindFirst({
      id: "org_foundation",
      name: "Survival and Flourishing Fund",
    });
    routeTaskFindFirst();
    mocks.txOrganizationFindUnique.mockResolvedValue(null);
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_foundation" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });
    mocks.txTaskCreate.mockResolvedValue({
      id: "task_1",
      taskKey: "planner:organization:org_foundation",
      title: "Optimize Survival and Flourishing Fund",
    });

    await createOrganizationWithOwner(
      {
        name: "Survival and Flourishing Fund",
        status: OrgStatus.APPROVED,
        type: OrgType.FOUNDATION,
        website: "https://survivalandflourishing.fund",
      },
      "user_1",
      { rejectDuplicates: true },
    );

    expect(mocks.txOrganizationFindFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        name: { equals: "Survival and Flourishing Fund", mode: "insensitive" },
      },
      select: { name: true },
    });
    expect(mocks.txOrganizationFindUnique).toHaveBeenCalledWith({
      where: { slug: "survival-and-flourishing-fund" },
      select: { slug: true },
    });
    expect(mocks.txOrganizationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: "user_1",
          name: "Survival and Flourishing Fund",
          slug: "survival-and-flourishing-fund",
          status: OrgStatus.APPROVED,
          type: OrgType.FOUNDATION,
        }),
      }),
    );
  });

  it("rejects duplicate organization names when strict uniqueness is requested", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: mocks.txOrganizationCreate,
          findFirst: mocks.txOrganizationFindFirst,
          findUnique: mocks.txOrganizationFindUnique,
        },
        organizationMember: {
          create: mocks.txOrganizationMemberCreate,
        },
      }),
    );
    mocks.txOrganizationFindFirst.mockResolvedValue({
      name: "Open Philanthropy",
    });

    await expect(
      createOrganizationWithOwner(
        { name: "Open Philanthropy", type: OrgType.FOUNDATION },
        "user_1",
        { rejectDuplicates: true },
      ),
    ).rejects.toThrow("Organization name already exists: Open Philanthropy");
    expect(mocks.txOrganizationCreate).not.toHaveBeenCalled();
  });

  it("rejects duplicate organization names by default", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: mocks.txOrganizationCreate,
          findFirst: mocks.txOrganizationFindFirst,
          findUnique: mocks.txOrganizationFindUnique,
        },
        organizationMember: {
          create: mocks.txOrganizationMemberCreate,
        },
      }),
    );
    mocks.txOrganizationFindFirst.mockResolvedValue({
      name: "Open Philanthropy",
    });

    await expect(
      createOrganizationWithOwner(
        { name: "Open Philanthropy", type: OrgType.FOUNDATION },
        "user_1",
      ),
    ).rejects.toThrow("Organization name already exists: Open Philanthropy");
    expect(mocks.txOrganizationCreate).not.toHaveBeenCalled();
  });

  it("rejects unsafe organization square logo URLs before creating records", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: mocks.txOrganizationCreate,
          findFirst: mocks.txOrganizationFindFirst,
          findUnique: mocks.txOrganizationFindUnique,
        },
        organizationMember: {
          create: mocks.txOrganizationMemberCreate,
        },
      }),
    );
    mocks.txOrganizationFindFirst.mockResolvedValue(null);
    mocks.txOrganizationFindUnique.mockResolvedValue(null);

    await expect(
      createOrganizationWithOwner(
        {
          squareLogoUrl: "javascript:alert(1)",
          name: "Unsafe Logo Org",
        },
        "user_1",
      ),
    ).rejects.toThrow("Invalid organization square logo URL");
    expect(mocks.txOrganizationCreate).not.toHaveBeenCalled();
  });

  it("rejects unsafe organization website URLs before creating records", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: mocks.txOrganizationCreate,
          findFirst: mocks.txOrganizationFindFirst,
          findUnique: mocks.txOrganizationFindUnique,
        },
        organizationMember: {
          create: mocks.txOrganizationMemberCreate,
        },
      }),
    );
    mocks.txOrganizationFindFirst.mockResolvedValue(null);
    mocks.txOrganizationFindUnique.mockResolvedValue(null);

    await expect(
      createOrganizationWithOwner(
        {
          name: "Unsafe Website Org",
          website: "javascript:alert(1)",
        },
        "user_1",
      ),
    ).rejects.toThrow("Invalid organization website URL");
    expect(mocks.txOrganizationCreate).not.toHaveBeenCalled();
  });

  it("keeps the trusted upsert path explicitly auto-approved", async () => {
    const db = {
      organization: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "org_2" }),
      },
    };

    await upsertTrustedOrganization({ name: "Imported Org" }, db as never);

    expect(db.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Imported Org",
          status: OrgStatus.APPROVED,
        }),
      }),
    );
  });

  it("guards trusted updates before making an existing organization private", async () => {
    for (const sourceRef of ["notion:organization:1", undefined]) {
      const existing = {
        contactEmail: null,
        deletedAt: null,
        description: null,
        donationUrl: null,
        id: "org_existing",
        name: "Imported Org",
        sourceRef: sourceRef ?? null,
        sourceUrl: null,
        squareLogoUrl: null,
        type: OrgType.OTHER,
        website: null,
        wordmarkLogoUrl: null,
      };
      const update = vi.fn();
      const db = {
        organization: {
          create: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(sourceRef ? null : existing),
          findUnique: vi
            .fn()
            .mockImplementation(async ({ where }) =>
              sourceRef && where.sourceRef === sourceRef ? existing : null,
            ),
          update,
        },
        task: {
          findFirst: vi.fn().mockResolvedValue({ id: "task_public" }),
        },
      };

      await expect(
        upsertTrustedOrganization(
          {
            name: "Imported Org",
            sourceRef,
            visibility: ContentVisibility.PRIVATE,
          },
          db as never,
        ),
      ).rejects.toThrow(PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR);
      expect(update).not.toHaveBeenCalled();
    }
  });

  it("does not treat creatorId as organization management permission without a membership row", async () => {
    mocks.organizationMemberFindFirst.mockResolvedValue(null);
    mocks.organizationFindUnique.mockResolvedValue({ creatorId: "user_1" });

    await expect(canManageOrganization("user_1", "org_1")).resolves.toBe(false);

    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
    expect(mocks.organizationMemberUpsert).not.toHaveBeenCalled();
  });

  it("allows approved organizations to be linked for anonymous viewers", async () => {
    mocks.organizationFindFirst.mockResolvedValue({ id: "org_1" });

    await expect(canUserViewOrganization("org_1", null)).resolves.toBe(true);

    expect(mocks.organizationFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            status: OrgStatus.APPROVED,
            visibility: ContentVisibility.PUBLIC,
          },
        ],
        deletedAt: null,
        id: "org_1",
      },
      select: { id: true },
    });
  });

  it("allows pending organizations only for their creator or members", async () => {
    mocks.organizationFindFirst
      .mockResolvedValueOnce({ id: "org_1" })
      .mockResolvedValueOnce(null);

    await expect(canUserViewOrganization("org_1", "user_1")).resolves.toBe(
      true,
    );
    await expect(canUserViewOrganization("org_1", "outsider")).resolves.toBe(
      false,
    );

    expect(mocks.organizationFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        id: "org_1",
        deletedAt: null,
        OR: [
          {
            status: OrgStatus.APPROVED,
            visibility: ContentVisibility.PUBLIC,
          },
          {
            OR: [
              { creatorId: "user_1" },
              { members: { some: { userId: "user_1" } } },
            ],
          },
        ],
      },
      select: { id: true },
    });
  });

  it("limits private organization reads to the OAuth organization allowlist", () => {
    expect(
      getOrganizationAccessWhere("user_1", ["org_1", "org_1", " "]),
    ).toEqual({
      deletedAt: null,
      OR: [
        {
          status: OrgStatus.APPROVED,
          visibility: ContentVisibility.PUBLIC,
        },
        {
          id: { in: ["org_1"] },
          OR: [
            { creatorId: "user_1" },
            { members: { some: { userId: "user_1" } } },
          ],
        },
      ],
    });
    expect(getOrganizationAccessWhere("user_1", [])).toEqual({
      deletedAt: null,
      OR: [
        {
          status: OrgStatus.APPROVED,
          visibility: ContentVisibility.PUBLIC,
        },
      ],
    });
  });

  it("rejects private organizations at public-reference boundaries", async () => {
    mocks.organizationFindFirst.mockResolvedValue(null);

    await expect(
      assertOrganizationCanBePubliclyReferenced("org_private"),
    ).rejects.toThrow(
      "Public tasks cannot reference a private or unpublished organization.",
    );
    expect(mocks.organizationFindFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        id: "org_private",
        status: OrgStatus.APPROVED,
        visibility: ContentVisibility.PUBLIC,
      },
      select: { id: true },
    });
  });

  it("prevents hiding an organization while a public task identifies it", async () => {
    mocks.taskFindFirst.mockResolvedValue({ id: "task_public" });

    await expect(assertOrganizationCanBePrivate("org_1")).rejects.toThrow(
      PRIVATE_ORGANIZATION_PUBLIC_TASK_ERROR,
    );
    expect(mocks.taskFindFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        isPublic: true,
        OR: [
          { assigneeOrganizationId: "org_1" },
          { ownerOrganizationId: "org_1" },
        ],
      },
      select: { id: true },
    });
  });
});
