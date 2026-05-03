import { describe, expect, it, vi } from "vitest";

import { matchEfficacyLagForMemorial } from "@/lib/efficacy-lag-matcher.server";

interface FakeTimeline {
  id: string;
  interventionName: string;
  brandName: string | null;
  conditionName: string;
  conditionGlobalVariableId: string | null;
  firstEvidenceDate: Date | null;
  approvalDate: Date | null;
  approvalDescription: string | null;
  efficacyLagDays: number | null;
  estimatedDeathsDuringLag: number | null;
}

function makeTx(opts: {
  deathDate: Date | null;
  conditions: Array<{ id: string; conditionName: string; globalVariableId: string | null }>;
  candidateTimelines: FakeTimeline[];
}) {
  const upsert = vi.fn().mockResolvedValue({});
  const tx = {
    personMemorial: {
      findUnique: vi.fn().mockResolvedValue({
        id: "memorial_1",
        person: { deathDate: opts.deathDate, displayName: "Khalil" },
      }),
    },
    personCondition: {
      findMany: vi.fn().mockResolvedValue(opts.conditions),
    },
    interventionApprovalTimeline: {
      findMany: vi.fn().mockResolvedValue(opts.candidateTimelines),
    },
    personEfficacyLagEvidence: { upsert },
  };
  return { tx, upsert };
}

const HIV_VAR_ID = "global-var-hiv";

const HIV_TIMELINE: FakeTimeline = {
  id: "intervention-approval-haart",
  interventionName: "Combination antiretroviral therapy (HIV/AIDS)",
  brandName: null,
  conditionName: "HIV/AIDS",
  conditionGlobalVariableId: HIV_VAR_ID,
  firstEvidenceDate: new Date("1987-03-19T00:00:00Z"),
  approvalDate: new Date("1996-03-01T00:00:00Z"),
  approvalDescription: "Combo ART approved 1996.",
  efficacyLagDays: 3270,
  estimatedDeathsDuringLag: 1_800_000,
};

describe("matchEfficacyLagForMemorial", () => {
  it("flags a death that falls inside the approval window", async () => {
    const { tx, upsert } = makeTx({
      deathDate: new Date("1993-06-01T00:00:00Z"),
      conditions: [
        { id: "cond_1", conditionName: "HIV/AIDS", globalVariableId: HIV_VAR_ID },
      ],
      candidateTimelines: [HIV_TIMELINE],
    });

    const matches = await matchEfficacyLagForMemorial(tx as never, "memorial_1");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      interventionName: HIV_TIMELINE.interventionName,
      timelineId: HIV_TIMELINE.id,
    });
    expect(matches[0]!.daysBeforeApproval).toBeGreaterThan(0);
    expect(matches[0]!.explanation).toContain("HIV/AIDS");
    expect(matches[0]!.explanation).toContain("flagged as efficacy lag evidence");
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0]![0]).toMatchObject({
      where: {
        memorialId_interventionApprovalTimelineId: {
          interventionApprovalTimelineId: HIV_TIMELINE.id,
          memorialId: "memorial_1",
        },
      },
      create: expect.objectContaining({
        memorialId: "memorial_1",
        interventionApprovalTimelineId: HIV_TIMELINE.id,
        confidenceScore: 1,
      }),
    });
  });

  it("returns nothing when the death date is missing", async () => {
    const { tx, upsert } = makeTx({
      deathDate: null,
      conditions: [],
      candidateTimelines: [HIV_TIMELINE],
    });
    const matches = await matchEfficacyLagForMemorial(tx as never, "memorial_1");
    expect(matches).toEqual([]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns nothing when no cause-of-death conditions exist", async () => {
    const { tx, upsert } = makeTx({
      deathDate: new Date("1993-06-01T00:00:00Z"),
      conditions: [],
      candidateTimelines: [HIV_TIMELINE],
    });
    const matches = await matchEfficacyLagForMemorial(tx as never, "memorial_1");
    expect(matches).toEqual([]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("uses 0.6 confidence when matching by name only (no canonical FK)", async () => {
    const { tx, upsert } = makeTx({
      deathDate: new Date("1993-06-01T00:00:00Z"),
      conditions: [
        { id: "cond_1", conditionName: "HIV/AIDS", globalVariableId: null },
      ],
      candidateTimelines: [HIV_TIMELINE],
    });
    const matches = await matchEfficacyLagForMemorial(tx as never, "memorial_1");
    expect(matches).toHaveLength(1);
    expect(upsert.mock.calls[0]![0].create.confidenceScore).toBe(0.6);
  });
});
