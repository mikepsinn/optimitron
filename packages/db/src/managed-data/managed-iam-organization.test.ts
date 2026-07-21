import { describe, expect, it } from "vitest";
import {
  OrgStatus,
  OrgType,
  OrganizationReferendumPositionStatus,
  OrganizationNameKind,
  PersonLifeStatus,
  TaskClaimPolicy,
  TaskStatus,
  VotePosition,
  type PrismaClient,
} from "../generated/prisma/client.js";
import {
  AMF_LEGAL_NAME,
  IC2EWD_ORGANIZATION_NAME,
  IAM_ORGANIZATION_NAME,
  IAM_ORGANIZATION_NAMES,
  IAM_ORGANIZATION_NAMES_VERIFIED_AT_ISO,
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
      name: AMF_LEGAL_NAME,
      slug: "accelerated-medicine-foundation",
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
      role: "OWNER",
    },
  ];

  organizationReferendumPositions: Row[] = [];

  organizationNames: Row[] = [];

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
          [
            AMF_LEGAL_NAME,
            IAM_ORGANIZATION_NAME,
            IC2EWD_ORGANIZATION_NAME,
          ].some(
            (name) =>
              String(row["name"]).toLowerCase() === name.toLowerCase(),
          ),
      ) ?? null,
    update: async (args: { data: Row; where: { id: string } }) => {
      const row = this.organizations.find(
        (item) => item["id"] === args.where.id,
      );
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
      where: {
        organizationId_userId: { organizationId: string; userId: string };
      };
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

  organizationName = {
    findFirst: async (args: {
      where: { OR: Row[] };
      select: { id: true };
    }) =>
      this.organizationNames.find((row) =>
        args.where.OR.some(
          (condition) =>
            (condition["sourceRef"] &&
              row["sourceRef"] === condition["sourceRef"]) ||
            (row["organizationId"] === condition["organizationId"] &&
              row["kind"] === condition["kind"] &&
              row["normalizedName"] === condition["normalizedName"]),
        ),
      ) ?? null,
    update: async (args: { data: Row; where: { id: string } }) => {
      const row = this.organizationNames.find(
        (item) => item["id"] === args.where.id,
      );
      if (!row) throw new Error("missing organization name");
      Object.assign(row, args.data);
      return row;
    },
    create: async (args: { data: Row }) => {
      const row = {
        id: `organization-name-${this.organizationNames.length + 1}`,
        ...args.data,
      };
      this.organizationNames.push(row);
      return row;
    },
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

    expect(
      client.organizations.find((row) => row["id"] === "org-iam"),
    ).toMatchObject({
      sourceRef: null,
      status: OrgStatus.PENDING,
    });
    expect(client.tasks).toHaveLength(1);
    expect(client.organizationNames).toHaveLength(0);
  });

  it("upserts IAM, Mike, the official treaty position, and the activation task without touching unrelated rows", async () => {
    const client = new FakeIamClient();

    await expect(
      syncManagedIamOrganization(client as unknown as PrismaClient, {
        apply: true,
      }),
    ).resolves.toEqual({ dryRun: false, upserted: true });

    expect(
      client.people.find((row) => row["email"] === MIKE_SINN_EMAIL),
    ).toMatchObject({
      currentAffiliation: IAM_ORGANIZATION_NAME,
      displayName: "Mike Sinn",
      handle: "mike",
      isPublic: true,
      lifeStatus: PersonLifeStatus.LIVING,
      sourceRef: MIKE_SINN_PERSON_SOURCE_REF,
    });
    expect(
      client.users.find((row) => row["email"] === MIKE_SINN_EMAIL),
    ).toMatchObject({
      isAdmin: true,
      personId: "person-mike",
      referralCode: "KEEP-ME",
    });
    expect(
      client.organizations.find((row) => row["id"] === "org-iam"),
    ).toMatchObject({
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
          role: "OWNER",
          userId: "user-mike",
        }),
        expect.objectContaining({
          organizationId: "org-user-created",
          role: "OWNER",
          userId: "user-other",
        }),
      ]),
    );
    expect(client.organizationNames).toHaveLength(
      IAM_ORGANIZATION_NAMES.length,
    );
    expect(client.organizationNames).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: OrganizationNameKind.LEGAL,
          name: AMF_LEGAL_NAME,
          normalizedName: "accelerated medicine foundation inc",
          organizationId: "org-iam",
          verifiedAt: new Date(IAM_ORGANIZATION_NAMES_VERIFIED_AT_ISO),
          verifiedByUserId: "user-mike",
        }),
        expect.objectContaining({
          kind: OrganizationNameKind.DBA,
          name: IAM_ORGANIZATION_NAME,
          organizationId: "org-iam",
        }),
        expect.objectContaining({
          kind: OrganizationNameKind.DBA,
          name: IC2EWD_ORGANIZATION_NAME,
          organizationId: "org-iam",
        }),
        expect.objectContaining({
          kind: OrganizationNameKind.ACRONYM,
          name: "IC2EWD",
          normalizedName: "ic2ewd",
          organizationId: "org-iam",
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

    const verifiedAtBeforeRepeat = client.organizationNames.map(
      (row) => row["verifiedAt"],
    );

    await syncManagedIamOrganization(client as unknown as PrismaClient, {
      apply: true,
    });

    expect(client.organizations).toHaveLength(2);
    expect(client.organizationNames).toHaveLength(
      IAM_ORGANIZATION_NAMES.length,
    );
    expect(client.organizationNames.map((row) => row["verifiedAt"])).toEqual(
      verifiedAtBeforeRepeat,
    );
  });
});
