import { describe, expect, it } from "vitest"
import {
  calculateImpactLedger,
  HOURS_PER_YEAR,
  IMPACT_PER_VOTE,
  VOTING_BLOC_TARGET,
} from "./impact-ledger"
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  GLOBAL_REGISTERED_VOTERS,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/impact-params/parameters"

describe("impact ledger majority denominator", () => {
  it("uses the majority-of-humanity denominator instead of the Chenoweth threshold", () => {
    expect(VOTING_BLOC_TARGET).toBe(GLOBAL_REGISTERED_VOTERS.value)
    expect(VOTING_BLOC_TARGET).not.toBe(THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value)
  })

  it("uses generated per-vote impact parameters with the majority denominator", () => {
    expect(VOTER_LIVES_SAVED.value).toBeCloseTo(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.value / GLOBAL_REGISTERED_VOTERS.value,
      8,
    )
    expect(VOTER_SUFFERING_HOURS_PREVENTED.value).toBeCloseTo(
      DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.value / GLOBAL_REGISTERED_VOTERS.value,
      5,
    )
    expect(IMPACT_PER_VOTE.lives).toBe(VOTER_LIVES_SAVED.value)
    expect(IMPACT_PER_VOTE.sufferingHours).toBe(VOTER_SUFFERING_HOURS_PREVENTED.value)
    expect(IMPACT_PER_VOTE.lives).toBeCloseTo(2.603, 3)
    expect(IMPACT_PER_VOTE.sufferingHours / HOURS_PER_YEAR).toBeCloseTo(53.4, 1)
  })

  it("applies the per-vote values to the user's own vote plus referrals", () => {
    const metrics = calculateImpactLedger(0)

    expect(metrics.votesLogged).toBe(1)
    expect(metrics.livesSaved).toBeCloseTo(IMPACT_PER_VOTE.lives, 8)
    expect(metrics.sufferingHoursRemoved).toBeCloseTo(IMPACT_PER_VOTE.sufferingHours, 5)
  })
})
