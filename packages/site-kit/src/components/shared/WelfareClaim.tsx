import { GLOBAL_GOVERNMENT_EXPENSE_ANNUAL } from "@optimitron/data/parameters"
import { formatParameter } from "@optimitron/data/parameters/compact-format"
import { ParameterValue } from "./ParameterValue"

/**
 * The campaign's opening claim: what the public pays governments, and what
 * the payment is for. The number is the canonical
 * `GLOBAL_GOVERNMENT_EXPENSE_ANNUAL` parameter, so the sentence and the
 * source stay tied together.
 *
 * `valueOverride` drops the "/year" suffix the formatter appends, because the
 * sentence already says "a year".
 */
export function formatWelfareClaimAmountText(figures = 3) {
  return formatParameter(GLOBAL_GOVERNMENT_EXPENSE_ANNUAL, {
    figures,
  }).replace(/\/year$/u, "")
}

export const WELFARE_CLAIM_AMOUNT_TEXT = formatWelfareClaimAmountText()

export const WELFARE_CLAIM_METRIC_TEXT =
  "maximize median healthy life years and median after-tax inflation-adjusted income"

export const WELFARE_CLAIM_METRIC_SENTENCE =
  "Maximize median healthy life years and median after-tax inflation-adjusted income."

export const WELFARE_CLAIM_TEXT = `You pay governments ${WELFARE_CLAIM_AMOUNT_TEXT} a year to promote the general welfare — i.e. ${WELFARE_CLAIM_METRIC_TEXT}.`

export type WelfareClaimVariant = "full" | "metric"

interface WelfareClaimProps {
  variant?: WelfareClaimVariant
  className?: string
  figures?: number
}

export function WelfareClaim({
  variant = "full",
  className,
  figures = 3,
}: WelfareClaimProps) {
  if (variant === "metric") {
    return <span className={className}>{WELFARE_CLAIM_METRIC_SENTENCE}</span>
  }

  return (
    <span className={className}>
      You pay governments{" "}
      <ParameterValue
        figures={figures}
        param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
        valueOverride={formatWelfareClaimAmountText(figures)}
      />{" "}
      a year to promote the general welfare — i.e. {WELFARE_CLAIM_METRIC_TEXT}.
    </span>
  )
}
