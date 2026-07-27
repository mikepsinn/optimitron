import { describe, expect, it } from "vitest";
import {
  readTaskCandidateEvidence,
  validateTaskCandidateReasonJson,
} from "@/lib/tasks/task-candidate-evidence";

const evidence = {
  confidence: 0.9,
  conflicts: [],
  contactProvenance: {
    channel: "EMAIL",
    sourceUrl: "https://example.org/contact",
    type: "PUBLISHED_BUSINESS_CONTACT",
  },
  fitSummary: "Licensed counsel with relevant financing experience.",
  qualifications: [
    {
      claim: "Active license",
      sourceUrls: ["https://example.org/bar-directory"],
      verified: true,
    },
  ],
  schema: "candidate-evidence.v1",
  sources: [
    {
      checkedAt: "2026-07-27T12:00:00.000Z",
      label: "Official bar directory",
      sourceKind: "OFFICIAL_DIRECTORY",
      url: "https://example.org/bar-directory",
    },
  ],
  uncertainties: ["Availability is unknown."],
} as const;

describe("task candidate evidence", () => {
  it("accepts sourced candidate research", () => {
    expect(readTaskCandidateEvidence(evidence)).toMatchObject({
      confidence: 0.9,
      schema: "candidate-evidence.v1",
    });
  });

  it("rejects unsourced typed evidence", () => {
    expect(() =>
      validateTaskCandidateReasonJson({ ...evidence, sources: [] }),
    ).toThrow();
  });

  it("requires qualification and contact provenance for external candidates", () => {
    expect(() =>
      validateTaskCandidateReasonJson(
        { ...evidence, contactProvenance: undefined },
        { requireTypedEvidence: true },
      ),
    ).toThrow();
    expect(() =>
      validateTaskCandidateReasonJson(
        { ...evidence, qualifications: [] },
        { requireTypedEvidence: true },
      ),
    ).toThrow();
  });

  it("requires typed evidence when saving an external Person candidate", () => {
    expect(() =>
      validateTaskCandidateReasonJson(
        { skillTags: ["corporate-law"] },
        { requireTypedEvidence: true },
      ),
    ).toThrow();
    expect(
      validateTaskCandidateReasonJson(evidence, {
        requireTypedEvidence: true,
      }),
    ).toMatchObject({
      confidence: 0.9,
      schema: "candidate-evidence.v1",
    });
  });

  it("leaves legacy scoring explanations compatible", () => {
    const legacy = { skillTags: ["corporate-law"] };
    expect(validateTaskCandidateReasonJson(legacy)).toBe(legacy);
  });
});
