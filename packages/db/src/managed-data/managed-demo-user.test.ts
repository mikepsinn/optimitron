import { describe, expect, it } from "vitest";
import {
  DEMO_ORGANIZATION_NAME,
  DEMO_ORGANIZATION_SLUG,
  DEMO_ORGANIZATION_SOURCE_REF,
  DEMO_PERSON_SOURCE_REF,
  DEMO_USER_EMAIL,
} from "@optimitron/data/campaign";
import {
  OrgStatus,
  OrgType,
  OrganizationReferendumPositionStatus,
  PersonLifeStatus,
  VotePosition,
  type PrismaClient,
} from "../generated/prisma/client.js";
import { TREATY_REFERENDUM_SLUG } from "../constants.js";
import { syncManagedDemoUser } from "./managed-demo-user.js";

type Row = Record<string, unknown>;

function upsertBy<T extends Row>(
  rows: T[],
  match: (row: T) => boolean,
  create: T,
  update: Partial<T>,
) {
  const existing = rows.find(match);
  if (!existing) {
    rows.push({ ...create });
    return create;
  }
  Object.assign(existing, update);
  return existing;
}

class FakeDemoClient {
  referendum = {
    findUniqueOrThrow: async (args: {
      where: { slug: string };
      select: { id: boolean };
    }) => {
      expect(args.where.slug).toBe(TREATY_REFERENDUM_SLUG);
      expect(args.select.id).toBe(true);
      return { id: "referendum-one-percent" };
    },
  };

  people: Row[] = [
    {
      id: "person-demo",
      email: DEMO_USER_EMAIL,
      displayName: "Old Demo",
      handle: "old-demo",
      isPublic: true,
      sourceRef: null,
    },
  ];

  users: Row[] = [
    {
      id: "user-demo",
      email: DEMO_USER_EMAIL,
      personId: null,
      referralCode: "DEMO",
    },
  ];

  organizations: Row[] = [
    {
      id: "org-demo",
      name: "Old Demo Org",
      slug: DEMO_ORGANIZATION_SLUG,
      sourceRef: null,
      status: OrgStatus.PENDING,
    },
    {
      id: "org-real",
      name: "Real Organization",
      slug: "real-organization",
      sourceRef: null,
      status: OrgStatus.APPROVED,
    },
  ];

  organizationMembers: Row[] = [];
  organizationReferendumPositions: Row[] = [];

  person = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: { email: string };
    }) =>
      upsertBy(
        this.people,
        (row) => row["email"] === args.where.email,
        { id: "person-created", ...args.create },
        args.update,
      ),
  };

  user = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: { email: string };
    }) =>
      upsertBy(
        this.users,
        (row) => row["email"] === args.where.email,
        { id: "user-created", ...args.create },
        args.update,
      ),
    update: async (args: { data: Row; where: { id: string } }) => {
      const row = this.users.find((item) => item["id"] === args.where.id);
      if (!row) throw new Error("missing user");
      Object.assign(row, args.data);
      return row;
    },
  };

  organization = {
    findFirst: async () =>
      this.organizations.find(
        (row) =>
          row["sourceRef"] === DEMO_ORGANIZATION_SOURCE_REF ||
          row["slug"] === DEMO_ORGANIZATION_SLUG,
      ) ?? null,
    update: async (args: { data: Row; where: { id: string } }) => {
      const row = this.organizations.find((item) => item["id"] === args.where.id);
      if (!row) throw new Error("missing organization");
      Object.assign(row, args.data);
      return row;
    },
    create: async (args: { data: Row }) => {
      const row = { id: "org-created", ...args.data };
      this.organizations.push(row);
      return row;
    },
  };

  organizationMember = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: { organizationId_userId: { organizationId: string; userId: string } };
    }) =>
      upsertBy(
        this.organizationMembers,
        (row) =>
          row["organizationId"] ===
            args.where.organizationId_userId.organizationId &&
          row["userId"] === args.where.organizationId_userId.userId,
        { id: "membership-created", ...args.create },
        args.update,
      ),
  };

  organizationReferendumPosition = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: {
        organizationId_referendumId: {
          organizationId: string;
          referendumId: string;
        };
      };
    }) =>
      upsertBy(
        this.organizationReferendumPositions,
        (row) =>
          row["organizationId"] ===
            args.where.organizationId_referendumId.organizationId &&
          row["referendumId"] ===
            args.where.organizationId_referendumId.referendumId,
        { id: "position-created", ...args.create },
        args.update,
      ),
  };
}

describe("syncManagedDemoUser", () => {
  it("does not write during dry-run", async () => {
    const client = new FakeDemoClient();

    await expect(
      syncManagedDemoUser(client as unknown as PrismaClient, { apply: false }),
    ).resolves.toEqual({ dryRun: true, upserted: false });

    expect(client.organizations.find((row) => row["id"] === "org-demo"))
      .toMatchObject({
        name: "Old Demo Org",
        status: OrgStatus.PENDING,
      });
    expect(client.organizationMembers).toHaveLength(0);
  });

  it("syncs the private demo user, demo organization, and owner membership", async () => {
    const client = new FakeDemoClient();

    await expect(
      syncManagedDemoUser(client as unknown as PrismaClient, { apply: true }),
    ).resolves.toEqual({ dryRun: false, upserted: true });

    expect(client.people.find((row) => row["id"] === "person-demo"))
      .toMatchObject({
        displayName: "Demo User",
        handle: "demo",
        isPublic: false,
        lifeStatus: PersonLifeStatus.LIVING,
        sourceRef: DEMO_PERSON_SOURCE_REF,
      });
    expect(client.users.find((row) => row["id"] === "user-demo"))
      .toMatchObject({
        personId: "person-demo",
      });
    expect(client.organizations.find((row) => row["id"] === "org-demo"))
      .toMatchObject({
        creatorId: "user-demo",
        name: DEMO_ORGANIZATION_NAME,
        slug: DEMO_ORGANIZATION_SLUG,
        sourceRef: DEMO_ORGANIZATION_SOURCE_REF,
        status: OrgStatus.APPROVED,
        type: OrgType.NONPROFIT,
      });
    expect(client.organizations.find((row) => row["id"] === "org-real"))
      .toMatchObject({
        name: "Real Organization",
        status: OrgStatus.APPROVED,
      });
    expect(client.organizationMembers).toEqual([
      expect.objectContaining({
        organizationId: "org-demo",
        role: "owner",
        userId: "user-demo",
      }),
    ]);
    expect(client.organizationReferendumPositions).toEqual([
      expect.objectContaining({
        approvedByUserId: "user-demo",
        organizationId: "org-demo",
        position: VotePosition.YES,
        referendumId: "referendum-one-percent",
        status: OrganizationReferendumPositionStatus.APPROVED,
        submittedByUserId: "user-demo",
      }),
    ]);
  });
});
