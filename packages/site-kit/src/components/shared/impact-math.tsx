import React from "react"
import { formatCurrencyShort, formatLives, formatNumberShort } from "../../lib/formatters"
import { HOURS_PER_YEAR, IMPACT_PER_VOTE } from "../../lib/impact-ledger"
import {
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
} from "@optimitron/data/parameters"
import { ParameterInline } from "./ParameterValue"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "../../lib/majority-humanity-target"

// Derived per-vote impact values from generated parameter-backed impact ledger.
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
        numerator={<><ParameterInline param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED} /> lives (one-time)</>}
        denominator={<><ParameterInline param={MAJORITY_OF_HUMANS_ON_EARTH} format={{ compact: false }} /> humans in the majority target</>}
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
        numerator={<><ParameterInline param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS} /> hours (one-time)</>}
        denominator={<><ParameterInline param={MAJORITY_OF_HUMANS_ON_EARTH} format={{ compact: false }} /> humans in the majority target</>}
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
        numerator={<><ParameterInline param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_ECONOMIC_VALUE} /> value (one-time)</>}
        denominator={<><ParameterInline param={MAJORITY_OF_HUMANS_ON_EARTH} format={{ compact: false }} /> humans in the majority target</>}
        result={result}
      />
    </div>
  )
}

function EquationLogic({
  votes,
  numerator,
  denominator,
  result,
}: {
  votes?: number
  numerator: React.ReactNode
  denominator: React.ReactNode
  result: string
}) {
  if (votes && votes > 1) {
    return (
      <p>
        Your confirmed votes ({votes.toLocaleString()}) × [({numerator}) ÷ ({denominator})] = <span className="text-primary font-black">{result}</span>
      </p>
    )
  }
  
  return (
    <p>
      ({numerator}) ÷ ({denominator}) = <span className="text-primary font-black">{result}</span>
    </p>
  )
}
