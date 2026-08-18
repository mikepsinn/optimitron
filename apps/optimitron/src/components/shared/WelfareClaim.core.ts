import { GLOBAL_GOVERNMENT_EXPENSE_ANNUAL } from "@optimitron/data/parameters";
import { formatParameterValueText } from "@/components/shared/ParameterValue.core";

export function formatWelfareClaimAmountText(figures = 3) {
  return formatParameterValueText({
    figures,
    param: GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  }).replace(/\/year$/u, "");
}

export const WELFARE_CLAIM_AMOUNT_TEXT = formatWelfareClaimAmountText();

export const WELFARE_CLAIM_METRIC_TEXT =
  "maximize median healthy life years and median after-tax inflation-adjusted income";

export const WELFARE_CLAIM_METRIC_SENTENCE =
  "Maximize median healthy life years and median after-tax inflation-adjusted income.";

export const WELFARE_CLAIM_TEXT = `You pay governments ${WELFARE_CLAIM_AMOUNT_TEXT} a year to promote the general welfare — i.e. ${WELFARE_CLAIM_METRIC_TEXT}.`;
