import type { Parameter } from "@optimitron/data/parameters";
import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  GLOBAL_POPULATION_2024,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_LIVES_SAVED_ANNUAL_GLOBAL,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";
import { HUMANITY_MANAGEMENT } from "@/lib/messaging";
import {
  FLOW_DOUBLING_ROUNDS_TO_TARGET,
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";

/**
 * Standard parameter slugs available to every trigger fire as `{{params.<key>}}`.
 *
 * These are pre-computed once and injected into the context so templates
 * can reference canonical values without freezing literal numbers in the
 * seed. When a parameter source changes, this is the only file that
 * needs updating — the rendered output flows through automatically.
 *
 * Each parameter is exposed in two variants:
 *   - `{{params.foo}}`        — raw rounded number, e.g. "604". Use in
 *                               read-aloud surfaces (phone script) or any
 *                               context that doesn't render markdown.
 *   - `{{params.fooLinked}}`  — markdown link to the canonical source, e.g.
 *                               "[604](https://manual.warondisease.org/...)".
 *                               Use in markdown-rendered surfaces (task
 *                               descriptions, HTML email bodies). Lets a
 *                               skeptical reader click through to verify.
 */
function roundParam(param: { value: number }, digits = 0): string {
  const factor = 10 ** digits;
  return String(Math.round(param.value * factor) / factor);
}

/**
 * Format a USD amount in the same compact-millions style the share flow
 * uses elsewhere ("$3.48M"). Matches docs/questions.md verbatim copy.
 */
function formatUsdMillions(param: { value: number }): string {
  const millions = param.value / 1_000_000;
  return `$${millions.toFixed(2)}M`;
}

/**
 * Pick the best citation URL for a parameter. Priority: the narrative
 * manual chapter (most user-friendly landing) > the calculations page
 * (math derivation) > the raw source (e.g. WHO database). Returns null
 * when none are present so the caller can fall back to plain text.
 */
function pickParameterUrl(param: Parameter): string | null {
  return param.manualPageUrl ?? param.calculationsUrl ?? param.sourceUrl ?? null;
}

/**
 * Render a parameter as a markdown link wrapping its formatted value.
 * If the parameter has no citation URL, falls back to the plain rendered
 * text — avoids producing broken `[value]()` links.
 */
function linkParam(param: Parameter, rendered: string): string {
  const url = pickParameterUrl(param);
  return url ? `[${rendered}](${url})` : rendered;
}

export function buildTriggerParams() {
  const militaryVsResearchRatio = roundParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO);
  const statusQuoYears = roundParam(STATUS_QUO_QUEUE_CLEARANCE_YEARS);
  const dfdaYears = roundParam(DFDA_QUEUE_CLEARANCE_YEARS);
  const apocalypseCount = roundParam(NUCLEAR_WINTER_OVERKILL_FACTOR);
  const annualLivesSaved = roundParam(TREATY_LIVES_SAVED_ANNUAL_GLOBAL);
  const healthYearsGain = roundParam(TREATY_HALE_GAIN_YEAR_15, 1);
  const lifetimeIncomeGain = formatUsdMillions(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA);
  const globalHumanity = formatFlowWords(GLOBAL_POPULATION_2024, 1);
  const majorityHumanity = formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1);

  return {
    /// 8 billion — rounded humans under management in the HMT role-play.
    globalHumanity,
    /// 4 billion — rounded majority-of-humanity treaty target.
    majorityHumanity,
    /// 32 — rounds if each reached human recruits two more humans.
    doublingRoundsToTarget: String(FLOW_DOUBLING_ROUNDS_TO_TARGET),
    /// One real call required for the phone-call training task.
    requiredPhoneCalls: String(HUMANITY_MANAGEMENT.requiredPhoneCalls),
    /// Two named assignment subtasks remain the Stage-1 minimum viable team.
    directHumanAssignments: String(HUMANITY_MANAGEMENT.directHumanAssignments),
    /// Each contacted human is asked to recruit two more humans.
    propagationAsksPerHuman: String(HUMANITY_MANAGEMENT.propagationAsksPerHuman),
    /// 604 — military spending vs government clinical-trials spending ratio.
    militaryVsResearchRatio,
    militaryVsResearchRatioLinked: linkParam(
      MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
      militaryVsResearchRatio,
    ),
    /// 443 — years to clear the disease-treatment queue at status-quo throughput.
    statusQuoYears,
    statusQuoYearsLinked: linkParam(STATUS_QUO_QUEUE_CLEARANCE_YEARS, statusQuoYears),
    /// 36 — years to clear the same queue with dFDA throughput (the 1% Treaty bet).
    dfdaYears,
    dfdaYearsLinked: linkParam(DFDA_QUEUE_CLEARANCE_YEARS, dfdaYears),
    /// 122 — nuclear-winter-scale civilization-ending capacity in the global arsenal.
    apocalypseCount,
    apocalypseCountLinked: linkParam(NUCLEAR_WINTER_OVERKILL_FACTOR, apocalypseCount),
    /// Annual global lives saved if the treaty's first-treatment timeline holds.
    annualLivesSaved,
    annualLivesSavedLinked: linkParam(TREATY_LIVES_SAVED_ANNUAL_GLOBAL, annualLivesSaved),
    /// 21.7 — HALE gain at year 15 under the Treaty trajectory. Used in the
    /// Promotion screen / first-task description compensation line.
    healthYearsGain,
    healthYearsGainLinked: linkParam(TREATY_HALE_GAIN_YEAR_15, healthYearsGain),
    /// $3.48M — per-capita lifetime income gain under the Treaty trajectory.
    /// Used in the Promotion screen / first-task description compensation line.
    lifetimeIncomeGain,
    lifetimeIncomeGainLinked: linkParam(
      TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
      lifetimeIncomeGain,
    ),
  };
  // Note: the Wishonia signature is intentionally NOT exposed as a template
  // token. Outgoing emails get the signature appended automatically by the
  // resend.ts send helpers — see @/lib/email/wishonia-signature. Embedding a
  // signature token in trigger templates would double-sign (template
  // expansion + email-layer append). Templates render task descriptions and
  // comment bodies; the email layer owns the email-only signature.
}

/**
 * Build the standard context object passed into every trigger fire.
 * Callers add their event-specific keys on top:
 *
 *   await fireTaskTriggersForEvent("user.signup", {
 *     ...buildTriggerContext(),
 *     user: { id, name, ... },
 *   });
 */
export function buildTriggerContext(
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    params: buildTriggerParams(),
    ...extras,
  };
}
