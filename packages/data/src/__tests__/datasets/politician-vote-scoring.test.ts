import { describe, expect, it } from "vitest";

import {
  scoreMemberVotes,
  type BillRollCalls,
} from "../../datasets/politician-vote-scoring";

const NDAA = { name: "NDAA", amount: 800, category: "military" } as const;
const OMNIBUS_NIH = { name: "Omnibus NIH", amount: 1000, category: "clinical_trials" } as const;

describe("scoreMemberVotes", () => {
  // Elissa Slotkin voted on these bills in the House and became a senator in
  // 2025. Looking only in her current chamber recorded every bill as
  // "NOT VOTING" with $0 totals.
  it("scores the House votes of a member who later moved to the Senate", () => {
    const bills: BillRollCalls[] = [
      {
        bill: NDAA,
        house: new Map([["S001208", "YEA"]]),
        senate: new Map([["P000603", "NAY"]]),
      },
      {
        bill: OMNIBUS_NIH,
        house: new Map([["S001208", "YEA"]]),
        senate: new Map([["P000603", "NAY"]]),
      },
    ];

    const score = scoreMemberVotes("S001208", bills, 0.03);

    expect(score.votes.map((v) => v.vote)).toEqual(["YEA", "YEA"]);
    expect(score.militaryDollarsVotedFor).toBe(800);
    expect(score.clinicalTrialDollarsVotedFor).toBe(30);
  });

  // A roll call lists every sitting member, including members who did not
  // vote. A member missing from both chambers was not in office.
  it("leaves out a bill voted on before the member took office", () => {
    const bills: BillRollCalls[] = [
      { bill: NDAA, house: new Map([["A000001", "YEA"]]), senate: new Map() },
      { bill: OMNIBUS_NIH, senate: new Map([["V000137", "NOT VOTING"]]) },
    ];

    const score = scoreMemberVotes("V000137", bills, 0.03);

    expect(score.votes).toEqual([
      { bill: "Omnibus NIH", vote: "NOT VOTING", amount: 1000, category: "clinical_trials" },
    ]);
    expect(score.militaryDollarsVotedFor).toBe(0);
    expect(score.clinicalTrialDollarsVotedFor).toBe(0);
  });
});
