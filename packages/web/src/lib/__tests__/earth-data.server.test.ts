import {
  OrganizationReferendumPositionStatus,
  ReferendumStatus,
  ReferendumVoteSource,
  VotePosition,
} from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  referendumFindFirst: vi.fn(),
  referendumVoteFindUnique: vi.fn(),
  referendumVoteCreate: vi.fn(),
  referendumVoteUpdate: vi.fn(),
  referendumVoteUpsert: vi.fn(),
  organizationPositionFindUnique: vi.fn(),
  organizationPositionUpsert: vi.fn(),
  organizationFindMany: vi.fn(),
  getOrganizationAccessWhere: vi.fn(),
  canManageOrganization: vi.fn(),
  createOrganizationWithOwner: vi.fn(),
  findOrCreateOrganization: vi.fn(),
  ensurePersonForUser: vi.fn(),
  findOrCreatePerson: vi.fn(),
  mergeDuplicatePerson: vi.fn(),
  personFindFirst: vi.fn(),
}));

vi.mock("../organization.server", () => ({
  canManageOrganization: mocks.canManageOrganization,
  createOrganizationWithOwner: mocks.createOrganizationWithOwner,
  findOrCreateOrganization: mocks.findOrCreateOrganization,
  getOrganizationAccessWhere: mocks.getOrganizationAccessWhere,
}));

vi.mock("../person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
  findOrCreatePerson: mocks.findOrCreatePerson,
  mergeDuplicatePerson: mocks.mergeDuplicatePerson,
}));

vi.mock("../prisma", () => ({
  prisma: {
    organization: {
      findMany: mocks.organizationFindMany,
    },
    organizationReferendumPosition: {
      findUnique: mocks.organizationPositionFindUnique,
      upsert: mocks.organizationPositionUpsert,
    },
    person: {
      findFirst: mocks.personFindFirst,
    },
    referendum: {
      findFirst: mocks.referendumFindFirst,
    },
    referendumVote: {
      create: mocks.referendumVoteCreate,
      findUnique: mocks.referendumVoteFindUnique,
      update: mocks.referendumVoteUpdate,
      upsert: mocks.referendumVoteUpsert,
    },
  },
}));

import {
  addMemorialEvidence,
  castReferendumVote,
  getPerson,
  recordRepresentedReferendumVote,
  searchOrganizations,
  signReferendumAsOrganization,
  upsertOrganizationInputSchema,
  upsertMemorialPersonInputSchema,
} from "../earth-data.server";

describe("earth-data server", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.referendumFindFirst.mockResolvedValue({
      id: "referendum-1",
      status: ReferendumStatus.ACTIVE,
    });
    mocks.referendumVoteUpsert.mockResolvedValue({
      id: "vote-1",
      voteSource: ReferendumVoteSource.REPRESENTED,
    });
    mocks.referendumVoteUpdate.mockResolvedValue({
      id: "vote-1",
      voteSource: ReferendumVoteSource.REPRESENTED,
    });
    mocks.referendumVoteCreate.mockResolvedValue({
      id: "vote-1",
      voteSource: ReferendumVoteSource.REPRESENTED,
    });
    mocks.organizationPositionFindUnique.mockResolvedValue(null);
    mocks.organizationPositionUpsert.mockResolvedValue({
      id: "position-1",
      status: OrganizationReferendumPositionStatus.APPROVED,
    });
    mocks.canManageOrganization.mockResolvedValue(true);
    mocks.ensurePersonForUser.mockResolvedValue({ id: "person-self" });
    mocks.personFindFirst.mockResolvedValue(null);
    mocks.getOrganizationAccessWhere.mockReturnValue({
      OR: [{ visibility: "PUBLIC" }],
    });
  });

  it("keeps organization access restrictions when applying a search query", async () => {
    await searchOrganizations({
      allowedOrganizationIds: ["organization-1"],
      query: "clinic",
      userId: "user-1",
    });

    expect(mocks.getOrganizationAccessWhere).toHaveBeenCalledWith("user-1", [
      "organization-1",
    ]);
    expect(mocks.organizationFindMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { OR: [{ visibility: "PUBLIC" }] },
          {
            OR: [
              { name: { contains: "clinic", mode: "insensitive" } },
              { slug: { contains: "clinic", mode: "insensitive" } },
              { sourceRef: { contains: "clinic", mode: "insensitive" } },
              { website: { contains: "clinic", mode: "insensitive" } },
            ],
          },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });
  });

  it("refuses to overwrite a self vote when recording a represented vote", async () => {
    mocks.referendumVoteFindUnique.mockResolvedValue({
      id: "vote-self",
      userId: "voter-user",
      voteSource: ReferendumVoteSource.SELF,
    });

    await expect(
      recordRepresentedReferendumVote({
        personId: "person-1",
        userId: "agent-user",
      }),
    ).rejects.toThrow("Cannot overwrite an official self vote");

    expect(mocks.referendumVoteCreate).not.toHaveBeenCalled();
    expect(mocks.referendumVoteUpdate).not.toHaveBeenCalled();
  });

  it("refuses to update another user's represented vote", async () => {
    mocks.referendumVoteFindUnique.mockResolvedValue({
      id: "vote-represented",
      userId: "other-user",
      voteSource: ReferendumVoteSource.REPRESENTED,
    });

    await expect(
      recordRepresentedReferendumVote({
        personId: "person-1",
        userId: "agent-user",
      }),
    ).rejects.toThrow(
      "Only the original representative can update this represented vote",
    );

    expect(mocks.referendumVoteCreate).not.toHaveBeenCalled();
    expect(mocks.referendumVoteUpdate).not.toHaveBeenCalled();
  });

  it("allows the original representative to update their represented vote", async () => {
    mocks.referendumVoteFindUnique.mockResolvedValue({
      id: "vote-represented",
      userId: "agent-user",
      voteSource: ReferendumVoteSource.REPRESENTED,
    });

    await recordRepresentedReferendumVote({
      answer: VotePosition.YES,
      personId: "person-1",
      userId: "agent-user",
    });

    expect(mocks.referendumVoteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "vote-represented" },
        data: expect.objectContaining({
          voteSource: ReferendumVoteSource.REPRESENTED,
        }),
      }),
    );
  });

  it("creates a represented vote when the person has no existing vote", async () => {
    mocks.referendumVoteFindUnique.mockResolvedValue(null);

    await recordRepresentedReferendumVote({
      answer: VotePosition.YES,
      personId: "person-1",
      publicComment: "She would vote yes.",
      userId: "agent-user",
    });

    expect(mocks.referendumVoteCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        answer: VotePosition.YES,
        isPublic: true,
        personId: "person-1",
        publicComment: "She would vote yes.",
        referendumId: "referendum-1",
        userId: "agent-user",
        voteSource: ReferendumVoteSource.REPRESENTED,
      }),
    });
  });

  it("keeps self-vote updates tied to the casting user and public official surface", async () => {
    mocks.referendumVoteUpsert.mockResolvedValue({
      id: "self-vote",
      voteSource: ReferendumVoteSource.SELF,
    });

    await castReferendumVote({
      answer: VotePosition.YES,
      publicComment: "Yes.",
      userId: "self-user",
    });

    expect(mocks.referendumVoteUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          isPublic: true,
          userId: "self-user",
          voteSource: ReferendumVoteSource.SELF,
        }),
        create: expect.objectContaining({
          isPublic: true,
          personId: "person-self",
          userId: "self-user",
          voteSource: ReferendumVoteSource.SELF,
        }),
      }),
    );
  });

  it("does not restore organization signatory rows removed by an admin", async () => {
    mocks.organizationPositionFindUnique.mockResolvedValue({
      deletedAt: null,
      status: OrganizationReferendumPositionStatus.REJECTED,
    });

    await expect(
      signReferendumAsOrganization({
        organizationId: "org-1",
        submittedByUserId: "manager-user",
      }),
    ).rejects.toThrow("signatory record was removed by an admin");

    expect(mocks.organizationPositionUpsert).not.toHaveBeenCalled();
  });

  it("rejects unsafe organization square logo URLs in shared signatory input", async () => {
    await expect(
      signReferendumAsOrganization({
        squareLogoUrl: "data:image/svg+xml,<svg onload=alert(1)>",
        newOrganizationName: "Unsafe Logo Org",
        submittedByUserId: "manager-user",
      }),
    ).rejects.toThrow("Use an http(s) URL.");

    expect(mocks.createOrganizationWithOwner).not.toHaveBeenCalled();
    expect(mocks.organizationPositionUpsert).not.toHaveBeenCalled();
  });

  it("rejects unsafe organization square logo URLs in shared organization upserts", () => {
    expect(() =>
      upsertOrganizationInputSchema.parse({
        squareLogoUrl: "javascript:alert(1)",
        name: "Unsafe Logo Org",
      }),
    ).toThrow("Use an http(s) URL.");
  });

  it("rejects private or sensitive memorial evidence through the shared writer", async () => {
    await expect(
      addMemorialEvidence({
        containsSensitiveData: true,
        memorialId: "memorial-1",
        sourceUrl: "https://example.org/source.pdf",
      }),
    ).rejects.toThrow(
      "Evidence tools only accept public non-sensitive sources",
    );

    await expect(
      addMemorialEvidence({
        isPublic: false,
        memorialId: "memorial-1",
        sourceUrl: "https://example.org/source.pdf",
      }),
    ).rejects.toThrow("Evidence tools only accept public evidence");
  });

  it("does not create a represented treaty vote from memorial upsert unless explicitly requested", () => {
    const parsed = upsertMemorialPersonInputSchema.parse({
      dateOfDeath: "2024-01-01",
      deathCountryCode: "PS",
      displayName: "A sourced casualty",
      sourceKey: "casualty:example:1",
      sourceKind: "PUBLIC_IMPORT",
      sourceUrl: "https://example.org/casualty",
    });

    expect(parsed.recordTreatyVote).toBe(false);
  });

  it("normalizes invalid Date instances before they can reach Prisma", () => {
    const parsed = upsertMemorialPersonInputSchema.parse({
      birthDate: new Date("not a real date"),
      displayName: "Living plaintiff",
      lifeStatus: "LIVING",
    });

    expect(parsed.birthDate).toBeNull();
  });

  it("filters getPerson to public person data by default", async () => {
    await getPerson({ idOrHandle: "person-1" });

    expect(mocks.personFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          isPublic: true,
        }),
      }),
    );
  });
});
