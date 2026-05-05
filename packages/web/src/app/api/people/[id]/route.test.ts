import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  conditionCreate: vi.fn(),
  conditionUpdate: vi.fn(),
  ensurePersonForUser: vi.fn(),
  globalVariableFindFirst: vi.fn(),
  memorialEvidenceCreate: vi.fn(),
  memorialEvidenceFindMany: vi.fn(),
  memorialEvidenceUpdate: vi.fn(),
  memorialEvidenceUpdateMany: vi.fn(),
  memorialFindUnique: vi.fn(),
  memorialResponsiblePartyUpdateMany: vi.fn(),
  memorialSubmissionCreate: vi.fn(),
  memorialSubmissionFindFirst: vi.fn(),
  memorialSubmissionUpdate: vi.fn(),
  memorialSubmissionUpdateMany: vi.fn(),
  memorialUpdate: vi.fn(),
  memorialUpsert: vi.fn(),
  personFindUnique: vi.fn(),
  personUpdate: vi.fn(),
  referendumFindUnique: vi.fn(),
  relationshipCreate: vi.fn(),
  relationshipFindFirst: vi.fn(),
  relationshipUpdate: vi.fn(),
  requireAuth: vi.fn(),
  subjectUpsert: vi.fn(),
  transaction: vi.fn(),
  voteFindFirst: vi.fn(),
  voteUpdate: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    person: { findUnique: mocks.personFindUnique },
    referendum: { findUnique: mocks.referendumFindUnique },
    referendumVote: { findFirst: mocks.voteFindFirst },
  },
}));

vi.mock("@/lib/subject.server", () => ({
  ensureSubjectForPerson: mocks.subjectUpsert,
}));

import { PATCH } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/people/person_1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

function params(id = "person_1") {
  return { params: Promise.resolve({ id }) };
}

function tx() {
  return {
    globalVariable: { findFirst: mocks.globalVariableFindFirst },
    person: { update: mocks.personUpdate },
    personCondition: {
      create: mocks.conditionCreate,
      update: mocks.conditionUpdate,
    },
    personMemorial: {
      findUnique: mocks.memorialFindUnique,
      update: mocks.memorialUpdate,
      upsert: mocks.memorialUpsert,
    },
    personMemorialEvidence: {
      create: mocks.memorialEvidenceCreate,
      findMany: mocks.memorialEvidenceFindMany,
      update: mocks.memorialEvidenceUpdate,
      updateMany: mocks.memorialEvidenceUpdateMany,
    },
    personMemorialResponsibleParty: {
      updateMany: mocks.memorialResponsiblePartyUpdateMany,
    },
    personMemorialSubmission: {
      create: mocks.memorialSubmissionCreate,
      findFirst: mocks.memorialSubmissionFindFirst,
      update: mocks.memorialSubmissionUpdate,
      updateMany: mocks.memorialSubmissionUpdateMany,
    },
    personRelationship: {
      create: mocks.relationshipCreate,
      findFirst: mocks.relationshipFindFirst,
      update: mocks.relationshipUpdate,
    },
    referendumVote: { update: mocks.voteUpdate },
    subject: { upsert: mocks.subjectUpsert },
  };
}

describe("PATCH /api/people/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.personFindUnique.mockResolvedValue({
      birthDate: null,
      conditions: [{ conditionName: "cancer", id: "condition_1" }],
      createdByUserId: "user_1",
      deathDate: new Date("2020-01-02T00:00:00.000Z"),
      displayName: "Aunt Jane",
      id: "person_1",
      image: null,
      isPublic: true,
      lifeStatus: "DECEASED",
      memorial: {
        causeCategory: "DISEASE",
        civilianStatus: "CIVILIAN",
        deathCountryCode: "US",
        deletedAt: null,
        id: "memorial_1",
        submissions: [
          {
            consentCourtEvidence: true,
            id: "submission_1",
            memorialMessage: "She taught everyone to fix broken things.",
          },
        ],
      },
    });
    mocks.referendumFindUnique.mockResolvedValue({ id: "ref_1" });
    mocks.voteFindFirst.mockResolvedValue({
      id: "vote_1",
      publicComment: "old note",
    });
    mocks.personUpdate.mockResolvedValue({
      displayName: "Aunt Jane",
      id: "person_1",
      image: null,
      isPublic: true,
      lifeStatus: "DECEASED",
    });
    mocks.conditionUpdate.mockResolvedValue({ id: "condition_1" });
    mocks.ensurePersonForUser.mockResolvedValue({ id: "person_user" });
    mocks.relationshipFindFirst.mockResolvedValue({ id: "relationship_1" });
    mocks.memorialFindUnique.mockResolvedValue({ id: "memorial_1" });
    mocks.memorialUpsert.mockResolvedValue({ id: "memorial_1" });
    mocks.memorialSubmissionFindFirst.mockResolvedValue({ id: "submission_1" });
    mocks.memorialEvidenceFindMany.mockResolvedValue([]);
    mocks.memorialEvidenceCreate.mockResolvedValue({ id: "evidence_new" });
    mocks.memorialEvidenceUpdate.mockResolvedValue({ id: "evidence_1" });
    mocks.transaction.mockImplementation(async (callback) => callback(tx()));
  });

  it("rejects spam bait in public editable text", async () => {
    const res = await PATCH(
      request({ displayName: "Buy cures at https://spam.example" }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid person update",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["displayName"] }),
      ]),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects new evidence uploads on a private memorial", async () => {
    const res = await PATCH(
      request({
        displayName: "Aunt Jane",
        isPublic: false,
        lifeStatus: "DECEASED",
        memorialEvidence: [
          {
            evidenceKind: "DOCUMENT",
            sourceUrl: "https://cdn.warondisease.org/evidence/source.pdf",
            title: "Source",
          },
        ],
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["memorialEvidence"] }),
      ]),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("clears condition, relationship, and memorial state when switched to living", async () => {
    const res = await PATCH(
      request({
        conditionName: "",
        displayName: "Aunt Jane",
        lifeStatus: "LIVING",
        relationshipType: "",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.personUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deathDate: null,
          lifeStatus: "LIVING",
        }),
      }),
    );
    expect(mocks.conditionUpdate).toHaveBeenCalledWith({
      where: { id: "condition_1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.relationshipUpdate).toHaveBeenCalledWith({
      where: { id: "relationship_1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.memorialUpdate).toHaveBeenCalledWith({
      where: { id: "memorial_1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.memorialEvidenceUpdateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, memorialId: "memorial_1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mocks.memorialUpsert).not.toHaveBeenCalled();
  });

  it("updates existing evidence and creates only new evidence rows", async () => {
    mocks.memorialEvidenceFindMany
      .mockResolvedValueOnce([
        {
          id: "evidence_1",
          sourceUrl: "https://cdn.warondisease.org/evidence/source.pdf",
        },
      ])
      .mockResolvedValueOnce([
        {
          description: "Updated source",
          evidenceKind: "DOCUMENT",
          id: "evidence_1",
          sourceUrl: "https://cdn.warondisease.org/evidence/source.pdf",
          title: "Updated",
        },
        {
          description: null,
          evidenceKind: "PHOTO",
          id: "evidence_new",
          sourceUrl: "https://cdn.warondisease.org/evidence/photo.jpg",
          title: "Photo",
        },
      ]);

    const res = await PATCH(
      request({
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
        memorialEvidence: [
          {
            description: "Updated source",
            evidenceKind: "DOCUMENT",
            id: "evidence_1",
            sourceUrl: "https://cdn.warondisease.org/evidence/source.pdf",
            title: "Updated",
          },
          {
            evidenceKind: "PHOTO",
            sourceUrl: "https://cdn.warondisease.org/evidence/photo.jpg",
            title: "Photo",
          },
        ],
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.memorialEvidenceUpdate).toHaveBeenCalledWith({
      where: { id: "evidence_1" },
      data: expect.objectContaining({
        deletedAt: null,
        description: "Updated source",
        sourceUrl: "https://cdn.warondisease.org/evidence/source.pdf",
      }),
      select: { id: true },
    });
    expect(mocks.memorialEvidenceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        evidenceKind: "PHOTO",
        sourceUrl: "https://cdn.warondisease.org/evidence/photo.jpg",
      }),
      select: { id: true },
    });
    expect(mocks.memorialEvidenceUpdateMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        id: { notIn: ["evidence_1", "evidence_new"] },
        memorialId: "memorial_1",
        submittedByUserId: "user_1",
      },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it("preserves existing civilian status when editing memorial details", async () => {
    const res = await PATCH(
      request({
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
        memorialMessage: "Updated memory.",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.memorialUpsert).toHaveBeenCalledWith({
      where: { personId: "person_1" },
      update: expect.objectContaining({
        causeCategory: "DISEASE",
        civilianStatus: "CIVILIAN",
      }),
      create: expect.objectContaining({
        causeCategory: "DISEASE",
        civilianStatus: "CIVILIAN",
      }),
      select: { id: true },
    });
  });
});
