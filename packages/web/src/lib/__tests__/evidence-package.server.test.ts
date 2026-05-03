import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  memorialFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    personMemorial: {
      findUnique: mocks.memorialFindUnique,
    },
  },
}));

import {
  buildEvidencePackage,
  EvidencePackageNotConsentedError,
  MemorialNotFoundError,
} from "@/lib/evidence-package.server";

const BASE_MEMORIAL = {
  id: "memorial_1",
  causeCategory: "ARMED_CONFLICT",
  circumstances: "Airstrike on residential building.",
  civilianStatus: "CIVILIAN",
  deathCountryCode: "PS",
  deathLocation: "Khan Younis",
  wasChild: true,
  person: {
    birthDate: new Date("2010-01-01T00:00:00Z"),
    deathDate: new Date("2024-03-15T00:00:00Z"),
    displayName: "Khalil",
    conditions: [],
    relationshipsAsObject: [
      { createdByUserId: "user_uncle", relationshipType: "uncle-of" },
    ],
  },
  conflict: { name: "Gaza war (2023–present)", slug: "gaza-2023" },
  efficacyLagEvidence: [],
  responsibleParties: [
    {
      isPrimary: true,
      jurisdiction: { code: "IL", name: "Israel" },
      name: "Israel",
      roleSlug: "armed-force",
    },
  ],
  evidence: [
    {
      containsSensitiveData: false,
      description: "Witness saw the strike from across the street.",
      evidenceKind: "WITNESS_STATEMENT",
      isPublic: true,
      sourceUrl: "https://static.warondisease.org/witness/abc.txt",
      title: "Neighbor statement",
    },
    {
      containsSensitiveData: true,
      description: "Hospital admission report.",
      evidenceKind: "HOSPITAL_RECORD",
      isPublic: true,
      sourceUrl: "https://static.warondisease.org/records/123.pdf",
      title: "Admission",
    },
    {
      containsSensitiveData: false,
      description: "Public death notice.",
      evidenceKind: "DEATH_RECORD",
      isPublic: true,
      sourceUrl: "https://static.warondisease.org/records/public.pdf",
      title: "Public record",
    },
  ],
  submissions: [
    {
      consentCourtEvidence: true,
      consentCourtEvidenceAt: new Date("2024-04-01T00:00:00Z"),
      consentPublicDisplay: true,
      createdAt: new Date("2024-04-01T00:00:00Z"),
      isPublic: true,
      memorialMessage: "He wanted to be a teacher.",
      submittedByUser: {
        id: "user_uncle",
        email: "uncle@example.com",
        person: { displayName: "Sami", id: "person_uncle" },
      },
    },
  ],
};

describe("buildEvidencePackage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the structured filing when at least one submitter consented", async () => {
    mocks.memorialFindUnique.mockResolvedValue(BASE_MEMORIAL);
    const pkg = await buildEvidencePackage("memorial_1");
    expect(pkg.caseTitle).toBe("Sami v. Israel");
    expect(pkg.decedent).toMatchObject({
      name: "Khalil",
      civilianStatus: "civilian",
      wasChild: true,
    });
    expect(pkg.location).toMatchObject({ countryCode: "PS", description: "Khan Younis" });
    expect(pkg.conflict).toMatchObject({ slug: "gaza-2023" });
    expect(pkg.responsibleParties).toHaveLength(1);
    expect(pkg.witnesses).toHaveLength(1);
    expect(pkg.witnesses[0]).toMatchObject({ title: "Neighbor statement" });
    expect(pkg.supportingDocuments).toHaveLength(1);
    expect(pkg.supportingDocuments[0]).toMatchObject({
      kind: "DEATH_RECORD",
      containsSensitiveData: false,
    });
    expect(pkg.submitters[0]).toMatchObject({
      name: "Sami",
      relationship: "uncle of",
      consentCourtEvidence: true,
    });
    expect(pkg.packageVersion).toBe(1);
  });

  it("throws EvidencePackageNotConsentedError when no submitter consented", async () => {
    mocks.memorialFindUnique.mockResolvedValue({
      ...BASE_MEMORIAL,
      submissions: [
        {
          ...BASE_MEMORIAL.submissions[0]!,
          consentCourtEvidence: false,
        },
      ],
    });
    await expect(buildEvidencePackage("memorial_1")).rejects.toBeInstanceOf(
      EvidencePackageNotConsentedError,
    );
  });

  it("does not treat private court-only consent as public package consent", async () => {
    mocks.memorialFindUnique.mockResolvedValue({
      ...BASE_MEMORIAL,
      submissions: [
        {
          ...BASE_MEMORIAL.submissions[0]!,
          consentPublicDisplay: false,
          isPublic: false,
        },
      ],
    });

    await expect(buildEvidencePackage("memorial_1")).rejects.toBeInstanceOf(
      EvidencePackageNotConsentedError,
    );
  });

  it("does not expose submitter email when no public person display name exists", async () => {
    mocks.memorialFindUnique.mockResolvedValue({
      ...BASE_MEMORIAL,
      submissions: [
        {
          ...BASE_MEMORIAL.submissions[0]!,
          submittedByUser: {
            id: "user_uncle",
            email: "uncle@example.com",
            person: null,
          },
        },
      ],
    });

    const pkg = await buildEvidencePackage("memorial_1");

    expect(pkg.submitters[0]).toMatchObject({
      name: "Submitter",
      relationship: "uncle of",
    });
    expect(JSON.stringify(pkg)).not.toContain("uncle@example.com");
  });

  it("throws MemorialNotFoundError when no memorial exists", async () => {
    mocks.memorialFindUnique.mockResolvedValue(null);
    await expect(buildEvidencePackage("missing")).rejects.toBeInstanceOf(
      MemorialNotFoundError,
    );
  });
});
