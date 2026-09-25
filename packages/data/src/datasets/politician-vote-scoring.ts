/**
 * Score one member of Congress from the roll calls on the key budget bills.
 *
 * The scorecard generator (scripts/generate-politician-scorecards.ts) fetches
 * the roll calls; this module holds the pure scoring so it can be tested
 * without the network.
 */

export interface ScoredBill {
  name: string;
  amount: number;
  category: "military" | "clinical_trials" | "enforcement";
  sourceUrl?: string;
}

/** One roll call: bioguide ID → vote position ("YEA", "NAY", "NOT VOTING", ...). */
export type RollCallVotes = ReadonlyMap<string, string>;

export interface BillRollCalls {
  bill: ScoredBill;
  house?: RollCallVotes;
  senate?: RollCallVotes;
}

export interface ScoredMemberVote {
  bill: string;
  vote: string;
  amount: number;
  category: ScoredBill["category"];
  sourceUrl?: string;
}

export interface MemberVoteScore {
  /** YEA dollars on "military" and "enforcement" bills. */
  militaryDollarsVotedFor: number;
  /** YEA dollars on "clinical_trials" bills, times the clinical-trial share of the NIH budget. */
  clinicalTrialDollarsVotedFor: number;
  votes: ScoredMemberVote[];
}

const YEA_POSITIONS = new Set(["YEA", "AYE", "YES"]);

/**
 * A roll call lists every member of its chamber at the time of the vote,
 * including members who did not vote. So the vote is looked up in both
 * chambers: a member who moved from the House to the Senate cast their
 * earlier votes in the House. When neither roll call lists the member, they
 * were not in office for that vote (or, as a delegate, could not vote), and
 * the bill is left out instead of being recorded as "NOT VOTING". A member
 * who voted on the same bill in both chambers is scored on the House vote.
 */
export function scoreMemberVotes(
  bioguideId: string,
  bills: readonly BillRollCalls[],
  clinicalTrialShareOfNih: number,
): MemberVoteScore {
  let militaryDollarsVotedFor = 0;
  let clinicalTrialDollarsVotedFor = 0;
  const votes: ScoredMemberVote[] = [];

  for (const { bill, house, senate } of bills) {
    const vote = house?.get(bioguideId) ?? senate?.get(bioguideId);
    if (!vote) continue;

    votes.push({
      bill: bill.name,
      vote,
      amount: bill.amount,
      category: bill.category,
      sourceUrl: bill.sourceUrl,
    });

    if (!YEA_POSITIONS.has(vote)) continue;
    if (bill.category === "clinical_trials") {
      clinicalTrialDollarsVotedFor += bill.amount * clinicalTrialShareOfNih;
    } else {
      militaryDollarsVotedFor += bill.amount;
    }
  }

  return { militaryDollarsVotedFor, clinicalTrialDollarsVotedFor, votes };
}
