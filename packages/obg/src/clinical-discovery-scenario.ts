/** Inputs for one explicit, finite-horizon clinical-discovery scenario. */
export interface ClinicalDiscoveryScenarioInput {
  horizonYears: number;
  /** Annual rate as a fraction; each annual flow is discounted at year-end. */
  discountRate: number;
  /** DALYs/year for the population being evaluated, not necessarily global. */
  annualBurdenDalys: number;
  /** Fraction of that burden potentially avoidable with effective treatments. */
  avoidableFraction: number;
  /** Fraction of potential benefit realized through adoption and delivery. */
  adoptionFraction: number;
  /** Mean discovery wait, excluding the separate availability lag. */
  baselineWaitYears: number;
  baselineLagYears: number;
  reformLagYears: number;
  /** Effective discovery-rate multiplier, not a funding or trial-slot ratio. */
  discoveryMultiplier: number;
  /**
   * Optional discovery-clock schedule starting at year zero. Ordered interval
   * ends; the multiplier returns to one after the last end. Overrides the
   * constant discoveryMultiplier when supplied (an empty schedule is baseline).
   */
  discoverySchedule?: readonly { untilYear: number; multiplier: number }[];
}

export interface ClinicalDiscoveryScenarioResult {
  /** Cumulative health-years averted over the horizon; not life expectancy. */
  dalysAverted: number;
  discountedDalysAverted: number;
  /** Integrated incremental DALYs during each year, before discounting. */
  annualDalysAverted: number[];
}

/** Integrate availability over one interval with a constant discovery hazard. */
function integrateHazardInterval(hazard: number, cumulativeHazardAtStart: number, duration: number): number {
  const z = hazard * duration;
  // 1 - (1 - exp(-z))/z loses precision for small hazards. Its series keeps
  // finite, very long discovery waits from rounding early benefits to zero.
  const newlyAvailableFraction = z < 1e-4
    ? z / 2 - z * z / 6 + z * z * z / 24 - z * z * z * z / 120
    : 1 + Math.expm1(-z) / z;
  const survivalAtStart = Math.exp(-cumulativeHazardAtStart);
  return duration * (-Math.expm1(-cumulativeHazardAtStart) + survivalAtStart * newlyAvailableFraction);
}

/** Integrate 1 - exp(-H(max(0, t-lag))) across each schedule breakpoint. */
function integratedAvailability(
  baselineHazard: number,
  schedule: NonNullable<ClinicalDiscoveryScenarioInput['discoverySchedule']>,
  lag: number,
  start: number,
  end: number,
): number {
  const from = Math.max(0, start - lag);
  const to = Math.max(0, end - lag);
  if (from === to) return 0;
  let cumulativeHazard = 0;
  let segmentStart = 0;
  let integral = 0;
  for (let i = 0; segmentStart < to; i++) {
    const step = schedule[i];
    const segmentEnd = Math.min(to, step?.untilYear ?? to);
    const hazard = baselineHazard * (step?.multiplier ?? 1);
    const overlapStart = Math.max(from, segmentStart);
    if (overlapStart < segmentEnd) {
      integral += integrateHazardInterval(
        hazard,
        cumulativeHazard + hazard * (overlapStart - segmentStart),
        segmentEnd - overlapStart,
      );
    }
    cumulativeHazard += hazard * (segmentEnd - segmentStart);
    segmentStart = segmentEnd;
  }
  return integral;
}

/**
 * Evaluate one conditional-mean scenario, not an empirically identified effect.
 * A memoryless discovery hazard (h0 = 1 / mean wait) and constant
 * annual burden are explicit model assumptions. A first effective treatment is
 * not a certain cure: avoidability and adoption limit its realized benefit.
 * The caller supplies population scope and jointly sampled uncertain inputs.
 *
 * Availability is 1-exp(-H(max(0,t-lag))), where H(s) is the cumulative discovery
 * hazard through discovery-clock time s. Without a schedule the reform hazard
 * is constant h0*multiplier. A schedule limits how long added funding or access
 * changes that hazard; its rate returns to baseline after the last interval.
 * Earlier discoveries can still yield later benefits without assuming continued
 * funding. Funding-only, access-only, and joint reforms
 * use this same comparison. Evaluate a joint reform once; do not add overlapping
 * standalone results. Slower discovery or longer lags may produce negative DALYs
 * averted, which are retained. Nothing after the finite horizon is counted.
 *
 * Annual flows integrate availability over [year - 1, year], rather than treating
 * a year-end availability rate as if it applied for the entire preceding year.
 */
export function evaluateClinicalDiscoveryScenario(
  input: ClinicalDiscoveryScenarioInput,
): ClinicalDiscoveryScenarioResult {
  const { discoverySchedule, ...numericInputs } = input;
  if (!Object.values(numericInputs).every(Number.isFinite)) {
    throw new Error('Clinical discovery inputs must be finite');
  }
  if (!Number.isSafeInteger(input.horizonYears) || input.horizonYears < 1) {
    throw new Error('Clinical discovery horizon must be a positive integer number of years');
  }
  if (input.discountRate < 0 || input.annualBurdenDalys < 0 || input.baselineWaitYears <= 0
    || input.baselineLagYears < 0 || input.reformLagYears < 0 || input.discoveryMultiplier < 0) {
    throw new Error('Rates, burden, lags, and multipliers must be nonnegative; discovery wait must be positive');
  }
  if (input.avoidableFraction < 0 || input.avoidableFraction > 1
    || input.adoptionFraction < 0 || input.adoptionFraction > 1) {
    throw new Error('Avoidability and adoption must be fractions between zero and one');
  }
  const baselineHazard = 1 / input.baselineWaitYears;
  if (!Number.isFinite(baselineHazard)) {
    throw new Error('Derived discovery hazards must be finite');
  }
  const schedule: { untilYear: number; multiplier: number }[] = [];
  let previousEnd = 0;
  for (const step of discoverySchedule ?? [{ untilYear: input.horizonYears, multiplier: input.discoveryMultiplier }]) {
    if (!Number.isFinite(step.untilYear) || step.untilYear <= previousEnd
      || !Number.isFinite(step.multiplier) || step.multiplier < 0
      || !Number.isFinite(baselineHazard * step.multiplier)) {
      throw new Error('Discovery schedule needs increasing finite year ends and nonnegative finite hazards');
    }
    previousEnd = step.untilYear;
    const previous = schedule[schedule.length - 1];
    if (previous?.multiplier === step.multiplier) previous.untilYear = step.untilYear;
    else schedule.push({ ...step });
  }
  // The implicit tail already has multiplier one. Removing that redundant
  // interval also makes an all-baseline schedule exactly the no-change case.
  if (schedule[schedule.length - 1]?.multiplier === 1) schedule.pop();

  const realizableBurden = input.annualBurdenDalys * input.avoidableFraction * input.adoptionFraction;
  const annualDalysAverted: number[] = [];
  let dalysAverted = 0;
  let discountedDalysAverted = 0;
  for (let year = 1; year <= input.horizonYears; year++) {
    const baseline = integratedAvailability(baselineHazard, [], input.baselineLagYears, year - 1, year);
    const reform = integratedAvailability(baselineHazard, schedule, input.reformLagYears, year - 1, year);
    const annual = realizableBurden * (reform - baseline);
    annualDalysAverted.push(annual);
    dalysAverted += annual;
    discountedDalysAverted += annual / (1 + input.discountRate) ** year;
  }
  if (!Number.isFinite(dalysAverted) || !Number.isFinite(discountedDalysAverted)) {
    throw new Error('Clinical discovery totals exceed the finite numeric range');
  }
  return { dalysAverted, discountedDalysAverted, annualDalysAverted };
}
