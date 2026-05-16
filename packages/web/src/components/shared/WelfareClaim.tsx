import { GLOBAL_GOVERNMENT_EXPENSE_ANNUAL } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  formatWelfareClaimAmountText,
  WELFARE_CLAIM_METRIC_TEXT,
  WELFARE_CLAIM_METRIC_SENTENCE,
  WELFARE_CLAIM_TEXT,
} from "@/components/shared/WelfareClaim.core";

export type WelfareClaimVariant = "full" | "metric";

interface WelfareClaimProps {
  variant?: WelfareClaimVariant;
  className?: string;
  figures?: number;
}

export function WelfareClaim({
  variant = "full",
  className,
  figures = 3,
}: WelfareClaimProps) {
  if (variant === "metric") {
    return <span className={className}>{WELFARE_CLAIM_METRIC_SENTENCE}</span>;
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
  );
}

export { WELFARE_CLAIM_TEXT };
