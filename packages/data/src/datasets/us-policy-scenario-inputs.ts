/**
 * Reference interventions for the five structural policy proposals.
 *
 * Published outcomes retain their original population, denominator and horizon.
 * Scenario ranges are sensitivity assumptions, not confidence intervals. A
 * triangular distribution over those ranges is a decision-model prior chosen
 * by the caller, never a distribution reported by the cited study.
 *
 * Null means that this mechanism does not estimate an outcome. In particular,
 * cohort earnings, rental savings, QALYs and DALYs are not national medians.
 */
import {
  DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT,
  EVENTUALLY_AVOIDABLE_DALY_PCT,
  GLOBAL_ANNUAL_DALY_BURDEN,
  NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR,
  QALYS_PER_COVID_DEATH_AVERTED,
  RARE_DISEASES_COUNT_GLOBAL,
  RECOVERY_TRIAL_GLOBAL_LIVES_SAVED,
  RECOVERY_TRIAL_TOTAL_COST,
  STATE_RTT_IMPLEMENTATION_COST_TOTAL,
  STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER,
} from '../parameters/parameters-calculations-citations.js';
import type { Parameter } from '../parameters/parameters-calculations-citations.js';

export interface PolicyScenarioPrimitive {
  /** Reuse an id across models to reuse the same uncertainty draw. */
  id: string;
  label: string;
  unit: string;
  low: number;
  mode: number;
  high: number;
  evidence: 'empirical' | 'scenario';
  rangeKind: 'fixed' | 'published-interval' | 'scenario-range';
  /** Present only when the source reports a statistical interval. */
  confidenceLevel?: number;
  source: string;
  rationale: string;
}

export interface PolicyScenarioOutcomes {
  costUsd: number;
  /** Aggregate participant lifetime earnings NPV, not median income. */
  incomeNpvUsd: number | null;
  qalys: number | null;
  dalys: number | null;
  deathsAverted: number | null;
  /** Gross renter expenditure reduction; not net social surplus or wages. */
  renterSavingsUsd: number | null;
  trialParticipants: number | null;
}

export interface PolicyScenarioInput {
  policyId: string;
  policyName: string;
  scope: string;
  referenceCostUsd: number;
  /**
   * Safety constraint limiting allocation to one reference intervention.
   * National absorption capacity is unidentified: optimizing within this cap
   * does not identify a nationally optimal appropriation.
   */
  annualFundingCapUsd: number;
  costBasis: string;
  /** Null where the canonical snapshot does not establish a price year. */
  priceYear: number | null;
  horizonYears: number | null;
  lagYears: number | null;
  benefitTiming: string;
  overlapGroup?: 'clinical-trial-discovery';
  /** Conditional global lifetime models cannot enter a finite US cohort rank. */
  comparableForAllocation: boolean;
  parameters: readonly PolicyScenarioPrimitive[];
  formula: string;
  limitations: readonly string[];
  calculate: (values: Readonly<Record<string, number>>) => PolicyScenarioOutcomes;
}

const SOURCES = {
  perry: 'https://www.nber.org/papers/w15471',
  perryEarnings: 'https://opportunityinsights.org/wp-content/uploads/2019/07/Welfare-Appendix.pdf',
  cpi: 'https://www.bls.gov/cpi/tables/supplemental-files/historical-cpi-u-202412.pdf',
  mortality: 'https://www.bmj.com/content/357/bmj.j1550',
  treatmentCost: 'https://nida.nih.gov/sites/default/files/21349-medications-to-treat-opioid-use-disorder_0.pdf',
  housing: 'https://doi.org/10.1111/ecin.70075',
  housingCorrection: 'https://www.aeaweb.org/articles?id=10.1257/mac.20230141',
  trialCosts: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6508852/',
  recovery: 'https://www.england.nhs.uk/2021/03/covid-treatment-developed-in-the-nhs-saves-a-million-lives/',
  rtt: 'https://manual.warondisease.org/knowledge/appendix/state-right-to-trial-impact',
  scenarios: 'https://opg.warondisease.org',
} as const;

function fixed(
  id: string, label: string, unit: string, value: number,
  evidence: PolicyScenarioPrimitive['evidence'], source: string, rationale: string,
): PolicyScenarioPrimitive {
  return { id, label, unit, low: value, mode: value, high: value, evidence, rangeKind: 'fixed', source, rationale };
}

function scenario(
  id: string, label: string, unit: string, low: number, mode: number,
  high: number, source: string, rationale: string,
): PolicyScenarioPrimitive {
  return { id, label, unit, low, mode, high, evidence: 'scenario', rangeKind: 'scenario-range', source, rationale };
}

/** Canonical bounds describe model assumptions even when the point is sourced. */
function canonical(parameter: Parameter): PolicyScenarioPrimitive {
  const value = parameter.value;
  return scenario(
    parameter.parameterName!, parameter.displayName ?? parameter.parameterName!, parameter.unit ?? '',
    parameter.confidenceInterval?.[0] ?? value, value,
    parameter.confidenceInterval?.[1] ?? value,
    parameter.calculationsUrl ?? parameter.manualPageUrl ?? SOURCES.scenarios,
    `${parameter.description} Bounds are inherited model ranges, not asserted to be a published sampling interval.`,
  );
}

const emptyOutcomes = (costUsd: number): PolicyScenarioOutcomes => ({
  costUsd, incomeNpvUsd: null, qalys: null, dalys: null,
  deathsAverted: null, renterSavingsUsd: null, trialParticipants: null,
});

/** Reject missing draws instead of silently substituting a central estimate. */
function value(values: Readonly<Record<string, number>>, id: string): number {
  const result = values[id];
  if (result === undefined || !Number.isFinite(result)) {
    throw new Error(`Missing or non-finite policy scenario input: ${id}`);
  }
  return result;
}

const CPI_2024 = 313.689;
const CPI_2006 = 201.6;
const CPI_2016 = 240.007;
const PRE_K_REFERENCE_COST = 100_000 * 17_759 * CPI_2024 / CPI_2006;
const TREATMENT_REFERENCE_COST = 10_000 * 6_552 * CPI_2024 / CPI_2016;

export const scenarioInputs: readonly PolicyScenarioInput[] = [
  {
    policyId: 'universal-pre-k-ages-3-4',
    policyName: 'Universal Pre-K (Ages 3-4)',
    scope: 'One annual cohort of 100,000 additional children receiving a Perry-like two-year program.',
    referenceCostUsd: PRE_K_REFERENCE_COST,
    annualFundingCapUsd: PRE_K_REFERENCE_COST,
    costBasis: '2024 USD; both cost and earnings converted from 2006 USD using CPI-U. Cost covers the whole preschool program for one entering cohort.',
    priceYear: 2024,
    horizonYears: 62,
    lagYears: 16,
    benefitTiming: 'Earnings observed from ages 19–40 and projected to age 65. The cited amount is already lifetime NPV; the 62-year horizon is descriptive and must not multiply or rediscount the benefit.',
    comparableForAllocation: true,
    parameters: [
      fixed('prek_children', 'Additional children', 'children', 100_000, 'scenario', SOURCES.scenarios,
        'Reference enrollment choice, not the US eligible population. Existing preschool enrollees are not counted as additional beneficiaries.'),
      fixed('perry_cost_2006', 'Perry program cost per child', '2006 USD/child', 17_759, 'empirical', SOURCES.perry,
        'Published total program cost, not an annual cost. The intensive program included home visits; universal provision may differ.'),
      fixed('perry_earnings_npv_2006', 'Participant lifetime earnings gain', '2006 USD/child', 70_535, 'empirical', SOURCES.perryEarnings,
        'Hendren and Sprung-Keyser extrapolate Perry earnings to age 65. This is a modeled lifetime earnings NPV, not a national median or an annual benefit. No sampling interval is supplied here.'),
      fixed('cpi_2024', '2024 annual CPI-U', 'index', CPI_2024, 'empirical', SOURCES.cpi, 'Annual all-items US city average CPI-U.'),
      fixed('cpi_2006', '2006 annual CPI-U', 'index', CPI_2006, 'empirical', SOURCES.cpi, 'Common deflator for program costs and benefits.'),
      scenario('prek_transport', 'Share of Perry earnings effect achieved', 'fraction', 0, 0.5, 1, SOURCES.scenarios,
        'Explicit sensitivity prior: zero to full Perry effect, midpoint one-half. Not estimated from a meta-analysis or elicited from experts. Captures implementation quality and the counterfactual preschool option.'),
    ],
    formula: 'cost = additional children × Perry total cost × CPI2024/CPI2006; earnings NPV = additional children × Perry lifetime earnings NPV × CPI2024/CPI2006 × transport share',
    limitations: [
      'Perry studied disadvantaged children in one 1960s setting. Scaling to universal pre-K requires separate estimates for children with existing childcare and different baseline resources.',
      'The earnings amount is already a present value: do not discount it again or multiply it by the 62-year horizon. No additional crime, fiscal or health benefit is added.',
      'The 0/0.5/1 transport range is an explicit analyst scenario. It is not a published confidence interval, and the model does not estimate national median income or health.',
    ],
    calculate(values) {
      const children = value(values, 'prek_children');
      const inflation = value(values, 'cpi_2024') / value(values, 'cpi_2006');
      return {
        ...emptyOutcomes(children * value(values, 'perry_cost_2006') * inflation),
        incomeNpvUsd: children * value(values, 'perry_earnings_npv_2006') * inflation * value(values, 'prek_transport'),
      };
    },
  },
  {
    policyId: 'shift-drug-policy-from-criminal-to-health-approach',
    policyName: 'Shift Drug Policy from Criminal to Health Approach',
    scope: '10,000 additional person-years retained in methadone treatment; estimates the treatment component of the proposal.',
    referenceCostUsd: TREATMENT_REFERENCE_COST,
    annualFundingCapUsd: TREATMENT_REFERENCE_COST,
    costBasis: '2024 USD; NIDA preliminary 2016 treatment cost converted using CPI-U. Includes medication and support services; excludes separate law-reform costs.',
    priceYear: 2024,
    horizonYears: 1,
    lagYears: 0,
    benefitTiming: 'Deaths averted during one additional retained treatment-year. No post-year survival benefit or repeated annual cohort is implicitly included.',
    comparableForAllocation: true,
    parameters: [
      fixed('additional_treatment_years', 'Additional retained treatment-years', 'person-years', 10_000, 'scenario', SOURCES.scenarios,
        'A service-delivery target, not a claim that decriminalization causes this enrollment. Count time retained, not people who briefly enroll.'),
      fixed('methadone_cost_2016', 'Annual methadone program cost', '2016 USD/person-year', 6_552, 'empirical', SOURCES.treatmentCost,
        'NIDA quotes a preliminary Department of Defense estimate of $126/week including medication, psychosocial and medical support. Local procurement and present capacity can differ.'),
      fixed('cpi_2024', '2024 annual CPI-U', 'index', CPI_2024, 'empirical', SOURCES.cpi, 'Annual all-items US city average CPI-U.'),
      fixed('cpi_2016', '2016 annual CPI-U', 'index', CPI_2016, 'empirical', SOURCES.cpi, 'Deflates the preliminary treatment-cost estimate.'),
      {
        id: 'methadone_deaths_averted_per_1000_years', label: 'Mortality difference during treatment',
        unit: 'deaths/1,000 person-years', low: 14, mode: 25, high: 36,
        evidence: 'empirical', rangeKind: 'published-interval', confidenceLevel: 0.95,
        source: SOURCES.mortality,
        rationale: 'Sordo et al. BMJ 2017 meta-analysis reports an average difference of 25 deaths/1,000 person-years (95% CI 14–36). Cohort evidence, not randomized assignment or the causal effect of a decriminalization law.',
      },
      scenario('treatment_transport', 'Mortality effect retained in the target setting', 'fraction', 0, 0.5, 1, SOURCES.scenarios,
        'Explicit zero/half/full transport sensitivity, not a published interval. Allows for selection bias, a different opioid supply, baseline care and implementation.'),
    ],
    formula: 'cost = added retained person-years × annual treatment cost × CPI2024/CPI2016; deaths averted = added retained person-years × mortality difference/1,000 × transport share',
    limitations: [
      'Decriminalization, treatment expansion and harm reduction are different interventions. This estimate does not attribute the treatment effect to changing the criminal law.',
      'Mortality varies during induction and after cessation. Do not apply a full treatment-year benefit to a short enrollment, or add overdose deaths separately to all-cause mortality.',
      'Deaths averted are not QALYs. An age-specific survival and quality-of-life model is needed before estimating healthy years; enforcement savings and wage effects are not estimated.',
    ],
    calculate(values) {
      const years = value(values, 'additional_treatment_years');
      return {
        ...emptyOutcomes(years * value(values, 'methadone_cost_2016') * value(values, 'cpi_2024') / value(values, 'cpi_2016')),
        deathsAverted: years * value(values, 'methadone_deaths_averted_per_1000_years') / 1_000 * value(values, 'treatment_transport'),
      };
    },
  },
  {
    policyId: 'pragmatic-clinical-trial-funding-reform',
    policyName: 'Pragmatic Clinical Trial Funding Reform',
    scope: 'One research portfolio with the canonical RECOVERY funding scale and a conditional share of its downstream global benefit.',
    referenceCostUsd: RECOVERY_TRIAL_TOTAL_COST.value,
    annualFundingCapUsd: RECOVERY_TRIAL_TOTAL_COST.value,
    costBasis: 'Canonical model USD; source snapshot does not establish a common price year. Research funding excludes downstream treatment delivery costs.',
    priceYear: null,
    horizonYears: null,
    lagYears: null,
    benefitTiming: 'Retrospective global adoption benchmark through the NHS March 2021 estimate, multiplied by lifetime QALYs per death averted. Neither a prospective 20-year forecast nor a discounted QALY present value.',
    overlapGroup: 'clinical-trial-discovery',
    comparableForAllocation: false,
    parameters: [
      canonical(RECOVERY_TRIAL_TOTAL_COST),
      canonical(RECOVERY_TRIAL_GLOBAL_LIVES_SAVED),
      canonical(QALYS_PER_COVID_DEATH_AVERTED),
      canonical(DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT),
      scenario('recovery_transport', 'Share of RECOVERY-like downstream benefit', 'fraction', 0, 0.5, 1, SOURCES.scenarios,
        'Explicit sensitivity scenario, not an empirical expected yield for an unselected research portfolio. Zero allows no adopted effective discovery; one reproduces the historical benchmark model. This aggregate factor includes candidate success, attributable discovery and downstream adoption.'),
    ],
    formula: 'QALYs = canonical RECOVERY global lives saved × QALYs per death averted × transported benefit share; research capacity = trial budget/pragmatic cost per participant (reported separately, never multiplied into QALYs)',
    limitations: [
      'RECOVERY is a successful pandemic platform, not an unbiased draw from all possible trials. The canonical $4/QALY is retrospective discovery value including downstream adoption, not a demonstrated prospective portfolio yield.',
      'The million-lives figure is a modeled global adoption estimate, and QALYs per death is a model assumption. Their inherited ranges are not published confidence intervals.',
      'No finite common cohort horizon or US-only benefit is supplied. A prospective portfolio model needs trial success, attributable acceleration, adoption and delivery costs before comparison with domestic annual programs.',
      'Pragmatic-trial and Right-to-Trial benefits overlap. Evaluate one shared discovery counterfactual; do not sum these standalone outputs.',
    ],
    calculate(values) {
      const cost = value(values, 'RECOVERY_TRIAL_TOTAL_COST');
      return {
        ...emptyOutcomes(cost),
        qalys: value(values, 'RECOVERY_TRIAL_GLOBAL_LIVES_SAVED') * value(values, 'QALYS_PER_COVID_DEATH_AVERTED') * value(values, 'recovery_transport'),
        trialParticipants: cost / value(values, 'DFDA_PRAGMATIC_TRIAL_COST_PER_PATIENT'),
      };
    },
  },
  {
    policyId: 'right-to-trial-and-fda-upgrade-act',
    policyName: 'Right to Trial & FDA Upgrade Act',
    scope: 'Canonical conditional global lifetime schedule shift after all 50 states adopt and a mature shared system operates.',
    referenceCostUsd: STATE_RTT_IMPLEMENTATION_COST_TOTAL.value,
    annualFundingCapUsd: STATE_RTT_IMPLEMENTATION_COST_TOTAL.value,
    costBasis: 'Canonical launch-cost USD: campaign plus first ten registry years. Excludes patient/payer treatment, trial-site and subsequent operating costs.',
    priceYear: null,
    horizonYears: null,
    lagYears: null,
    benefitTiming: 'Undiscounted lifetime schedule-shift total across global future generations, conditional on an operating system. The ten years in the cost numerator cover registry support, not the benefit horizon.',
    overlapGroup: 'clinical-trial-discovery',
    comparableForAllocation: false,
    parameters: [
      canonical(STATE_RTT_IMPLEMENTATION_COST_TOTAL),
      canonical(STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER),
      canonical(RARE_DISEASES_COUNT_GLOBAL),
      fixed('rare_disease_untreated_share', 'Rare diseases without treatment', 'fraction', 0.95, 'scenario', SOURCES.rtt,
        'Canonical queue-model calibration. The rare-disease queue is a proxy for the wider therapeutic frontier, not a measured schedule for curing all diseases.'),
      canonical(NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR),
      fixed('GLOBAL_ANNUAL_DALY_BURDEN', GLOBAL_ANNUAL_DALY_BURDEN.displayName ?? 'Global annual DALY burden', 'DALYs/year', GLOBAL_ANNUAL_DALY_BURDEN.value, 'empirical',
        GLOBAL_ANNUAL_DALY_BURDEN.sourceUrl ?? GLOBAL_ANNUAL_DALY_BURDEN.calculationsUrl!, 'Canonical GBD annual burden. Holding it constant across future generations is a separate model assumption.'),
      canonical(EVENTUALLY_AVOIDABLE_DALY_PCT),
    ],
    formula: 'average wait = rare disease count × untreated share/(2 × annual first treatments); acceleration = average wait × (1 − 1/discovery multiplier); lifetime DALYs = global annual DALYs × eventually avoidable share × acceleration',
    limitations: [
      'This reproduces the canonical state-legislation scenario. It is an analogue for, not a direct estimate of, the broader federal Right to Trial & FDA Upgrade Act.',
      'The 5.48 discovery multiplier is an explicit assumption, not the observed effect of any enacted law; its range is conditional on a mature operating system and does not include the chance of adoption.',
      'The result covers global future generations. It is not annual US QALYs, current-population healthy life expectancy, or median healthy life years.',
      'Launch cost is not total social cost. Do not use it as the full denominator for comparison with treatment programs that include delivery costs.',
      'This and pragmatic-trial reform share discovery, infrastructure, participants and outcomes. Standalone lifetime totals must not be added.',
    ],
    calculate(values) {
      const wait = value(values, 'RARE_DISEASES_COUNT_GLOBAL') * value(values, 'rare_disease_untreated_share')
        / (2 * value(values, 'NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR'));
      const acceleration = wait * (1 - 1 / value(values, 'STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER'));
      return {
        ...emptyOutcomes(value(values, 'STATE_RTT_IMPLEMENTATION_COST_TOTAL')),
        dalys: value(values, 'GLOBAL_ANNUAL_DALY_BURDEN') * value(values, 'EVENTUALLY_AVOIDABLE_DALY_PCT') * acceleration,
      };
    },
  },
  {
    policyId: 'housing-supply-deregulation',
    policyName: 'Housing Supply Deregulation',
    scope: 'One local reform affecting a reference group of 100,000 renter households over ten years.',
    referenceCostUsd: 100_000_000,
    annualFundingCapUsd: 100_000_000,
    costBasis: '2024 USD reference implementation budget, an explicit scenario rather than a sourced estimate of the cost of zoning reform. Private construction is not included.',
    priceYear: 2024,
    horizonYears: 10,
    lagYears: 2,
    benefitTiming: 'Present value of one local renter cohort over years 1–10. Assumed zero benefit in years 1–2; linear ramp reaches the published eight-year endpoint; discounted 3% per year.',
    comparableForAllocation: false,
    parameters: [
      fixed('housing_renter_households', 'Affected renter households', 'households', 100_000, 'scenario', SOURCES.scenarios,
        'Reference local population; replace with jurisdiction-specific renter households. Do not apply a local effect to every US resident.'),
      scenario('housing_implementation_cost', 'Local implementation budget', '2024 USD', 50_000_000, 100_000_000, 200_000_000, SOURCES.scenarios,
        'Explicit planning sensitivity, not observed Auckland expenditure or an empirical cost interval. Does not claim to fund private construction.'),
      fixed('housing_annual_rent', 'Baseline annual household rent', '2024 USD/household/year', 18_000, 'scenario', SOURCES.scenarios,
        'Illustrative $1,500/month local baseline, not a national rental statistic; replace with target-jurisdiction data.'),
      fixed('auckland_rent_reduction', 'Auckland rent effect after eight years', 'fraction', 0.23, 'empirical', SOURCES.housing,
        'Greenaway-McGrevy and So (2026), preferred synthetic control: quality-adjusted rents for new tenancies 23% below no-reform counterfactual in 2024, eight years after the 2016 reform. Point estimate, not a confidence interval.'),
      scenario('housing_transport', 'Share of Auckland effect achieved', 'fraction', 0, 0.5, 1, SOURCES.scenarios,
        'Explicit zero/half/full scenario for comparability, land constraints, construction capacity and adoption; not published transport uncertainty.'),
      fixed('housing_discount_rate', 'Real annual discount rate', 'fraction/year', 0.03, 'scenario', SOURCES.scenarios,
        'Decision-model discount-rate assumption, not a measured outcome.'),
    ],
    formula: 'annual renter savings = households × baseline annual rent × 23% × transport share × ramp; ramp is zero through year 2, linear to full effect at year 8; NPV sums years 1–10 at 3%',
    limitations: [
      'The study concerns a large citywide reform and new-tenancy rents. Smaller spot upzonings and existing leases need not have the same effect.',
      'The two-year delay and linear ramp are scenario assumptions; the eight-year endpoint comes from the study. Adoption may fail and construction may remain constrained.',
      'Renter savings are a distributional household benefit, partly offset by landlord income changes. They are not net economic surplus, wage income, national median income or public-budget savings.',
      'Excluded from aggregate social-benefit allocation: a landlord/tenant incidence model and net resource-cost estimate are required. A renter-benefit objective may evaluate this scenario separately.',
      `The old national GDP claim is not used to calibrate this local effect. Greaney's published correction identifies substantial model and code problems: ${SOURCES.housingCorrection}`,
    ],
    calculate(values) {
      const annual = value(values, 'housing_renter_households') * value(values, 'housing_annual_rent')
        * value(values, 'auckland_rent_reduction') * value(values, 'housing_transport');
      const rate = value(values, 'housing_discount_rate');
      let npv = 0;
      for (let year = 1; year <= 10; year++) {
        const ramp = Math.min(1, Math.max(0, (year - 2) / 6));
        npv += annual * ramp / (1 + rate) ** year;
      }
      return { ...emptyOutcomes(value(values, 'housing_implementation_cost')), renterSavingsUsd: npv };
    },
  },
];

export function policyScenarioCentralValues(input: PolicyScenarioInput): Record<string, number> {
  return Object.fromEntries(input.parameters.map(parameter => [parameter.id, parameter.mode]));
}
