import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  referendumFindUnique: vi.fn(),
  ensurePersonForUser: vi.fn(),
  voteFindFirst: vi.fn(),
  personCreate: vi.fn(),
  conditionCreate: vi.fn(),
  memorialCreate: vi.fn(),
  memorialEvidenceCreate: vi.fn(),
  memorialSubmissionCreate: vi.fn(),
  memorialResponsiblePartyCreate: vi.fn(),
  relationshipCreate: vi.fn(),
  globalVariableFindFirst: vi.fn(),
  subjectUpsert: vi.fn(),
  voteUpsert: vi.fn(),
  transaction: vi.fn(),
  conflictFindFirst: vi.fn(),
  jurisdictionFindMany: vi.fn(),
  memorialFindUnique: vi.fn(),
  conditionFindMany: vi.fn(),
  approvalTimelineFindMany: vi.fn(),
  efficacyLagEvidenceUpsert: vi.fn(),
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
    referendum: { findUnique: mocks.referendumFindUnique },
    referendumVote: {
      findFirst: mocks.voteFindFirst,
      upsert: mocks.voteUpsert,
    },
    person: { create: mocks.personCreate },
    personCondition: { create: mocks.conditionCreate },
    personMemorial: { create: mocks.memorialCreate },
    personMemorialSubmission: { create: mocks.memorialSubmissionCreate },
    personMemorialResponsibleParty: { create: mocks.memorialResponsiblePartyCreate },
    personRelationship: { create: mocks.relationshipCreate },
    globalVariable: { findFirst: mocks.globalVariableFindFirst },
    subject: { upsert: mocks.subjectUpsert },
    conflict: { findFirst: mocks.conflictFindFirst },
    jurisdiction: { findMany: mocks.jurisdictionFindMany },
  },
}));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/referendums/one-percent-treaty/represented-people", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function params(slug = "one-percent-treaty") {
  return { params: Promise.resolve({ slug }) };
}

describe("POST /api/referendums/[slug]/represented-people", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.referendumFindUnique.mockResolvedValue({
      id: "ref_1",
      slug: "one-percent-treaty",
      status: "ACTIVE",
      deletedAt: null,
    });
    mocks.ensurePersonForUser.mockResolvedValue({ id: "person_user", isPublic: true });
    mocks.voteFindFirst.mockResolvedValue({ id: "self_vote", answer: "YES" });
    mocks.personCreate.mockResolvedValue({
      id: "person_grandma",
      displayName: "Grandma Kay",
      lifeStatus: "LIVING",
      isPublic: true,
    });
    mocks.conditionCreate.mockResolvedValue({ id: "condition_1" });
    mocks.globalVariableFindFirst.mockResolvedValue(null);
    mocks.memorialCreate.mockResolvedValue({ id: "memorial_1" });
    mocks.subjectUpsert.mockResolvedValue({ id: "subject_person" });
    mocks.voteUpsert.mockResolvedValue({
      id: "represented_vote",
      answer: "YES",
      personId: "person_grandma",
      userId: "user_1",
      voteSource: "REPRESENTED",
    });
    mocks.conflictFindFirst.mockResolvedValue(null);
    mocks.jurisdictionFindMany.mockResolvedValue([]);
    mocks.memorialFindUnique.mockResolvedValue({
      id: "memorial_1",
      person: { deathDate: null, displayName: "Aunt Jane" },
    });
    mocks.conditionFindMany.mockResolvedValue([]);
    mocks.approvalTimelineFindMany.mockResolvedValue([]);
    mocks.efficacyLagEvidenceUpsert.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        person: { create: mocks.personCreate },
        personCondition: {
          create: mocks.conditionCreate,
          findMany: mocks.conditionFindMany,
        },
        personMemorial: {
          create: mocks.memorialCreate,
          findUnique: mocks.memorialFindUnique,
        },
        personMemorialEvidence: { create: mocks.memorialEvidenceCreate },
        personMemorialSubmission: { create: mocks.memorialSubmissionCreate },
        personMemorialResponsibleParty: { create: mocks.memorialResponsiblePartyCreate },
        personRelationship: { create: mocks.relationshipCreate },
        globalVariable: { findFirst: mocks.globalVariableFindFirst },
        subject: { upsert: mocks.subjectUpsert },
        referendumVote: { upsert: mocks.voteUpsert },
        interventionApprovalTimeline: { findMany: mocks.approvalTimelineFindMany },
        personEfficacyLagEvidence: { upsert: mocks.efficacyLagEvidenceUpsert },
      }),
    );
  });

  it("requires the caster to have a self YES vote first", async () => {
    mocks.voteFindFirst.mockResolvedValue(null);

    const res = await POST(
      request({ displayName: "Grandma Kay", conditionName: "dementia" }),
      params(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Vote YES yourself before dragging relatives to the polls.",
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("creates a represented person and represented YES vote", async () => {
    const res = await POST(
      request({
        birthDate: "1938-04-12",
        conditionName: "dementia",
        displayName: "Grandma Kay",
        imageUrl: "/img/grandma.jpg",
        lifeStatus: "LIVING",
        publicComment: "She would trade one apocalypse for dementia research.",
        relationshipType: "grandchild-of",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      efficacyLagMatches: [],
      person: {
        id: "person_grandma",
        displayName: "Grandma Kay",
        lifeStatus: "LIVING",
        isPublic: true,
      },
      vote: {
        id: "represented_vote",
        answer: "YES",
        personId: "person_grandma",
        userId: "user_1",
        voteSource: "REPRESENTED",
      },
    });
    const personCreateData = mocks.personCreate.mock.calls[0]?.[0]?.data;
    expect(personCreateData).toMatchObject({
      createdByUserId: "user_1",
      birthDate: new Date("1938-04-12T00:00:00.000Z"),
      displayName: "Grandma Kay",
      image: "/img/grandma.jpg",
      isPublic: true,
      lifeStatus: "LIVING",
    });
    expect(personCreateData).not.toHaveProperty("sourceRef");
    expect(mocks.conditionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conditionName: "dementia",
        globalVariableId: null,
        personId: "person_grandma",
        reportedByUserId: "user_1",
        status: "ACTIVE",
      }),
      select: { id: true },
    });
    expect(mocks.relationshipCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdByUserId: "user_1",
        objectPersonId: "person_grandma",
        relationshipType: "grandchild-of",
        subjectPersonId: "person_user",
      }),
    });
    expect(mocks.subjectUpsert).toHaveBeenCalledWith({
      where: { personId: "person_grandma" },
      update: { displayName: "Grandma Kay" },
      create: expect.objectContaining({
        displayName: "Grandma Kay",
        personId: "person_grandma",
        subjectType: "PERSON",
      }),
    });
    expect(mocks.voteUpsert).toHaveBeenCalledWith({
      where: {
        referendumId_personId: {
          referendumId: "ref_1",
          personId: "person_grandma",
        },
      },
      update: expect.objectContaining({
        answer: "YES",
        publicComment: "She would trade one apocalypse for dementia research.",
      }),
      create: expect.objectContaining({
        answer: "YES",
        isPublic: true,
        personId: "person_grandma",
        referendumId: "ref_1",
        userId: "user_1",
        voteSource: "REPRESENTED",
      }),
      select: {
        answer: true,
        id: true,
        personId: true,
        userId: true,
        voteSource: true,
      },
    });
  });

  it("links represented conditions to canonical medical variables when available", async () => {
    mocks.globalVariableFindFirst.mockResolvedValue({
      externalCodes: [{ code: "G30", codeSystem: "ICD-10" }],
      id: "gv_alzheimers",
    });

    const res = await POST(
      request({
        conditionName: "Alzheimer's Disease",
        displayName: "Grandma Kay",
        lifeStatus: "LIVING",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.conditionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conditionCode: "G30",
        conditionCodeSystem: "ICD-10",
        conditionName: "Alzheimer's Disease",
        globalVariableId: "gv_alzheimers",
      }),
      select: { id: true },
    });
  });

  it("rejects remote avatar URLs at the HTTP boundary", async () => {
    const res = await POST(
      request({
        conditionName: "dementia",
        displayName: "Grandma Kay",
        imageUrl: "https://tracker.example.com/grandma.jpg",
        lifeStatus: "LIVING",
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["imageUrl"] }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid enum values instead of silently normalizing them", async () => {
    const res = await POST(
      request({
        causeCategory: "ALIEN_ABDUCTION",
        conditionName: "dementia",
        displayName: "Grandma Kay",
        lifeStatus: "DEAD",
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["causeCategory"] }),
        expect.objectContaining({ path: ["lifeStatus"] }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("requires country of death for deceased memorial votes", async () => {
    const res = await POST(
      request({
        conditionName: "cancer",
        dateOfDeath: "2020-01-02",
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["deathCountryCode"] }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("rejects birth dates after death dates", async () => {
    const res = await POST(
      request({
        birthDate: "2021-01-01",
        conditionName: "cancer",
        dateOfDeath: "2020-01-02",
        deathCountryCode: "US",
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["birthDate"] }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("creates memorial evidence fields for deceased people", async () => {
    const res = await POST(
      request({
        causeCategory: "DISEASE",
        conditionName: "cancer",
        consentCourtEvidence: true,
        dateOfDeath: "2020-01-02",
        deathCountryCode: "us",
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
        memorialMessage: "She taught everyone to fix broken things.",
        relationshipType: "nephew-of",
        responsiblePartyName: "FDA approval lag",
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.personCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deathDate: new Date("2020-01-02T00:00:00.000Z"),
          displayName: "Aunt Jane",
          lifeStatus: "DECEASED",
        }),
        select: expect.objectContaining({
          displayName: true,
          id: true,
          lifeStatus: true,
        }),
      }),
    );
    expect(mocks.conditionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conditionName: "cancer",
        status: "CAUSE_OF_DEATH",
      }),
      select: { id: true },
    });
    expect(mocks.memorialCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        causeCategory: "DISEASE",
        deathCountryCode: "US",
        isPublic: true,
        personId: "person_grandma",
        primaryPersonConditionId: "condition_1",
      }),
      select: { id: true },
    });
    const memorialSubmissionData =
      mocks.memorialSubmissionCreate.mock.calls[0]?.[0]?.data;
    expect(memorialSubmissionData).toEqual(
      expect.objectContaining({
        consentCourtEvidence: true,
        consentCourtEvidenceAt: expect.any(Date),
        consentPublicDisplay: true,
        consentPublicDisplayAt: expect.any(Date),
        isPublic: true,
        memorialId: "memorial_1",
        memorialMessage: "She taught everyone to fix broken things.",
        submittedByUserId: "user_1",
      }),
    );
    expect(memorialSubmissionData).not.toHaveProperty("consentedAt");
    expect(mocks.memorialResponsiblePartyCreate).toHaveBeenCalledWith({
      data: {
        isPrimary: true,
        isPublic: true,
        jurisdictionId: null,
        memorialId: "memorial_1",
        name: "FDA approval lag",
        roleSlug: null,
      },
    });
  });

  it("stores uploaded memorial evidence as public and non-sensitive", async () => {
    const res = await POST(
      request({
        causeCategory: "DISEASE",
        conditionName: "cancer",
        dateOfDeath: "2020-01-02",
        deathCountryCode: "us",
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
        memorialEvidence: [
          {
            description: "News report",
            evidenceKind: "NEWS_ARTICLE",
            sourceUrl: "https://cdn.warondisease.org/memorial-evidence/source.pdf",
            title: "Source",
          },
        ],
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.memorialEvidenceCreate).toHaveBeenCalledWith({
      data: {
        containsSensitiveData: false,
        description: "News report",
        evidenceKind: "NEWS_ARTICLE",
        isPublic: true,
        memorialId: "memorial_1",
        sourceUrl: "https://cdn.warondisease.org/memorial-evidence/source.pdf",
        submittedByUserId: "user_1",
        title: "Source",
      },
    });
  });

  it("rejects sensitive evidence uploads", async () => {
    const res = await POST(
      request({
        causeCategory: "DISEASE",
        conditionName: "cancer",
        dateOfDeath: "2020-01-02",
        deathCountryCode: "us",
        displayName: "Aunt Jane",
        lifeStatus: "DECEASED",
        memorialEvidence: [
          {
            containsSensitiveData: true,
            evidenceKind: "DOCUMENT",
            sourceUrl: "https://cdn.warondisease.org/memorial-evidence/private.pdf",
          },
        ],
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: ["memorialEvidence", 0, "containsSensitiveData"],
        }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("requires a public memorial before accepting evidence uploads", async () => {
    const res = await POST(
      request({
        causeCategory: "DISEASE",
        conditionName: "cancer",
        dateOfDeath: "2020-01-02",
        deathCountryCode: "us",
        displayName: "Aunt Jane",
        isPublic: false,
        lifeStatus: "DECEASED",
        memorialEvidence: [
          {
            evidenceKind: "DOCUMENT",
            sourceUrl: "https://cdn.warondisease.org/memorial-evidence/source.pdf",
          },
        ],
      }),
      params(),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "Invalid represented person submission",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["memorialEvidence"] }),
      ]),
    });
    expect(mocks.personCreate).not.toHaveBeenCalled();
  });

  it("captures conflict-specific fields and multiple responsible governments", async () => {
    mocks.conflictFindFirst.mockResolvedValue({ id: "conflict_gaza" });
    mocks.jurisdictionFindMany.mockResolvedValue([
      { id: "jurisdiction_il", code: "IL", name: "Israel" },
      { id: "jurisdiction_us", code: "US", name: "United States" },
    ]);

    const res = await POST(
      request({
        causeCategory: "ARMED_CONFLICT",
        circumstances: "Airstrike on residential building in Khan Younis.",
        civilianStatus: "CIVILIAN",
        conditionName: "",
        conflictId: "conflict_gaza",
        consentCourtEvidence: true,
        dateOfDeath: "2024-03-15",
        deathCountryCode: "ps",
        displayName: "Khalil",
        lifeStatus: "DECEASED",
        memorialMessage: "He wanted to be a teacher.",
        relationshipType: "uncle-of",
        responsibleParties: [
          { jurisdictionCode: "IL", name: "", roleSlug: "Armed Force" },
          { jurisdictionCode: "US", name: "", roleSlug: "Funder" },
        ],
        wasChild: true,
      }),
      params(),
    );

    expect(res.status).toBe(200);
    expect(mocks.conflictFindFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [{ id: "conflict_gaza" }, { slug: "conflict_gaza" }],
      },
      select: { id: true },
    });
    expect(mocks.memorialCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        causeCategory: "ARMED_CONFLICT",
        circumstances: "Airstrike on residential building in Khan Younis.",
        civilianStatus: "CIVILIAN",
        conflictId: "conflict_gaza",
        deathCountryCode: "PS",
        wasChild: true,
      }),
      select: { id: true },
    });
    expect(mocks.memorialResponsiblePartyCreate).toHaveBeenCalledTimes(2);
    expect(mocks.memorialResponsiblePartyCreate).toHaveBeenNthCalledWith(1, {
      data: {
        isPrimary: true,
        isPublic: true,
        jurisdictionId: "jurisdiction_il",
        memorialId: "memorial_1",
        name: "Israel",
        roleSlug: "armed-force",
      },
    });
    expect(mocks.memorialResponsiblePartyCreate).toHaveBeenNthCalledWith(2, {
      data: {
        isPrimary: false,
        isPublic: true,
        jurisdictionId: "jurisdiction_us",
        memorialId: "memorial_1",
        name: "United States",
        roleSlug: "funder",
      },
    });
  });
});
