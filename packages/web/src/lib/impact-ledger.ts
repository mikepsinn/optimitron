import {
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters";

export const VOTING_BLOC_TARGET = TREATY_CAMPAIGN_VOTING_BLOC_TARGET.value;
export const MINUTES_PER_PERSUASION = 15;
export const HOURS_PER_YEAR = 8_760;

export const IMPACT_PER_VOTE = {
  lives: VOTER_LIVES_SAVED.value,
  sufferingHours: VOTER_SUFFERING_HOURS_PREVENTED.value,
  economicValue: VOTER_LIVES_SAVED.value * 150_000, // QALY standard
};

export const VOTES_PER_HOUR = 60 / MINUTES_PER_PERSUASION;
export const LIVES_PER_HOUR = IMPACT_PER_VOTE.lives * VOTES_PER_HOUR;
export const SUFFERING_YEARS_PER_HOUR = (IMPACT_PER_VOTE.sufferingHours / HOURS_PER_YEAR) * VOTES_PER_HOUR;
export const VALUE_PER_HOUR = IMPACT_PER_VOTE.economicValue * VOTES_PER_HOUR;

export interface ImpactLedgerMetrics {
  votesLogged: number;
  livesSaved: number;
  sufferingHoursRemoved: number;
  economicValueCreated: number;
  hoursInvested: number;
  valuePerHour: number;
  perVote: typeof IMPACT_PER_VOTE;
}

export function calculateImpactLedger(
  votesLogged: number,
): ImpactLedgerMetrics {
  const safeVotes = Math.max(0, votesLogged) + 1;
  const livesSaved = safeVotes * IMPACT_PER_VOTE.lives;
  const sufferingHoursRemoved = safeVotes * IMPACT_PER_VOTE.sufferingHours;
  const economicValueCreated = safeVotes * IMPACT_PER_VOTE.economicValue;
  const hoursInvested = safeVotes * (MINUTES_PER_PERSUASION / 60);
  const valuePerHour =
    hoursInvested > 0
      ? economicValueCreated / hoursInvested
      : IMPACT_PER_VOTE.economicValue * (60 / MINUTES_PER_PERSUASION);

  return {
    votesLogged: safeVotes,
    livesSaved,
    sufferingHoursRemoved,
    economicValueCreated,
    hoursInvested,
    valuePerHour,
    perVote: IMPACT_PER_VOTE,
  };
}

export function getNextLifeMilestoneMessage(livesSaved: number): {
  current: number;
  next: number;
} {
  const current = Math.max(0, livesSaved);
  return {
    current,
    next: current + IMPACT_PER_VOTE.lives,
  };
}
