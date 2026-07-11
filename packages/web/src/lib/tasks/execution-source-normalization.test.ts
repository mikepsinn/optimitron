import { describe, expect, it } from "vitest";
import {
  findPilotConceptGroups,
  findPilotDuplicateGroups,
  normalizeCalendarForPlanning,
  normalizeNotionPlanningItems,
} from "./execution-source-normalization";

describe("normalizeNotionPlanningItems", () => {
  it("is idempotent for source-identical items and keeps long documents linked", () => {
    const first = normalizeNotionPlanningItems({
      items: [
        {
          acceptanceCriteria: ["Account can receive funds."],
          actionContext: "Open the Mercury account needed for EOS banking.",
          estimatedEffortHours: 1,
          id: "notion-mercury",
          title: "Make a Mercury bank account for EOS",
          url: "https://notion.so/mercury",
        },
      ],
    });
    const proposal = first.proposals[0]!;
    const second = normalizeNotionPlanningItems({
      existingSources: [
        {
          sourceHash: (proposal.source as { sourceHash: string }).sourceHash,
          sourceKey: "notion:notion-mercury",
          taskId: "task-mercury",
        },
      ],
      items: [
        {
          acceptanceCriteria: ["Account can receive funds."],
          actionContext: "Open the Mercury account needed for EOS banking.",
          estimatedEffortHours: 1,
          id: "notion-mercury",
          title: "Make a Mercury bank account for EOS",
          url: "https://notion.so/mercury",
        },
      ],
    });

    expect(first.proposals).toHaveLength(1);
    expect(proposal.description).not.toContain("entire document");
    expect(second.proposals).toEqual([]);
    expect(second.unchanged).toEqual([
      { sourceKey: "notion:notion-mercury", taskId: "task-mercury" },
    ]);
  });
});

describe("normalizeCalendarForPlanning", () => {
  it("keeps meetings as commitments and collapses duplicate medication routines", () => {
    const result = normalizeCalendarForPlanning([
      {
        endAt: "2026-07-10T14:15:00.000Z",
        id: "meds-1",
        isRoutine: true,
        recurringSeriesId: "series-a",
        startAt: "2026-07-10T14:00:00.000Z",
        title: "Morning meds/supplements",
      },
      {
        endAt: "2026-07-11T14:15:00.000Z",
        id: "meds-2",
        isRoutine: true,
        recurringSeriesId: "series-b",
        startAt: "2026-07-11T14:00:00.000Z",
        title: "Morning medication and supplements",
      },
      {
        endAt: "2026-07-10T22:40:00.000Z",
        id: "night-meds-1",
        isRoutine: true,
        recurringSeriesId: "series-night",
        startAt: "2026-07-10T22:30:00.000Z",
        title: "Night meds/supplements",
      },
      {
        endAt: "2026-07-10T17:00:00.000Z",
        id: "meeting-1",
        startAt: "2026-07-10T16:00:00.000Z",
        title: "Foundation call",
      },
      {
        endAt: "2026-07-10T18:00:00.000Z",
        id: "mercury-1",
        kind: "task",
        startAt: "2026-07-10T17:30:00.000Z",
        title: "Open Mercury bank account for EOS",
      },
    ]);

    expect(result.fixedCommitments).toHaveLength(1);
    expect(result.routineProposals).toHaveLength(2);
    expect(result.taskProposals).toEqual([
      expect.objectContaining({
        estimatedEffortHours: 0.5,
        title: "Open Mercury bank account for EOS",
      }),
    ]);
    expect(result.routineProposals[0]?.trigger.sourceSeriesIds).toEqual([
      "series-a",
      "series-b",
    ]);
    expect(result.routineProposals[1]?.trigger.sourceSeriesIds).toEqual([
      "series-night",
    ]);
    expect(
      result.duplicateGroups.find(
        (group) => group.concept === "medication-routine",
      )?.items,
    ).toHaveLength(2);
  });

  it("keeps a recurring template hash stable as the occurrence window moves", () => {
    const occurrence = {
      endAt: "2026-07-10T14:10:00.000Z",
      id: "meds-1",
      isRoutine: true,
      recurringSeriesId: "series-a",
      startAt: "2026-07-10T14:00:00.000Z",
      title: "Morning meds/supplements",
    };
    const first = normalizeCalendarForPlanning([occurrence]);
    const second = normalizeCalendarForPlanning([
      occurrence,
      {
        ...occurrence,
        endAt: "2026-07-11T14:10:00.000Z",
        id: "meds-2",
        startAt: "2026-07-11T14:00:00.000Z",
      },
    ]);
    const dateInput = normalizeCalendarForPlanning([
      {
        ...occurrence,
        endAt: new Date(occurrence.endAt),
        startAt: new Date(occurrence.startAt),
      },
    ]);

    expect(first.routineProposals[0]?.source.sourceHash).toBe(
      second.routineProposals[0]?.source.sourceHash,
    );
    expect(first.routineProposals[0]?.source.sourceHash).toBe(
      dateInput.routineProposals[0]?.source.sourceHash,
    );
  });

  it("uses a one-minute floor for malformed zero-duration task events", () => {
    const result = normalizeCalendarForPlanning([
      {
        endAt: "2026-07-10T17:30:00.000Z",
        id: "zero-duration-task",
        kind: "task",
        startAt: "2026-07-10T17:30:00.000Z",
        title: "Open Mercury bank account for EOS",
      },
    ]);

    expect(result.taskProposals[0]?.estimatedEffortHours).toBeCloseTo(1 / 60);
  });
});

describe("findPilotDuplicateGroups", () => {
  it("explicitly detects Mercury, EOS pitch, and medication duplicates", () => {
    const groups = findPilotDuplicateGroups([
      { id: "m1", title: "Open Mercury account for EOS" },
      { id: "m2", title: "Open bank account for EOS Inc." },
      { id: "p1", title: "Make EOS investor pitch" },
      { id: "p2", title: "Finish the pitch deck core" },
      { id: "h1", title: "Morning meds" },
      { id: "h2", title: "Take morning medications" },
    ]);

    expect(groups.map((group) => group.concept)).toEqual([
      "eos-pitch",
      "medication-routine",
      "mercury-account",
    ]);
  });

  it("reports singular pilot concepts before import as well as duplicates", () => {
    const groups = findPilotConceptGroups([
      { id: "m1", title: "Open Mercury bank account for EOS" },
      { id: "p1", title: "Investor One-Pager" },
      { id: "x1", title: "Unrelated task" },
    ]);

    expect(groups.map((group) => group.concept)).toEqual([
      "eos-pitch",
      "mercury-account",
    ]);
  });
});
