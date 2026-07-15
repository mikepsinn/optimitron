import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus, OrgType } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  organizationFindFirst: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationMemberFindFirst: vi.fn(),
  organizationMemberUpsert: vi.fn(),
  transaction: vi.fn(),
  txOrganizationCreate: vi.fn(),
  txOrganizationFindFirst: vi.fn(),
  txOrganizationFindUnique: vi.fn(),
  txOrganizationMemberCreate: vi.fn(),
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
  },
}));

import {
  canManageOrganization,
  canUserViewOrganization,
  createOrganizationWithOwner,
  upsertTrustedOrganization,
} from "@/lib/organization.server";

describe("organization.server", () => {
  beforeEach(() => {
    mocks.transaction.mockReset();
    mocks.txOrganizationCreate.mockReset();
    mocks.txOrganizationFindFirst.mockReset();
    mocks.txOrganizationFindUnique.mockReset();
    mocks.txOrganizationMemberCreate.mockReset();
    mocks.organizationFindUnique.mockReset();
    mocks.organizationFindFirst.mockReset();
    mocks.organizationMemberFindFirst.mockReset();
    mocks.organizationMemberUpsert.mockReset();
  });

  it("creates approved orgs with an owner membership for public creation", async () => {
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
    mocks.txOrganizationFindUnique.mockResolvedValue(null);
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_1" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });

    await createOrganizationWithOwner({ name: "Test Org" }, "user_1");

    expect(mocks.txOrganizationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: "user_1",
          name: "Test Org",
          status: OrgStatus.APPROVED,
        }),
      }),
    );
    expect(mocks.txOrganizationMemberCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "org_1",
        role: "owner",
        userId: "user_1",
      },
    });
  });

  it("creates approved MCP organizations with generated slugs and strict uniqueness", async () => {
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
    mocks.txOrganizationCreate.mockResolvedValue({ id: "org_foundation" });
    mocks.txOrganizationMemberCreate.mockResolvedValue({ id: "membership_1" });

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
        id: "org_1",
        deletedAt: null,
        OR: [{ status: OrgStatus.APPROVED }],
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
          { status: OrgStatus.APPROVED },
          { creatorId: "user_1" },
          { members: { some: { userId: "user_1" } } },
        ],
      },
      select: { id: true },
    });
  });
});
