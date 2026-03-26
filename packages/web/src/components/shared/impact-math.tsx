import React from "react"
import { formatCurrencyShort, formatLives, formatNumberShort } from "@/lib/formatters"
import { HOURS_PER_YEAR, IMPACT_PER_VOTE } from "@/lib/impact-ledger"
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  TREATY_CAMPAIGN_VOTING_BLOC_TARGET,
  formatParameter,
} from "@optimitron/data/parameters";
// Pre-calculated totals (one-time timeline shift benefits)
const totalLives = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED)
const totalDALYs = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_DALYS)
const totalEconomicValue = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE)
const totalSufferingHours = formatParameter(DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS)
const votingBlocTarget = formatParameter(TREATY_CAMPAIGN_VOTING_BLOC_TARGET, { compact: false })

// Derived per-vote impact values from impact-ledger
const livesPerVote = IMPACT_PER_VOTE.lives
const sufferingYearsPerVote = IMPACT_PER_VOTE.sufferingHours / HOURS_PER_YEAR
const valuePerVoteFormatted = formatCurrencyShort(IMPACT_PER_VOTE.economicValue, { significantDigits: 3 })

interface EquationProps {
  votes?: number
  className?: string
}

export function LivesEquation({ votes, className = "" }: EquationProps) {
  const count = votes || 1
  const value = count * IMPACT_PER_VOTE.lives
  const result = (votes && votes > 1)
    ? `${formatLives(value)} lives saved`
    : `${livesPerVote.toFixed(2)} lives/vote`

  return (
    <div className={className}>
      <EquationLogic
        votes={votes}
        numerator={`${totalLives} lives (one-time)`}
        denominator={`${votingBlocTarget} votes needed`}
        result={result}
      />
    </div>
  )
}

export function SufferingEquation({ votes, className = "" }: EquationProps) {
  const count = votes || 1
  const value = count * IMPACT_PER_VOTE.sufferingHours
  const result = (votes && votes > 1)
    ? `${formatNumberShort(value / HOURS_PER_YEAR)} years prevented`
    : `~${sufferingYearsPerVote.toFixed(1)} years/vote`

  return (
    <div className={className}>
      <EquationLogic
        votes={votes}
        numerator={`${totalSufferingHours} hours (one-time)`}
        denominator={`${votingBlocTarget} votes needed`}
        result={result}
      />
    </div>
  )
}

export function ValueEquation({ votes, className = "" }: EquationProps) {
  const count = votes || 1
  const value = count * IMPACT_PER_VOTE.economicValue
  const result = (votes && votes > 1)
    ? `${formatCurrencyShort(value, { significantDigits: 3 })} generated`
    : `~${valuePerVoteFormatted}/vote`

  return (
    <div className={className}>
      <EquationLogic
        votes={votes}
        numerator={`${totalEconomicValue} value (one-time)`}
        denominator={`${votingBlocTarget} votes needed`}
        result={result}
      />
    </div>
  )
}

function EquationLogic({ votes, numerator, denominator, result }: { votes?: number, numerator: string, denominator: string, result: string }) {
  if (votes && votes > 1) {
    return (
      <p>
        Your Votes ({votes.toLocaleString()}) × [({numerator}) ÷ ({denominator})] = <span className="text-primary font-black">{result}</span>
      </p>
    )
  }

  return (
    <p>
      ({numerator}) ÷ ({denominator}) = <span className="text-primary font-black">{result}</span>
    </p>
  )
}
