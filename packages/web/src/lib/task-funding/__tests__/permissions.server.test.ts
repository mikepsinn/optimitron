import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { OrgStatus, OrgType } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { assertCanPledgeForOrganization } from "../permissions.server";

const TEST_PREFIX = "tf_permissions_";

async function cleanup() {
  await prisma.organizationMember.deleteMany({
    where: {
      OR: [
        { organizationId: { startsWith: TEST_PREFIX } },
        { userId: { startsWith: TEST_PREFIX } },
      ],
    },
  });
  await prisma.organization.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.user.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
}

async function createUser(suffix: string, isAdmin = false) {
  return prisma.user.create({
    data: {
      id: `${TEST_PREFIX}user_${suffix}`,
      email: `${TEST_PREFIX}${suffix}@example.test`,
      isAdmin,
    },
  });
}

async function createOrganization(creatorId: string) {
  return prisma.organization.create({
    data: {
      id: `${TEST_PREFIX}org`,
      name: "Permission Test Org",
      slug: `${TEST_PREFIX}org`,
      type: OrgType.OTHER,
      status: OrgStatus.APPROVED,
      creatorId,
    },
  });
}

beforeEach(cleanup);
afterAll(cleanup);

describe("assertCanPledgeForOrganization", () => {
  it("allows organization owners to pledge", async () => {
    const creator = await createUser("creator");
    const owner = await createUser("owner");
    const org = await createOrganization(creator.id);
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: owner.id, role: "owner" },
    });

    await expect(
      assertCanPledgeForOrganization(owner.id, org.id),
    ).resolves.toBeUndefined();
  });

  it("allows organization admins to pledge", async () => {
    const creator = await createUser("creator");
    const admin = await createUser("admin");
    const org = await createOrganization(creator.id);
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: admin.id, role: "admin" },
    });

    await expect(
      assertCanPledgeForOrganization(admin.id, org.id),
    ).resolves.toBeUndefined();
  });

  it("rejects ordinary organization members", async () => {
    const creator = await createUser("creator");
    const member = await createUser("member");
    const org = await createOrganization(creator.id);
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: member.id, role: "member" },
    });

    await expect(
      assertCanPledgeForOrganization(member.id, org.id),
    ).rejects.toThrow(/permission/i);
  });

  it("allows organization creators and site admins", async () => {
    const creator = await createUser("creator");
    const siteAdmin = await createUser("site_admin", true);
    const org = await createOrganization(creator.id);

    await expect(
      assertCanPledgeForOrganization(creator.id, org.id),
    ).resolves.toBeUndefined();
    await expect(
      assertCanPledgeForOrganization(siteAdmin.id, org.id),
    ).resolves.toBeUndefined();
  });
});
