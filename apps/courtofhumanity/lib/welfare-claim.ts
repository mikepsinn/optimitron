import {
  fmtParamValueOnly,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
} from "@optimitron/data/parameters";

/**
 * The welfare-claim payment amount ("$36.5 trillion"), formatted exactly as
 * the monolith's `WelfareClaim.core.ts` does: value-only formatting with the
 * "/year" unit suffix stripped.
 */
export function formatWelfareClaimAmountText(figures = 3) {
  return fmtParamValueOnly(GLOBAL_GOVERNMENT_EXPENSE_ANNUAL, figures).replace(
    /\/year$/u,
    "",
  );
}

export const WELFARE_CLAIM_AMOUNT_TEXT = formatWelfareClaimAmountText();
