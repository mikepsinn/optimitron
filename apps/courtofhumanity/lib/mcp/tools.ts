import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/** Court-owned catalog; importing this file never loads database services. */
export const COURT_TOOL_DEFINITIONS = [
  {
    name: "upsertCourtCase",
    description: "Create or update a Court of Humanity case root record.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        slug: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        status: {
          type: "string",
          enum: ["DRAFT", "OPEN", "VOTING", "JUDGED", "ARCHIVED"],
        },
        isPublic: { type: "boolean" },
        nominalPlaintiffSubjectId: { type: "string" },
        primaryRespondentSubjectId: { type: "string" },
        beneficiarySubjectId: { type: "string" },
        rootTaskId: { type: "string" },
        juryReferendumId: { type: "string" },
        metadataJson: { type: "object" },
      },
      required: ["title"],
    },
  },
  {
    name: "addCourtCaseParty",
    description:
      "Attach a plaintiff, respondent, class, beneficiary, or amicus Subject to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        partyKey: { type: "string" },
        subjectId: { type: "string" },
        subjectExternalId: { type: "string" },
        subjectDisplayName: { type: "string" },
        subjectType: { type: "string" },
        role: {
          type: "string",
          enum: [
            "NOMINAL_PLAINTIFF",
            "NAMED_PLAINTIFF",
            "REPRESENTATIVE_CLASS",
            "RESPONDENT",
            "AMICUS",
            "BENEFICIARY",
          ],
        },
        capacity: {
          type: "string",
          enum: [
            "INSTITUTIONAL",
            "OFFICIAL_CAPACITY",
            "PERSONAL_CAPACITY",
            "OVERSIGHT_CAPACITY",
            "CLASS_REPRESENTATIVE",
          ],
        },
        displayNameSnapshot: { type: "string" },
        standingTheory: { type: "string" },
        powerToRemedyScore: { type: "number" },
        blameAttributionScore: { type: "number" },
        publicAccountabilityScore: { type: "number" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "role"],
    },
  },
  {
    name: "addCourtCaseClaim",
    description:
      "Add a structured allegation or requested finding to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimKey: { type: "string" },
        title: { type: "string" },
        claimType: { type: "string" },
        argumentMarkdown: { type: "string" },
        requestedFinding: { type: "string" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        juryReferendumId: { type: "string" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title", "argumentMarkdown"],
    },
  },
  {
    name: "addCourtCaseHarm",
    description:
      "Add a quantified or qualitative harm catalog row to a Court of Humanity case.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        harmKey: { type: "string" },
        harmType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        affectedSubjectId: { type: "string" },
        globalVariableId: { type: "string" },
        parameterName: { type: "string" },
        lowValue: { type: "number" },
        baseValue: { type: "number" },
        highValue: { type: "number" },
        unit: { type: "string" },
        confidenceScore: { type: "number" },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title"],
    },
  },
  {
    name: "addCourtCaseEvidence",
    description:
      "Attach public non-sensitive evidence to a Court of Humanity case, claim, or harm.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        harmId: { type: "string" },
        evidenceKey: { type: "string" },
        evidenceType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        sourceArtifactId: { type: "string" },
        personMemorialId: { type: "string" },
        globalVariableId: { type: "string" },
        parameterName: { type: "string" },
        sourceUrl: { type: "string" },
        contentHash: { type: "string" },
        isPublic: {
          type: "boolean",
          description: "Must be true; private evidence is not accepted.",
        },
        containsSensitiveData: {
          type: "boolean",
          description: "Must be false; sensitive evidence is not accepted.",
        },
        reviewStatus: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        confidenceScore: { type: "number" },
        sortOrder: { type: "number" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title"],
    },
  },
  {
    name: "addCourtCaseRemedy",
    description:
      "Add a requested remedy that can point at an existing enforcement Task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseId: { type: "string" },
        claimId: { type: "string" },
        targetPartyId: { type: "string" },
        remedyKey: { type: "string" },
        remedyType: { type: "string" },
        title: { type: "string" },
        bodyMarkdown: { type: "string" },
        amountUsdLow: { type: "number" },
        amountUsdBase: { type: "number" },
        amountUsdHigh: { type: "number" },
        deadlineAt: { type: "string" },
        enforcementTaskId: { type: "string" },
        status: {
          type: "string",
          enum: ["PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"],
        },
        sortOrder: { type: "number" },
        isPublic: { type: "boolean" },
        metadataJson: { type: "object" },
      },
      required: ["caseId", "title", "bodyMarkdown"],
    },
  },
  {
    name: "getCourtCase",
    description:
      "Fetch a Court of Humanity case with parties, claims, harms, evidence, remedies, and jury referendum.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseIdOrSlug: { type: "string" },
        id: { type: "string" },
        slug: { type: "string" },
      },
    },
  },
  {
    name: "openCourtCaseJuryVote",
    description:
      "Open or update the public referendum used as a Court of Humanity jury vote.",
    inputSchema: {
      type: "object" as const,
      properties: {
        caseIdOrSlug: { type: "string" },
        claimId: { type: "string" },
        questionKey: { type: "string" },
        questionTitle: { type: "string" },
      },
      required: ["caseIdOrSlug"],
    },
  },
] as const satisfies readonly Tool[];

export type CourtToolName = (typeof COURT_TOOL_DEFINITIONS)[number]["name"];
export function isCourtToolName(name: string): name is CourtToolName {
  return COURT_TOOL_DEFINITIONS.some((tool) => tool.name === name);
}
