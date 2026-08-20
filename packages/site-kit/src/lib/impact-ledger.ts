import {
  EFFICACY_LAG_YEARS,
  GLOBAL_REGISTERED_VOTERS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  STANDARD_ECONOMIC_QALY_VALUE_USD,
  HOURS_PER_YEAR as HOURS_PER_YEAR_PARAMETER,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters"

export const VOTING_BLOC_TARGET = GLOBAL_REGISTERED_VOTERS.value
export const REGULATORY_DELAY_YEARS = EFFICACY_LAG_YEARS.value
export const MINUTES_PER_PERSUASION = 15
export const HOURS_PER_YEAR = HOURS_PER_YEAR_PARAMETER.value

export const IMPACT_TOTALS = {
  lives: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value,
  sufferingHours: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value,
  economicValue: DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE.value,
}

export const YLD_TIMELINE_SHIFT = Math.round(IMPACT_TOTALS.sufferingHours / HOURS_PER_YEAR)
export const DALYS_TIMELINE_SHIFT = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS.value
export const VALUE_PER_DALY = STANDARD_ECONOMIC_QALY_VALUE_USD.value

// Per-vote share of one-time benefits (total / humans in the majority target)
export const IMPACT_PER_VOTE = {
  lives: VOTER_LIVES_SAVED.value,
  sufferingHours: VOTER_SUFFERING_HOURS_PREVENTED.value,
  economicValue: IMPACT_TOTALS.economicValue / VOTING_BLOC_TARGET,
}

export const VOTES_PER_HOUR = 60 / MINUTES_PER_PERSUASION
export const VALUE_PER_HOUR = IMPACT_PER_VOTE.economicValue * VOTES_PER_HOUR
export const LIVES_PER_HOUR = IMPACT_PER_VOTE.lives * VOTES_PER_HOUR
export const SUFFERING_YEARS_PER_HOUR = (IMPACT_PER_VOTE.sufferingHours / HOURS_PER_YEAR) * VOTES_PER_HOUR

export interface ImpactLedgerMetrics {
  votesLogged: number
  livesSaved: number
  sufferingHoursRemoved: number
  economicValueCreated: number
  hoursInvested: number
  valuePerHour: number
  perVote: typeof IMPACT_PER_VOTE
}

export function calculateImpactLedger(votesLogged: number): ImpactLedgerMetrics {
  // Always add 1 for their own vote, so the count increments properly with referrals
  // This ensures: 0 referrals → 1 vote, 1 referral → 2 votes, etc.
  const safeVotes = Math.max(0, votesLogged) + 1
  const livesSaved = safeVotes * IMPACT_PER_VOTE.lives
  const sufferingHoursRemoved = safeVotes * IMPACT_PER_VOTE.sufferingHours
  const economicValueCreated = safeVotes * IMPACT_PER_VOTE.economicValue
  const hoursInvested = safeVotes * (MINUTES_PER_PERSUASION / 60)
  const valuePerHour =
    hoursInvested > 0 ? economicValueCreated / hoursInvested : IMPACT_PER_VOTE.economicValue * VOTES_PER_HOUR

  return {
    votesLogged: safeVotes,
    livesSaved,
    sufferingHoursRemoved,
    economicValueCreated,
    hoursInvested,
    valuePerHour,
    perVote: IMPACT_PER_VOTE,
  }
}

export function getNextLifeMilestoneMessage(livesSaved: number): { current: number; next: number } {
  const current = Math.max(0, livesSaved)
  return {
    current,
    next: current + IMPACT_PER_VOTE.lives,
  }
}

