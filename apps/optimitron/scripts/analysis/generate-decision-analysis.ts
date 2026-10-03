import {
  optimizeWithUncertainty,
  seededRandom,
  sampleTriangular,
  summarizeSimulation,
  evaluateClinicalDiscoveryScenario,
} from "@optimitron/obg";
import type {
  AllocationOption,
  DecisionMetric,
  DecisionParameter,
  DecisionReport,
  PolicyDecisionResult,
} from "@optimitron/obg";
import { scenarioInputs } from "@optimitron/data/datasets/us-policy-scenario-inputs";
import type {
  PolicyScenarioInput,
  PolicyScenarioPrimitive,
} from "@optimitron/data/datasets/us-policy-scenario-inputs";
import {
  FEDERAL_BUDGET_BASELINE,
  MILITARY_FUNDING_SCENARIOS,
  MILITARY_OPPORTUNITY_COST_PRIOR,
  applyBudgetReallocation,
  type PolicyBudgetAccount,
} from "./budget-baseline.js";

const MODEL_SOURCE = "https://opg.warondisease.org";
const TRIAL = "pragmatic-clinical-trial-funding-reform";
const ACCESS = "right-to-trial-and-fda-upgrade-act";
const HOUSING = "housing-supply-deregulation";
/** Inputs whose global lifetime model `clinical()` replaces with a 20-year US flow. */
const US_REMODELED = new Set([TRIAL, ACCESS]);
const GROUP = "clinical-trial-discovery";
const CPI_RATIO = 321.943 / 313.689;
const DRAW_COUNT = 5000;
const SEED = 20260926;
const GRID = 1_000_000;

const assumption = (
  id: string,
  label: string,
  unit: string,
  low: number,
  mode: number,
  high: number,
  rationale: string,
  source = MODEL_SOURCE,
): DecisionParameter => ({
  id,
  label,
  unit,
  low,
  mode,
  high,
  rationale,
  source,
  evidence: "scenario",
  rangeKind: low === high ? "fixed" : "scenario-range",
});

export const decisionAssumptions: DecisionParameter[] = [
  assumption(
    "discount",
    "Real discount rate",
    "fraction/year",
    0.01,
    0.03,
    0.07,
    "Explicit time preference; discounts future clinical benefits and delivery costs once.",
  ),
  assumption(
    "value_daly",
    "Value of a healthy year",
    "2025 USD/DALY",
    50_000,
    100_000,
    150_000,
    "Decision valuation range, not a biological effect or a cash payment. DALYs are valued here using the OBG health-year convention.",
    "https://obg.warondisease.org",
  ),
  assumption(
    "vsl",
    "Value of a statistical life",
    "2025 USD/death averted",
    6_300_000,
    14_200_000,
    20_700_000,
    "DOT central 2025 valuation (https://www.transportation.gov/office-policy/transportation-policy/revised-departmental-guidance-on-valuation-of-a-statistical-life-in-economic-analysis); HHS low/high valuation sensitivity. Valuation uncertainty is distinct from mortality-effect uncertainty.",
    "https://aspe.hhs.gov/sites/default/files/documents/639756a60fbe7e51786bcec176ad52f1/Standard-RIA-Values-2025.pdf",
  ),
  assumption(
    "military_loss",
    "Forgone military benefit",
    "present welfare USD/reallocated USD",
    MILITARY_OPPORTUNITY_COST_PRIOR.low,
    MILITARY_OPPORTUNITY_COST_PRIOR.mode,
    MILITARY_OPPORTUNITY_COST_PRIOR.high,
    "Uncalibrated financing opportunity-cost prior for one budget tranche. All model benefits and losses are present values. Catastrophic security tails are not quantified.",
  ),
  assumption(
    "us_burden_share",
    "US share of global disease burden",
    "fraction",
    0.025,
    0.042375,
    0.07,
    "Population-share anchor 339M/8B with a wide analyst burden-share range; replace with a US GBD disease-age breakdown before deployment.",
  ),
  assumption(
    "clinical_adoption",
    "Clinical benefit realized within 20 years",
    "fraction",
    0,
    0.2,
    0.6,
    "Explicit adoption/delivery scenario. Includes a large attenuation from technical availability to population benefit; not an empirical interval.",
  ),
  assumption(
    "discovery_translation",
    "Capacity-to-discovery translation",
    "fraction",
    -0.03,
    0.1,
    0.3,
    "Only this share of the assumed capacity multiplier changes discovery hazard. Negative draws allow capacity expansion to reduce useful discovery. Analyst sensitivity, not a causal estimate.",
  ),
  assumption(
    "delivery_cost",
    "Added treatment delivery cost",
    "2025 USD/DALY gained",
    0,
    20_000,
    150_000,
    "Subtract downstream patient/payer resource costs before ranking. This broad prior is not a clinical ICER; explicit delivery evidence is still needed.",
  ),
  assumption(
    "pragmatic_baseline",
    "Existing pragmatic research funding",
    "2025 USD",
    250_000_000,
    500_000_000,
    1_000_000_000,
    "OBG paper approximate baseline, with an analyst factor-of-two range. Additional funding changes capacity relative to this baseline.",
    "https://obg.warondisease.org",
  ),
  assumption(
    "baseline_lag",
    "Discovery-to-availability delay",
    "years",
    1,
    3,
    6,
    "Explicit discovery/delivery timing assumption; not a measured FDA review duration.",
  ),
  assumption(
    "cpi_2025_ratio",
    "2024-to-2025 price conversion",
    "ratio",
    CPI_RATIO,
    CPI_RATIO,
    CPI_RATIO,
    "CPI-U 321.943/313.689; applied symmetrically to 2024 program costs and earnings/rent benefits.",
    "https://www.govinfo.gov/content/pkg/ECONI-2026-03/pdf/ECONI-2026-03.pdf",
  ),
];

type Draw = Record<string, number>;
interface Evaluation {
  benefit: number;
  metrics: Record<string, number>;
}
interface ProgramOption extends AllocationOption {
  policyId: string;
  name: string;
  budgetAccount: PolicyBudgetAccount;
  metrics: Record<string, number[]>;
}

function sampleParameter(
  p: DecisionParameter | PolicyScenarioPrimitive,
  random: () => number,
): number {
  // Reconstruct a normal sampling distribution only for the symmetric 95%
  // mortality interval. Model ranges remain explicit triangular priors.
  if (p.rangeKind === "published-interval") {
    const z =
      Math.sqrt(-2 * Math.log(Math.max(Number.MIN_VALUE, random()))) *
      Math.cos(2 * Math.PI * random());
    return p.mode + (z * (p.high - p.low)) / (2 * 1.959963984540054);
  }
  return sampleTriangular(p, random);
}

function createDraws(count: number, seed: number): Draw[] {
  const parameters = new Map<
    string,
    DecisionParameter | PolicyScenarioPrimitive
  >();
  for (const p of [
    ...decisionAssumptions,
    ...scenarioInputs.flatMap((input) => [...input.parameters]),
  ]) {
    const prior = parameters.get(p.id);
    if (
      prior &&
      (prior.low !== p.low || prior.mode !== p.mode || prior.high !== p.high)
    )
      throw new Error(`Inconsistent shared input: ${p.id}`);
    parameters.set(p.id, p);
  }
  const random = seededRandom(seed);
  return Array.from({ length: count }, () =>
    Object.fromEntries(
      [...parameters.values()].map((p) => [p.id, sampleParameter(p, random)]),
    ),
  );
}

/** One research tranche; annual benefits are integrated over twenty years. */
function clinical(
  draw: Draw,
  fundingUsd: number,
  access: boolean,
  noAcceleration = false,
): Evaluation {
  const wait =
    (draw.RARE_DISEASES_COUNT_GLOBAL! * draw.rare_disease_untreated_share!) /
    (2 * draw.NEW_DISEASE_FIRST_TREATMENTS_PER_YEAR!);
  const fundingMultiplier = 1 + fundingUsd / draw.pragmatic_baseline!;
  // Access and funding act on ONE discovery process. A conservative maximum
  // permits whichever bottleneck improvement is stronger, never their sum.
  const translate = (capacity: number) =>
    noAcceleration
      ? 1
      : Math.max(0, 1 + draw.discovery_translation! * (capacity - 1));
  const accessCapacity = access
    ? draw.STATE_RTT_TREATMENT_DISCOVERY_MULTIPLIER!
    : 1;
  const result = evaluateClinicalDiscoveryScenario({
    horizonYears: 20,
    discountRate: draw.discount!,
    annualBurdenDalys: draw.GLOBAL_ANNUAL_DALY_BURDEN! * draw.us_burden_share!,
    avoidableFraction: draw.EVENTUALLY_AVOIDABLE_DALY_PCT!,
    adoptionFraction: draw.clinical_adoption!,
    baselineWaitYears: wait,
    baselineLagYears: draw.baseline_lag!,
    reformLagYears: draw.baseline_lag!,
    discoveryMultiplier: 1,
    discoverySchedule: [
      {
        untilYear: 1,
        multiplier: translate(Math.max(fundingMultiplier, accessCapacity)),
      },
      { untilYear: 10, multiplier: translate(accessCapacity) },
    ],
  });
  const healthValue = result.discountedDalysAverted * draw.value_daly!;
  const delivery =
    Math.max(0, result.discountedDalysAverted) * draw.delivery_cost!;
  return {
    benefit: healthValue - delivery,
    metrics: {
      "US healthy years gained over 20 years": result.dalysAverted,
      "Discounted US healthy years gained": result.discountedDalysAverted,
      "Added treatment delivery cost (present value)": delivery,
    },
  };
}

const POLICY_ACCOUNTS: Readonly<Record<string, PolicyBudgetAccount>> = {
  "universal-pre-k-ages-3-4": "education",
  "shift-drug-policy-from-criminal-to-health-approach": "public_health",
  [HOUSING]: "housing",
  [TRIAL]: "health_research",
  [ACCESS]: "health_research",
};

function accountFor(id: string): PolicyBudgetAccount {
  const account = POLICY_ACCOUNTS[id];
  if (!account) throw new Error(`No federal budget account declared for policy: ${id}`);
  return account;
}

function referenceBudget(input: PolicyScenarioInput): number {
  // Launch cost includes the full canonical high-cost scenario. We do not
  // assume a $65M appropriation buys an implementation that costs $200M.
  const cost =
    input.policyId === ACCESS
      ? input.parameters.find(
          (p) => p.id === "STATE_RTT_IMPLEMENTATION_COST_TOTAL",
        )!.high
      : input.referenceCostUsd * (input.priceYear === 2024 ? CPI_RATIO : 1);
  return Math.ceil(cost / GRID) * GRID;
}

function evaluate(
  input: PolicyScenarioInput,
  draw: Draw,
  fundingUsd: number,
  noAcceleration = false,
): Evaluation {
  if (input.policyId === TRIAL)
    return clinical(draw, fundingUsd, false, noAcceleration);
  if (input.policyId === ACCESS) return clinical(draw, 0, true, noAcceleration);
  const native = input.calculate(draw);
  const price = input.priceYear === 2024 ? CPI_RATIO : 1;
  const coverage = Math.min(1, fundingUsd / (native.costUsd * price));
  const metrics: Record<string, number> = {};
  let benefit = 0;
  if (native.incomeNpvUsd !== null) {
    benefit = native.incomeNpvUsd * price * coverage;
    metrics["Participant lifetime earnings (present value)"] = benefit;
  }
  if (native.deathsAverted !== null) {
    const deaths = native.deathsAverted * coverage;
    metrics["Deaths averted in one treatment year"] = deaths;
    benefit = deaths * draw.vsl!;
  }
  if (native.renterSavingsUsd !== null) {
    benefit = native.renterSavingsUsd * price * coverage;
    metrics["Renter savings over 10 years (present value)"] = benefit;
  }
  return { benefit, metrics };
}

function metricSummaries(metrics: Record<string, number[]>): DecisionMetric[] {
  return Object.entries(metrics).map(([label, values]) => ({
    label,
    unit:
      label.includes("cost") ||
      label.includes("earnings") ||
      label.includes("savings")
        ? "2025 USD present value"
        : label.includes("Deaths")
          ? "deaths"
          : "DALYs averted",
    estimate: summarizeSimulation(values),
  }));
}

function makeOption(
  input: PolicyScenarioInput,
  fundingUsd: number,
  draws: Draw[],
  noAcceleration = false,
): ProgramOption {
  const evaluations = draws.map((draw) =>
    evaluate(input, draw, fundingUsd, noAcceleration),
  );
  const metrics = Object.fromEntries(
    Object.keys(evaluations[0]!.metrics).map((key) => [
      key,
      evaluations.map((e) => e.metrics[key]!),
    ]),
  );
  return {
    id: `${input.policyId}:${fundingUsd}`,
    group: input.overlapGroup ?? input.policyId,
    policyId: input.policyId,
    name: input.policyName,
    annualCostUsd: fundingUsd,
    budgetAccount: accountFor(input.policyId),
    benefitDrawsUsd: evaluations.map((e) => e.benefit),
    metrics,
  };
}

export function generateDecisionAnalysis(
  options: { draws?: number; seed?: number; generatedAt?: string } = {},
): DecisionReport {
  const count = options.draws ?? DRAW_COUNT;
  const seed = options.seed ?? SEED;
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new Error("Simulation draws must be a positive integer");
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error("Simulation seed must be an unsigned 32-bit integer");
  }
  if (options.generatedAt !== undefined && !Number.isFinite(Date.parse(options.generatedAt))) {
    throw new Error("Generation date must be a valid timestamp");
  }
  const draws = createDraws(count, seed);
  const financing = draws.map((draw) => draw.military_loss!);
  const programs: ProgramOption[] = [];
  const policies: PolicyDecisionResult[] = [];
  for (const input of scenarioInputs) {
    const budget = referenceBudget(input);
    const reference = makeOption(input, budget, draws);
    const clinicalPolicy = Boolean(input.overlapGroup);
    const remodeled = US_REMODELED.has(input.policyId);
    // A noncomparable input enters the allocation only after clinical() re-models it.
    const allocationEligible = input.comparableForAllocation || remodeled;
    const sharedInputs = clinicalPolicy
      ? decisionAssumptions.filter(
          (p) => !["vsl", "cpi_2025_ratio"].includes(p.id),
        )
      : decisionAssumptions.filter(
          (p) =>
            p.id === "cpi_2025_ratio" ||
            (allocationEligible && p.id === "military_loss") ||
            (input.policyId ===
              "shift-drug-policy-from-criminal-to-health-approach" &&
              p.id === "vsl"),
        );
    const nativeBenchmarks: Record<string, number[]> = {};
    if (clinicalPolicy) {
      const values = draws.map((draw) => input.calculate(draw));
      if (input.policyId === TRIAL)
        nativeBenchmarks[
          "Conditional RECOVERY-scale global QALYs (separate benchmark)"
        ] = values.map((value) => value.qalys!);
      else
        nativeBenchmarks[
          "Global lifetime DALYs: canonical formula, app scenario priors"
        ] = values.map((value) => value.dalys!);
    }
    policies.push({
      id: input.policyId,
      name: input.policyName,
      referenceCase:
        input.policyId === TRIAL
          ? "One year of extra pragmatic-trial funding; US health benefits followed for 20 years."
          : input.policyId === ACCESS
            ? "Ten years of trial-access infrastructure; conditional US health benefits followed for 20 years."
            : input.scope,
      referenceBudgetUsd: budget,
      annualFundingCapUsd: budget,
      allocationEligible,
      benefit: summarizeSimulation(reference.benefitDrawsUsd),
      netBenefit: !allocationEligible
        ? null
        : summarizeSimulation(
            reference.benefitDrawsUsd.map(
              (value, i) => value - budget * financing[i]!,
            ),
          ),
      benefitCostRatio: !allocationEligible
        ? null
        : summarizeSimulation(
            reference.benefitDrawsUsd.map((value) => value / budget),
          ),
      metrics: [
        ...metricSummaries(reference.metrics),
        ...Object.entries(nativeBenchmarks).map(([label, values]) => ({
          label,
          unit:
            input.policyId === TRIAL ? "global QALYs" : "global lifetime DALYs",
          estimate: summarizeSimulation(values),
        })),
      ],
      assumptions: [
        ...input.parameters.map((p) => ({ ...p })),
        ...sharedInputs,
      ],
      overlapGroup: input.overlapGroup,
      method: clinicalPolicy
        ? "20-year US follow-up: a discovery hazard derived from the canonical average wait, uncertain capacity translation, US burden share, adoption and delivery costs. Funding changes discovery for one year; funded access infrastructure for ten years. Baseline discovery resumes afterwards, while discoveries already made remain available. Both reforms modify one shared process. Original global benchmarks remain separate below."
        : `${input.scope} ${input.formula} ${input.costBasis}`,
      limitations: [
        ...input.limitations,
        // A re-modeled policy reports the native outcome only as a separate benchmark row.
        ...(input.nativeOutcomeLimitations ?? []).map((text) =>
          remodeled ? `Global benchmark only: ${text}` : text,
        ),
        "The funding cap is the evaluated reference-program scale, not an estimate of national absorption capacity. Unmodeled expansion is not implicitly assigned zero benefit.",
        ...(input.policyId === HOUSING
          ? [
              "Gross renter savings are retained but excluded from the net-social-benefit allocation objective because landlord losses and construction costs are not yet estimated.",
            ]
          : []),
        ...(clinicalPolicy
          ? [
              "The clinical allocation case is conditional on implementing the funded program, not a measured effect or a probability of passing the proposed law. Funding affects discovery for its financed period; benefits are followed for 20 years.",
              "The shared-process maximum assumes full overlap between trial funding and access capacity during the first year. Complementarity is not estimated; this assumption can favor access over extra funding.",
              "Canonical clinical source amounts have no verified price year. This adapter treats their quoted dollar amounts as 2025 planning allowances, a scenario valuation assumption.",
            ]
          : []),
      ],
    });
    if (!allocationEligible) continue;
    // A short discrete menu expresses tested program scales without inventing
    // an empirically fitted national diminishing-return curve.
    const levels = input.policyId === ACCESS ? [1] : [0.1, 0.25, 0.5, 0.75, 1];
    const costs = [
      ...new Set(
        levels.map((level) =>
          Math.max(GRID, Math.floor((budget * level) / GRID) * GRID),
        ),
      ),
    ];
    for (const cost of costs) programs.push(makeOption(input, cost, draws));
  }
  const trial = scenarioInputs.find((input) => input.policyId === TRIAL)!;
  const access = scenarioInputs.find((input) => input.policyId === ACCESS)!;
  const jointCost = referenceBudget(trial) + referenceBudget(access);
  const jointEvaluations = draws.map((draw) =>
    clinical(draw, referenceBudget(trial), true),
  );
  programs.push({
    id: "clinical-joint",
    policyId: "clinical-joint",
    name: "Trial funding + Right to Trial / FDA upgrade",
    group: GROUP,
    annualCostUsd: jointCost,
    budgetAccount: "health_research",
    benefitDrawsUsd: jointEvaluations.map((e) => e.benefit),
    metrics: Object.fromEntries(
      Object.keys(jointEvaluations[0]!.metrics).map((key) => [
        key,
        jointEvaluations.map((e) => e.metrics[key]!),
      ]),
    ),
  });
  const scenarios = MILITARY_FUNDING_SCENARIOS.map((scenario) => {
    const allocation = optimizeWithUncertainty(
      programs,
      scenario.maximumReallocationUsd,
      financing,
      GRID,
    );
    const selected = programs.filter((program) =>
      allocation.selectedOptionIds.includes(program.id),
    );
    const ledger = applyBudgetReallocation(
      scenario,
      selected.map((program) => ({
        budgetAccount: program.budgetAccount,
        annualCostUsd: program.annualCostUsd,
      })),
    );
    const metricDraws: Record<string, number[]> = {};
    for (const program of selected)
      for (const [key, values] of Object.entries(program.metrics)) {
        metricDraws[key] ??= Array.from({ length: count }, () => 0);
        values.forEach((value, i) => {
          metricDraws[key]![i]! += value;
        });
      }
    return {
      ...allocation,
      id: scenario.id,
      name: `${scenario.militaryReductionFraction * 100}% maximum military reallocation`,
      fundingFraction: scenario.militaryReductionFraction,
      allocations: selected.map((program) => ({
        policyId: program.policyId,
        name: program.name,
        amountUsd: program.annualCostUsd,
      })),
      metrics: metricSummaries(metricDraws),
      ledger: ledger.lines.map((line) => ({
        id: line.id,
        name: line.name,
        baselineUsd: line.baselineOutlaysUsd,
        proposedUsd: line.annualOutlaysUsd,
      })),
    };
  });
  const preferred = scenarios.reduce((best, scenario) =>
    scenario.netBenefit.mean > best.netBenefit.mean ? scenario : best,
  );
  const sensitivityCases = [
    {
      name: "High military opportunity cost ($10 per dollar)",
      options: programs,
      loss: financing.map(() => 10),
    },
    {
      name: "No clinical discovery or access benefit",
      options: programs.filter((program) => program.group !== GROUP),
      loss: financing,
    },
    {
      name: "Low military opportunity cost ($0.25 per dollar)",
      options: programs,
      loss: financing.map(() => 0.25),
    },
  ];
  return {
    version: 1,
    jurisdiction: "United States",
    fiscalYear: FEDERAL_BUDGET_BASELINE.fiscalYear,
    baselineOutlaysUsd: FEDERAL_BUDGET_BASELINE.totalOutlaysUsd,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    seed,
    draws: count,
    gridUsd: GRID,
    objective:
      "Maximize expected net present social benefit across the explicit reference-scale options, subject to the financing ceiling and protected baseline accounts.",
    valueBasis:
      "2025 USD present values for one appropriation tranche. Mortality is valued with VSL; clinical health with value per DALY, less delivery costs; preschool uses participant earnings NPV. Monetized health is not income. Housing rent transfers are reported separately.",
    recommendedScenarioId: preferred.id,
    policies: policies.sort(
      (a, b) =>
        Number(b.allocationEligible) - Number(a.allocationEligible) ||
        (b.netBenefit?.mean ?? 0) - (a.netBenefit?.mean ?? 0),
    ),
    scenarios,
    sensitivity: sensitivityCases.map((test) => ({
      name: test.name,
      ...optimizeWithUncertainty(
        test.options,
        preferred.budgetCeilingUsd,
        test.loss,
        GRID,
      ),
    })),
    assumptions: decisionAssumptions,
    limitations: [
      ...FEDERAL_BUDGET_BASELINE.limitations,
      "This is a constrained reference-program decision, not a demonstrated globally optimal US budget. Most baseline programs are held fixed because their marginal causal effects and statutory constraints are not calibrated.",
      "The grid optimum is exact within the supplied menu and Monte Carlo expected values. Monte Carlo propagates specified uncertainty; it does not establish causality or account for omitted risks.",
      "Clinical discovery assumptions dominate some results. The zero-clinical-benefit sensitivity shows the recommendation when those effects do not materialize.",
      "Ranges marked scenario are analyst or canonical-model priors, not expert-elicited probabilities or empirical confidence intervals. The reported probability of benefit is conditional on this model.",
      "Distinct input parameters are sampled independently. Shared inputs reuse the same draw across alternatives; other correlations are not estimated.",
      "No sum is labeled median after-tax income or median healthy life expectancy. Those require incidence, taxes, survival and distributional data not present here.",
      "Policy benefit horizons differ and remain explicit: existing lifetime earnings NPV, one treatment year, twenty-year clinical flows, and ten-year renter savings. Annual spending does not imply annual realization of lifetime benefits.",
      "National peer-spending differences are descriptive context. They do not enter this optimization as free savings or causal response curves.",
    ],
  };
}
