import {
  DFDA_QUEUE_CLEARANCE_YEARS,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  TREATY_HALE_GAIN_YEAR_15,
  TREATY_LIVES_SAVED_ANNUAL_GLOBAL,
  TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA,
} from "@optimitron/data/parameters";

/**
 * Standard parameter slugs available to every trigger fire as `{{params.<key>}}`.
 *
 * These are pre-computed once and injected into the context so templates
 * can reference canonical values without freezing literal numbers in the
 * seed. When a parameter source changes, this is the only file that
 * needs updating — the rendered output flows through automatically.
 *
 * Numbers are rounded for human-readable copy. If a template needs the
 * raw float, add a separate `params.foo.raw` token.
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

export function buildTriggerParams() {
  return {
    /// 604 — military spending vs government clinical-trials spending ratio.
    militaryVsResearchRatio: roundParam(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO),
    /// 443 — years to clear the disease-treatment queue at status-quo throughput.
    statusQuoYears: roundParam(STATUS_QUO_QUEUE_CLEARANCE_YEARS),
    /// 36 — years to clear the same queue with dFDA throughput (the 1% Treaty bet).
    dfdaYears: roundParam(DFDA_QUEUE_CLEARANCE_YEARS),
    /// Annual global lives saved if the treaty's first-treatment timeline holds.
    annualLivesSaved: roundParam(TREATY_LIVES_SAVED_ANNUAL_GLOBAL),
    /// 21.7 — HALE gain at year 15 under the Treaty trajectory. Used in the
    /// Promotion screen / first-task description compensation line.
    healthYearsGain: roundParam(TREATY_HALE_GAIN_YEAR_15, 1),
    /// $3.48M — per-capita lifetime income gain under the Treaty trajectory.
    /// Used in the Promotion screen / first-task description compensation line.
    lifetimeIncomeGain: formatUsdMillions(TREATY_TRAJECTORY_LIFETIME_INCOME_GAIN_PER_CAPITA),
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
