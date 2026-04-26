"use client";

import type { ReactNode } from "react";
import {
  CURRENT_TRIAL_SLOTS_AVAILABLE,
  DFDA_PATIENTS_FUNDABLE_ANNUALLY,
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  DFDA_QUEUE_CLEARANCE_YEARS,
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS,
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS,
  DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS,
  DFDA_TRIAL_SUBSIDIES_ANNUAL,
  DIH_TREASURY_TRIAL_SUBSIDIES_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  EFFICACY_LAG_YEARS,
  GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT,
  RARE_DISEASES_COUNT_GLOBAL,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT,
  FLOW_TOTAL_LIVES_SAVED,
  FLOW_TOTAL_SUFFERING_HOURS,
  formatFlowCompactCurrency,
  formatFlowCompactParam,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";

const treatyFundingCompact = formatFlowCompactCurrency(TREATY_ANNUAL_FUNDING, 3);
const globalMilitarySpendingCompact = formatFlowCompactCurrency(
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  3,
);
const treatyReductionPctText = formatFlowWords(TREATY_REDUCTION_PCT, 1);
const statusQuoQueueYearsText = formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);
const dfdaQueueYearsText = formatFlowWords(DFDA_QUEUE_CLEARANCE_YEARS, 2);
const trialCapacityMultiplierText = formatFlowWords(DFDA_TRIAL_CAPACITY_MULTIPLIER, 2);
const trialCapacityMultiplierPreciseText = formatFlowWords(DFDA_TRIAL_CAPACITY_MULTIPLIER, 3);
const totalLivesSavedText = formatFlowWords(FLOW_TOTAL_LIVES_SAVED, 3);
const totalSufferingHoursText = formatFlowWords(FLOW_TOTAL_SUFFERING_HOURS, 3);
const dfdaPatientsFundableCompact = formatFlowCompactParam(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 3);
const currentTrialSlotsCompact = formatFlowCompactParam(CURRENT_TRIAL_SLOTS_AVAILABLE, 2);

const totalLivesSavedCi = DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_LIVES_SAVED.confidenceInterval;
const totalSufferingHoursCi =
  DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_SUFFERING_HOURS.confidenceInterval;
const totalLivesSavedCiText = totalLivesSavedCi
  ? `${formatFlowCompactParam({ value: totalLivesSavedCi[0] }, 2)}–${formatFlowCompactParam({ value: totalLivesSavedCi[1] }, 3)}`
  : "";
const totalSufferingHoursCiText = totalSufferingHoursCi
  ? `${formatFlowCompactParam({ value: totalSufferingHoursCi[0] }, 3)}–${formatFlowCompactParam({ value: totalSufferingHoursCi[1] }, 3)}`
  : "";

interface TreatyMechanismExplainerProps {
  variant?: "full" | "compact";
  onDetailExpanded?: (detailId: string) => void;
  /** Closing line after the last step. Defaults to the citation reminder. Pass null to omit. */
  closingLine?: ReactNode | null;
}

function StepHeadline({ children }: { children: ReactNode }) {
  return <p className="text-xl font-black leading-tight">{children}</p>;
}

function DetailsBlock({
  children,
  summary = "Show the math",
  detailId,
  onExpand,
}: {
  children: ReactNode;
  summary?: string;
  detailId: string;
  onExpand?: (detailId: string) => void;
}) {
  return (
    <details
      className="border-4 border-primary bg-background p-4 text-sm font-bold leading-snug text-foreground"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          onExpand?.(detailId);
        }
      }}
    >
      <summary className="cursor-pointer font-black uppercase">{summary}</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export function TreatyMechanismExplainer({
  variant = "full",
  onDetailExpanded,
  closingLine,
}: TreatyMechanismExplainerProps) {
  if (variant === "compact") {
    return (
      <p className="text-lg font-bold leading-snug sm:text-xl">
        {treatyFundingCompact}/year ({treatyReductionPctText} of {globalMilitarySpendingCompact}{" "}
        military) → {formatFlowCompactParam(DFDA_PATIENTS_FUNDABLE_ANNUALLY, 2)} patients tested
        (at {formatFlowCompactCurrency(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, 3)} each, not{" "}
        {formatFlowCompactCurrency(TRADITIONAL_PHASE3_COST_PER_PATIENT, 2)}) →{" "}
        {trialCapacityMultiplierText}x research capacity → {statusQuoQueueYearsText} years
        eradication becomes {dfdaQueueYearsText} → {totalLivesSavedText} avoidable deaths averted
        + {totalSufferingHoursText} hours of suffering.
      </p>
    );
  }

  const closing =
    closingLine === undefined
      ? "Every number above has a citation. This math is not my opinion."
      : closingLine;

  return (
    <div className="space-y-5">
      <StepHeadline>
        <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} /> of global military spending ={" "}
        <ParameterValue param={TREATY_ANNUAL_FUNDING} figures={3} /> per year.
      </StepHeadline>
      <DetailsBlock detailId="military-spending-to-treaty-funding" onExpand={onDetailExpanded}>
        <p>
          Global military spending 2024 ={" "}
          <ParameterValue param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024} figures={3} /> (SIPRI).{" "}
          <ParameterValue param={TREATY_REDUCTION_PCT} figures={1} /> of that ={" "}
          {treatyFundingCompact}.
        </p>
      </DetailsBlock>

      <StepHeadline>
        Pragmatic clinical trials cost{" "}
        <ParameterValue
          param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
          display="withUnit"
          figures={3}
        />
        , not{" "}
        <ParameterValue
          param={{ ...TRADITIONAL_PHASE3_COST_PER_PATIENT, unit: "USD" }}
          figures={3}
        />
        . So {treatyFundingCompact} funds{" "}
        <ParameterValue param={DFDA_PATIENTS_FUNDABLE_ANNUALLY} figures={2} /> patients per year —
        instead of today&apos;s{" "}
        <ParameterValue param={CURRENT_TRIAL_SLOTS_AVAILABLE} figures={2} />.
      </StepHeadline>
      <DetailsBlock detailId="trial-capacity-funding" onExpand={onDetailExpanded}>
        <p>
          Traditional Phase 3 trials: median{" "}
          <ParameterValue
            param={TRADITIONAL_PHASE3_COST_PER_PATIENT}
            display="withUnit"
            figures={3}
          />{" "}
          (FDA data). Pragmatic trials:{" "}
          <ParameterValue
            param={DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT}
            display="withUnit"
            figures={3}
          />{" "}
          (ADAPTABLE trial real-world cost). Meta-analysis of 64 pragmatic trials finds median{" "}
          <ParameterValue
            param={PMC_PRAGMATIC_TRIAL_MEDIAN_COST_PER_PATIENT}
            display="withUnit"
            figures={2}
          />{" "}
          (Ramsberg & Platt 2018). Using conservative{" "}
          <ParameterValue
            param={{ ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, unit: "USD" }}
            figures={3}
          />
          . {treatyFundingCompact} ×{" "}
          <ParameterValue param={DIH_TREASURY_TRIAL_SUBSIDIES_PCT} figures={1} /> allocated to
          patient subsidies = {formatFlowCompactCurrency(DFDA_TRIAL_SUBSIDIES_ANNUAL, 3)} ÷{" "}
          <ParameterValue
            param={{ ...DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT, unit: "USD" }}
            figures={3}
          />{" "}
          = {dfdaPatientsFundableCompact} patients tested per year. Current global trial
          participation: {currentTrialSlotsCompact} patients/year (IQVIA 2022).
        </p>
      </DetailsBlock>

      <StepHeadline>
        That&apos;s{" "}
        <ParameterValue param={DFDA_TRIAL_CAPACITY_MULTIPLIER} display="withUnit" figures={2} />{" "}
        more clinical trial capacity. Disease eradication compresses from{" "}
        <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} display="integer" /> years to{" "}
        <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" />.
      </StepHeadline>
      <DetailsBlock detailId="queue-clearance-compression" onExpand={onDetailExpanded}>
        <p>
          {dfdaPatientsFundableCompact} funded patients ÷ {currentTrialSlotsCompact} current ={" "}
          {trialCapacityMultiplierPreciseText}x multiplier.{" "}
          <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} figures={3} /> diseases
          currently have no effective treatment (
          <ParameterValue param={FLOW_DISEASES_WITHOUT_EFFECTIVE_TREATMENT_PCT} figures={2} /> of ~
          <ParameterValue param={RARE_DISEASES_COUNT_GLOBAL} figures={1} /> rare diseases per
          Orphanet 2024). At today&apos;s rate, first-ever treatments emerge for{" "}
          <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} figures={2} /> new
          diseases/year. <ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} figures={3} />{" "}
          ÷ <ParameterValue param={NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR} figures={2} /> ={" "}
          <strong>
            <ParameterValue param={STATUS_QUO_QUEUE_CLEARANCE_YEARS} display="integer" /> years
          </strong>{" "}
          to clear the queue. With {trialCapacityMultiplierPreciseText}x capacity:{" "}
          {statusQuoQueueYearsText} ÷ {trialCapacityMultiplierPreciseText} ={" "}
          <strong>
            <ParameterValue param={DFDA_QUEUE_CLEARANCE_YEARS} display="integer" /> years
          </strong>
          .
        </p>
      </DetailsBlock>

      <StepHeadline>
        <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> people don&apos;t die of a
        curable disease while waiting. Plus{" "}
        <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours of suffering
        doesn&apos;t happen.
      </StepHeadline>
      <DetailsBlock detailId="lives-and-suffering-prevented" onExpand={onDetailExpanded}>
        <p>
          Average treatment arrival accelerates by{" "}
          <ParameterValue param={DFDA_TRIAL_CAPACITY_PLUS_EFFICACY_LAG_YEARS} figures={3} /> years
          (
          <ParameterValue
            param={DFDA_TRIAL_CAPACITY_TREATMENT_ACCELERATION_YEARS}
            figures={3}
          />{" "}
          from more trials + <ParameterValue param={EFFICACY_LAG_YEARS} figures={2} /> from
          eliminating FDA&apos;s efficacy-testing lag). Over that window: global disease deaths (~
          {formatFlowCompactParam(GLOBAL_ANNUAL_DEATHS_CURABLE_DISEASES, 2)}/year) × avoidable
          fraction × years = <ParameterValue param={FLOW_TOTAL_LIVES_SAVED} figures={3} /> deaths
          prevented (95% CI: {totalLivesSavedCiText}). Suffering:{" "}
          <ParameterValue param={FLOW_TOTAL_SUFFERING_HOURS} figures={3} /> hours (95% CI:{" "}
          {totalSufferingHoursCiText}) from DALY YLD component × hours per year. Full calculation
          at manual.warondisease.org.
        </p>
      </DetailsBlock>

      {closing ? (
        <p className="text-lg font-bold leading-snug sm:text-xl">{closing}</p>
      ) : null}
    </div>
  );
}
