import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus, OrgType } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  txOrganizationCreate: vi.fn(),
  txOrganizationFindFirst: vi.fn(),
  txOrganizationFindUnique: vi.fn(),
  txOrganizationMemberCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import {
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
});
