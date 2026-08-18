import {
  CourtCasePartyCapacity,
  CourtCasePartyRole,
  CourtCaseStatus,
  CourtCaseItemStatus,
  SubjectType,
} from "@optimitron/db/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  caseCreate: vi.fn(),
  caseFindFirst: vi.fn(),
  caseUpdate: vi.fn(),
  claimCreate: vi.fn(),
  evidenceCreate: vi.fn(),
  partyUpsert: vi.fn(),
  referendumUpsert: vi.fn(),
  remedyCreate: vi.fn(),
  subjectUpsert: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    courtCase: {
      create: mocks.caseCreate,
      findFirst: mocks.caseFindFirst,
      update: mocks.caseUpdate,
    },
    courtCaseClaim: {
      create: mocks.claimCreate,
    },
    courtCaseEvidence: {
      create: mocks.evidenceCreate,
    },
    courtCaseParty: {
      upsert: mocks.partyUpsert,
    },
    courtCaseRemedy: {
      create: mocks.remedyCreate,
    },
    referendum: {
      upsert: mocks.referendumUpsert,
    },
    subject: {
      upsert: mocks.subjectUpsert,
    },
  },
}));

import {
  addCourtCaseClaim,
  addCourtCaseEvidence,
  addCourtCaseParty,
  addCourtCaseRemedy,
  openCourtCaseJuryVote,
  upsertCourtCase,
} from "../court-data.server";

describe("court-data server", () => {
  beforeEach(() => {
    for (const fn of Object.values(mocks)) fn.mockReset();
    mocks.caseCreate.mockResolvedValue({
      id: "case-1",
      slug: "humanity-v-pentagon",
      status: CourtCaseStatus.DRAFT,
    });
    mocks.caseFindFirst.mockResolvedValue({
      id: "case-1",
      slug: "humanity-v-pentagon",
      title: "Humanity v. Pentagon",
    });
    mocks.caseUpdate.mockResolvedValue({
      id: "case-1",
      juryReferendumId: "ref-1",
    });
    mocks.claimCreate.mockResolvedValue({ id: "claim-1", claimKey: "unaccounted-funds" });
    mocks.evidenceCreate.mockResolvedValue({ id: "evidence-1" });
    mocks.partyUpsert.mockResolvedValue({ id: "party-1", subjectId: "subject-humanity" });
    mocks.referendumUpsert.mockResolvedValue({
      id: "ref-1",
      slug: "court-humanity-v-pentagon-verdict",
      status: "ACTIVE",
    });
    mocks.remedyCreate.mockResolvedValue({ id: "remedy-1" });
    mocks.subjectUpsert.mockResolvedValue({
      id: "subject-humanity",
      subjectType: SubjectType.COHORT,
      externalId: "cohort:humanity",
      displayName: "Humanity",
    });
  });

  it("creates a draft court case with a stable slug and creator attribution", async () => {
    await upsertCourtCase({
      title: "Humanity v. Pentagon",
      summary: "Audit failure and resource misallocation case.",
      createdByUserId: "agent-user",
    });

    expect(mocks.caseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        createdByUserId: "agent-user",
        isPublic: false,
        slug: "humanity-v-pentagon",
        status: CourtCaseStatus.DRAFT,
        summary: "Audit failure and resource misallocation case.",
        title: "Humanity v. Pentagon",
      }),
      select: expect.any(Object),
    });
  });

  it("upserts a reusable cohort subject when adding Humanity as a party", async () => {
    await addCourtCaseParty({
      caseId: "case-1",
      role: CourtCasePartyRole.NOMINAL_PLAINTIFF,
      capacity: CourtCasePartyCapacity.CLASS_REPRESENTATIVE,
      subjectExternalId: "cohort:humanity",
      subjectDisplayName: "Humanity",
      subjectType: SubjectType.COHORT,
      createdByUserId: "agent-user",
    });

    expect(mocks.subjectUpsert).toHaveBeenCalledWith({
      where: {
        subjectType_externalId: {
          externalId: "cohort:humanity",
          subjectType: SubjectType.COHORT,
        },
      },
      update: { displayName: "Humanity" },
      create: {
        displayName: "Humanity",
        externalId: "cohort:humanity",
        subjectType: SubjectType.COHORT,
      },
      select: { id: true },
    });
    expect(mocks.partyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          caseId: "case-1",
          role: CourtCasePartyRole.NOMINAL_PLAINTIFF,
          subjectId: "subject-humanity",
        }),
        where: {
          caseId_role_subjectId: {
            caseId: "case-1",
            role: CourtCasePartyRole.NOMINAL_PLAINTIFF,
            subjectId: "subject-humanity",
          },
        },
      }),
    );
  });

  it("records structured claims and sourced public evidence without accepting sensitive evidence", async () => {
    await addCourtCaseClaim({
      caseId: "case-1",
      claimKey: "unaccounted-funds",
      title: "Unaccounted public welfare funds",
      argumentMarkdown: "The respondent failed seven audits.",
      createdByUserId: "agent-user",
    });

    expect(mocks.claimCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        argumentMarkdown: "The respondent failed seven audits.",
        caseId: "case-1",
        claimKey: "unaccounted-funds",
        status: CourtCaseItemStatus.PROPOSED,
      }),
      select: expect.any(Object),
    });

    await expect(
      addCourtCaseEvidence({
        caseId: "case-1",
        title: "Private medical record",
        containsSensitiveData: true,
        sourceUrl: "https://example.org/private.pdf",
      }),
    ).rejects.toThrow("Court evidence tools only accept public non-sensitive sources");

    await addCourtCaseEvidence({
      caseId: "case-1",
      claimId: "claim-1",
      evidenceKey: "pentagon-unaccounted-funds",
      title: "Pentagon unaccounted funds parameter",
      parameterName: "PENTAGON_UNACCOUNTED_FUNDS",
      createdByUserId: "agent-user",
    });

    expect(mocks.evidenceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        caseId: "case-1",
        claimId: "claim-1",
        evidenceKey: "pentagon-unaccounted-funds",
        isPublic: true,
        parameterName: "PENTAGON_UNACCOUNTED_FUNDS",
      }),
      select: expect.any(Object),
    });
  });

  it("opens a humanity jury referendum and links it back to the case", async () => {
    await openCourtCaseJuryVote({
      caseIdOrSlug: "humanity-v-pentagon",
      questionKey: "verdict",
      questionTitle: "Should humanity find for the plaintiffs?",
      createdByUserId: "agent-user",
    });

    expect(mocks.referendumUpsert).toHaveBeenCalledWith({
      where: { slug: "court-humanity-v-pentagon-verdict" },
      update: expect.objectContaining({
        description: "Court of Humanity jury vote for Humanity v. Pentagon.",
        status: "ACTIVE",
      }),
      create: expect.objectContaining({
        createdByUserId: "agent-user",
        slug: "court-humanity-v-pentagon-verdict",
        status: "ACTIVE",
        title: "Should humanity find for the plaintiffs?",
      }),
      select: expect.any(Object),
    });
    expect(mocks.caseUpdate).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: { juryReferendumId: "ref-1", status: CourtCaseStatus.VOTING },
      select: expect.any(Object),
    });
  });

  it("records remedies that can point at existing enforcement tasks", async () => {
    await addCourtCaseRemedy({
      caseId: "case-1",
      claimId: "claim-1",
      remedyKey: "audit-and-redirect",
      title: "Account for funds and redirect recovered value",
      bodyMarkdown: "Recover unaccounted funds and redirect them to clinical trials.",
      enforcementTaskId: "task-1",
      createdByUserId: "agent-user",
    });

    expect(mocks.remedyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bodyMarkdown: "Recover unaccounted funds and redirect them to clinical trials.",
        caseId: "case-1",
        claimId: "claim-1",
        enforcementTaskId: "task-1",
        remedyKey: "audit-and-redirect",
        status: CourtCaseItemStatus.PROPOSED,
      }),
      select: expect.any(Object),
    });
  });
});
