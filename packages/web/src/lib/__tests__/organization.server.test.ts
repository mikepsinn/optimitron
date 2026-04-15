import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrgStatus } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  txOrganizationCreate: vi.fn(),
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
    mocks.txOrganizationFindUnique.mockReset();
    mocks.txOrganizationMemberCreate.mockReset();
  });

  it("creates pending orgs with an owner membership for public creation", async () => {
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        organization: {
          create: mocks.txOrganizationCreate,
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
          status: OrgStatus.PENDING,
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
