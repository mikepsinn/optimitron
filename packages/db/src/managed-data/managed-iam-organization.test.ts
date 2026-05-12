import { describe, expect, it } from "vitest";
import {
  OrgStatus,
  OrgType,
  OrganizationReferendumPositionStatus,
  PersonLifeStatus,
  TaskClaimPolicy,
  TaskStatus,
  VotePosition,
  type PrismaClient,
} from "../generated/prisma/client.js";
import {
  IAM_ORGANIZATION_NAME,
  IAM_ORGANIZATION_SLUG,
  IAM_ORGANIZATION_SOURCE_REF,
  MIKE_SINN_EMAIL,
  MIKE_SINN_PERSON_SOURCE_REF,
  syncManagedIamOrganization,
} from "./managed-iam-organization.js";
import { getOrganizationActivationTaskKey } from "@optimitron/data/campaign";

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

class FakeIamClient {
  referendum = {
    findUniqueOrThrow: async () => ({ id: "referendum-one-percent" }),
  };

  people: Row[] = [
    {
      id: "person-mike",
      email: MIKE_SINN_EMAIL,
      displayName: "Old Name",
      handle: "mike",
      sourceRef: null,
    },
    { id: "person-other", email: "other@example.org", displayName: "Other" },
  ];

  users: Row[] = [
    {
      id: "user-mike",
      email: MIKE_SINN_EMAIL,
      referralCode: "KEEP-ME",
      personId: "person-mike",
    },
    { id: "user-other", email: "other@example.org", referralCode: "OTHER" },
  ];

  organizations: Row[] = [
    {
      id: "org-iam",
      name: IAM_ORGANIZATION_NAME,
      slug: IAM_ORGANIZATION_SLUG,
      sourceRef: null,
      status: OrgStatus.PENDING,
    },
    {
      id: "org-user-created",
      name: "User-created Organization",
      slug: "user-created",
      sourceRef: null,
      status: OrgStatus.APPROVED,
    },
  ];

  organizationMembers: Row[] = [
    {
      id: "membership-other",
      organizationId: "org-user-created",
      userId: "user-other",
      role: "owner",
    },
  ];

  organizationReferendumPositions: Row[] = [];

  tasks: Row[] = [
    {
      id: "task-user-created",
      taskKey: "user-created-task",
      title: "Do not touch",
      deletedAt: null,
    },
  ];

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
  };

  organization = {
    findFirst: async () =>
      this.organizations.find(
        (row) =>
          row["sourceRef"] === IAM_ORGANIZATION_SOURCE_REF ||
          row["slug"] === IAM_ORGANIZATION_SLUG ||
          String(row["name"]).toLowerCase() ===
            IAM_ORGANIZATION_NAME.toLowerCase(),
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

  task = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: { taskKey: string };
    }) =>
      upsertBy(
        this.tasks,
        (row) => row["taskKey"] === args.where.taskKey,
        { id: "task-created", ...args.create },
        args.update,
      ),
  };
}

describe("syncManagedIamOrganization", () => {
  it("does nothing in dry-run mode", async () => {
    const client = new FakeIamClient();

    await expect(
      syncManagedIamOrganization(client as unknown as PrismaClient, {
        apply: false,
      }),
    ).resolves.toEqual({ dryRun: true, upserted: false });

    expect(client.organizations.find((row) => row["id"] === "org-iam")).toMatchObject({
      sourceRef: null,
      status: OrgStatus.PENDING,
    });
    expect(client.tasks).toHaveLength(1);
  });

  it("upserts IAM, Mike, the official treaty position, and the activation task without touching unrelated rows", async () => {
    const client = new FakeIamClient();

    await expect(
      syncManagedIamOrganization(client as unknown as PrismaClient, {
        apply: true,
      }),
    ).resolves.toEqual({ dryRun: false, upserted: true });

    expect(client.people.find((row) => row["email"] === MIKE_SINN_EMAIL)).toMatchObject({
      currentAffiliation: IAM_ORGANIZATION_NAME,
      displayName: "Mike Sinn",
      handle: "mike",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: MIKE_SINN_PERSON_SOURCE_REF,
    });
    expect(client.users.find((row) => row["email"] === MIKE_SINN_EMAIL)).toMatchObject({
      personId: "person-mike",
      referralCode: "KEEP-ME",
    });
    expect(client.organizations.find((row) => row["id"] === "org-iam")).toMatchObject({
      contactEmail: MIKE_SINN_EMAIL,
      name: IAM_ORGANIZATION_NAME,
      slug: IAM_ORGANIZATION_SLUG,
      sourceRef: IAM_ORGANIZATION_SOURCE_REF,
      status: OrgStatus.APPROVED,
      type: OrgType.NONPROFIT,
    });
    expect(client.organizationMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organizationId: "org-iam",
          role: "owner",
          userId: "user-mike",
        }),
        expect.objectContaining({
          organizationId: "org-user-created",
          role: "owner",
          userId: "user-other",
        }),
      ]),
    );
    expect(client.organizationReferendumPositions).toEqual([
      expect.objectContaining({
        approvedByUserId: "user-mike",
        organizationId: "org-iam",
        position: VotePosition.YES,
        referendumId: "referendum-one-percent",
        status: OrganizationReferendumPositionStatus.APPROVED,
        submittedByUserId: "user-mike",
      }),
    ]);
    expect(client.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskKey: "user-created-task",
          title: "Do not touch",
        }),
        expect.objectContaining({
          assigneeOrganizationId: "org-iam",
          claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
          status: TaskStatus.ACTIVE,
          taskKey: getOrganizationActivationTaskKey("org-iam"),
        }),
      ]),
    );
  });
});
