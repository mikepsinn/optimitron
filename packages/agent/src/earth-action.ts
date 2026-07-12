import type { EarthOperatorTask } from './earth-operator.js';
import { assessTaskCapability } from './task-capability.js';
import {
  classifyEarthTaskFamily,
  reviewEarthQueueAndBuildSystemImprovements,
  type EarthQueueAudit,
  type EarthTaskFamily,
} from './earth-prioritization.js';

export type EarthActionKind =
  | 'EXECUTE_DIRECT'
  | 'EXECUTE_VIA_AGENT'
  | 'PREPARE_PROCUREMENT'
  | 'FUNDING_UNBLOCKER'
  | 'QUEUE_REPAIR';

export type EarthProcurementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface EarthActionAgentCapabilities {
  accessTags?: string[] | null;
  availableHoursPerWeek?: number | null;
  credentialTags?: string[] | null;
  interestTags: string[];
  languageTags?: string[] | null;
  skillTags: string[];
  toolTags?: string[] | null;
}

export interface EarthExecutionPolicy {
  allowlistedAutoSpendTypes: string[];
  authenticatedCounterpartiesOnly: boolean;
  availableExternalBudgetUsd: number;
  dailyAutoSpendCapUsd: number;
  defaultExternalLaborRateUsdPerHour: number;
  defaultLawfulSpendTypes: string[];
  perTaskAutoSpendCapUsd: number;
}

export interface EarthTaskExecutionContextV1 {
  allowedExecutionModes: EarthActionKind[];
  canAgentDoDirectly: boolean;
  counterpartyHints: string[];
  estimatedExternalCostUsd: number | null;
  fundingGapUsd: number | null;
  groundingRefs: string[];
  lawfulSpendTypes: string[];
  maxRationalSpendUsd: number | null;
  procurementPriority: EarthProcurementPriority;
}

export interface EarthActionTask extends EarthOperatorTask {
  activeChildTaskCount?: number | null;
  contextJson?: Record<string, unknown> | null;
  selectedImpactFrame?: {
    delayDalysLostPerDayBase?: number | null;
    delayEconomicValueUsdLostPerDayBase?: number | null;
    estimatedCashCostUsdBase?: number | null;
    estimatedEffortHoursBase?: number | null;
    expectedDalysAvertedBase?: number | null;
    expectedEconomicValueUsdBase?: number | null;
  } | null;
  sourceUrl?: string | null;
}

export interface EarthActionOption {
  autoExecutable: boolean;
  eligible: boolean;
  estimatedNetValueUsd: number;
  kind: EarthActionKind;
  reason: string;
  requiredApproval: boolean;
  spendType: string | null;
}

export interface EarthTaskEconomics {
  autoExecutable: boolean;
  availableBudgetUsd: number;
  capabilityFit: number;
  delayEconomicValueUsdLostPerDay: number;
  estimatedExternalCostUsd: number | null;
  estimatedNetValueUsd: number;
  executionV1: EarthTaskExecutionContextV1;
  expectedEconomicValueUsd: number;
  expectedValuePerHourUsd: number;
  fundingGapUsd: number;
  lawfulSpendTypes: string[];
  maxRationalSpendUsd: number | null;
  options: EarthActionOption[];
  requiredApproval: boolean;
  suggestedActionKind: EarthActionKind;
}

export interface EarthQueueRepairPlan {
  candidateTaskKeys: string[];
  summary: string;
}

export interface EarthNextActionDecision {
  actionKind: EarthActionKind;
  audit: EarthQueueAudit;
  autoExecutable: boolean;
  economics: EarthTaskEconomics | null;
  groundingRefs: string[];
  queueRepairPlan?: EarthQueueRepairPlan | null;
  rationale: string[];
  requiredApproval: boolean;
  task: EarthActionTask | null;
}

export const DEFAULT_EARTH_EXECUTION_POLICY: EarthExecutionPolicy = {
  allowlistedAutoSpendTypes: [],
  authenticatedCounterpartiesOnly: true,
  availableExternalBudgetUsd: 0,
  dailyAutoSpendCapUsd: 0,
  defaultExternalLaborRateUsdPerHour: 75,
  defaultLawfulSpendTypes: [
    'LABOR',
    'COMPUTE',
    'ADS',
    'SOFTWARE',
    'SERVICES',
    'OTHER_LAWFUL',
  ],
  perTaskAutoSpendCapUsd: 0,
};

function clampNonNegative(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return 0;
  }

  return Math.max(0, value ?? 0);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeStringArray(values: unknown, fallback: string[] = []) {
  if (!Array.isArray(values)) {
    return [...fallback];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeTags(values: string[] | undefined) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function mergeTags(...groups: Array<string[] | undefined>) {
  return Array.from(
    new Set(
      groups
        .flatMap((group) => group ?? [])
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function jaccardScore(left: string[] | undefined, right: string[] | undefined) {
  const leftSet = new Set(normalizeTags(left));
  const rightSet = new Set(normalizeTags(right));

  if (!leftSet.size && !rightSet.size) {
    return 0.5;
  }

  const union = new Set([...leftSet, ...rightSet]);
  let overlap = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) {
      overlap += 1;
    }
  }

  return union.size === 0 ? 0 : overlap / union.size;
}

function hoursFitScore(taskHours: number | null | undefined, availableHours: number | null | undefined) {
  if (!Number.isFinite(taskHours ?? NaN) || !Number.isFinite(availableHours ?? NaN)) {
    return 0.75;
  }

  const effort = taskHours ?? 0;
  const capacity = Math.max(1, availableHours ?? 0);
  if (effort <= capacity) {
    return 1;
  }

  return Math.max(0.15, 1 - (effort - capacity) / capacity);
}

function readExecutionContext(task: Pick<EarthActionTask, 'contextJson'>) {
  const context = asRecord(task.contextJson);
  const execution = asRecord(context?.['executionV1']);

  if (!execution) {
    return null;
  }

  const procurementPriority =
    typeof execution['procurementPriority'] === 'string'
      ? (execution['procurementPriority'].toUpperCase() as EarthProcurementPriority)
      : null;

  return {
    allowedExecutionModes: normalizeStringArray(execution['allowedExecutionModes']).filter(
      (value): value is EarthActionKind =>
        value === 'EXECUTE_DIRECT' ||
        value === 'EXECUTE_VIA_AGENT' ||
        value === 'PREPARE_PROCUREMENT' ||
        value === 'FUNDING_UNBLOCKER' ||
        value === 'QUEUE_REPAIR',
    ),
    canAgentDoDirectly:
      typeof execution['canAgentDoDirectly'] === 'boolean' ? execution['canAgentDoDirectly'] : null,
    counterpartyHints: normalizeStringArray(execution['counterpartyHints']),
    estimatedExternalCostUsd:
      typeof execution['estimatedExternalCostUsd'] === 'number'
        ? execution['estimatedExternalCostUsd']
        : null,
    fundingGapUsd:
      typeof execution['fundingGapUsd'] === 'number' ? execution['fundingGapUsd'] : null,
    groundingRefs: normalizeStringArray(execution['groundingRefs']),
    lawfulSpendTypes: normalizeStringArray(execution['lawfulSpendTypes']),
    maxRationalSpendUsd:
      typeof execution['maxRationalSpendUsd'] === 'number'
        ? execution['maxRationalSpendUsd']
        : null,
    procurementPriority:
      procurementPriority === 'LOW' ||
      procurementPriority === 'MEDIUM' ||
      procurementPriority === 'HIGH' ||
      procurementPriority === 'URGENT'
        ? procurementPriority
        : null,
  };
}

function defaultGroundingRefs(task: EarthActionTask) {
  const context = asRecord(task.contextJson);
  const refs = [
    task.sourceUrl ?? '',
    task.contactUrl ?? '',
    ...normalizeStringArray(context?.['sourceUrls']),
  ];

  return normalizeStringArray(refs);
}

function defaultCounterpartyHints(task: EarthActionTask, family: EarthTaskFamily) {
  switch (family) {
    case 'growth-conversion':
      return ['growth-operator', 'frontend-engineer', 'copywriter'];
    case 'contact-discovery':
    case 'treaty-support-contact':
      return ['researcher', 'organizer', 'country-operator'];
    case 'treaty-support-endorsement':
      return ['organizer', 'coalition-builder'];
    case 'treaty-support-evidence':
      return ['researcher', 'fact-checker'];
    case 'system-improvement':
      return ['systems-operator', 'typescript-engineer'];
    default:
      return ['generalist-operator'];
  }
}

function defaultLawfulSpendTypes(task: EarthActionTask, family: EarthTaskFamily, policy: EarthExecutionPolicy) {
  const title = task.title.toLowerCase();
  if (family === 'growth-conversion' && (title.includes('traffic') || title.includes('share') || title.includes('distribution'))) {
    return Array.from(new Set([...policy.defaultLawfulSpendTypes, 'ADS']));
  }

  return [...policy.defaultLawfulSpendTypes];
}

function baseExpectedEconomicValueUsd(task: EarthActionTask) {
  const selectedFrameValue = task.selectedImpactFrame?.expectedEconomicValueUsdBase;
  if (Number.isFinite(selectedFrameValue ?? NaN) && (selectedFrameValue ?? 0) > 0) {
    return selectedFrameValue ?? 0;
  }

  const expectedValuePerHourUsd = task.impact?.expectedValuePerHourUsd ?? 0;
  const effort = task.estimatedEffortHours ?? task.selectedImpactFrame?.estimatedEffortHoursBase ?? 1;
  return clampNonNegative(expectedValuePerHourUsd) * Math.max(1, effort);
}

function baseExpectedValuePerHourUsd(task: EarthActionTask) {
  if (Number.isFinite(task.impact?.expectedValuePerHourUsd ?? NaN)) {
    return clampNonNegative(task.impact?.expectedValuePerHourUsd);
  }

  const value = baseExpectedEconomicValueUsd(task);
  const effort = Math.max(1, task.estimatedEffortHours ?? task.selectedImpactFrame?.estimatedEffortHoursBase ?? 1);
  return value / effort;
}

function baseDelayEconomicValueUsdLostPerDay(task: EarthActionTask) {
  if (Number.isFinite(task.impact?.delayEconomicValueUsdLostPerDay ?? NaN)) {
    return clampNonNegative(task.impact?.delayEconomicValueUsdLostPerDay);
  }

  return clampNonNegative(task.selectedImpactFrame?.delayEconomicValueUsdLostPerDayBase);
}

function priorityFromValue(task: EarthActionTask) {
  return Math.max(
    baseExpectedValuePerHourUsd(task),
    baseExpectedEconomicValueUsd(task) / Math.max(1, task.estimatedEffortHours ?? 1),
    baseDelayEconomicValueUsdLostPerDay(task) / 24,
  );
}

function impliedTaskTags(task: EarthActionTask, family: EarthTaskFamily) {
  const taskKey = (task.taskKey ?? '').toLowerCase();
  const title = task.title.toLowerCase();
  const roleTitle = (task.roleTitle ?? '').toLowerCase();

  if (taskKey.includes('publish-budget-brief') || title.includes('budget brief')) {
    return {
      interestTags: ['funding', 'procurement', 'systems', 'growth'],
      skillTags: ['funding', 'research', 'policy', 'copywriting', 'writing'],
    };
  }

  if (taskKey.includes('route-proof-pages-into-funding') || title.includes('proof-page traffic')) {
    return {
      interestTags: ['growth', 'funding', 'conversion', 'distribution'],
      skillTags: ['growth', 'copywriting', 'typescript', 'web-ui', 'conversion-rate-optimization'],
    };
  }

  if (taskKey.includes('source-counterparties-and-price-ceiling') || title.includes('source counterparties')) {
    return {
      interestTags: ['procurement', 'funding', 'research'],
      skillTags: ['procurement', 'research', 'policy', 'negotiation'],
    };
  }

  if (taskKey.includes('prepare-approval-packet') || title.includes('approval packet')) {
    return {
      interestTags: ['funding', 'systems', 'governance'],
      skillTags: ['funding', 'policy', 'research', 'writing'],
    };
  }

  if (taskKey.includes('action-follow-through') || title.includes('funding/procurement')) {
    return {
      interestTags: ['funding', 'procurement', 'systems'],
      skillTags: ['funding', 'policy', 'research', 'systems-design'],
    };
  }

  if (family === 'growth-conversion') {
    return {
      interestTags: ['growth', 'distribution', 'conversion'],
      skillTags: ['growth', 'copywriting', 'web-ui', 'typescript'],
    };
  }

  if (family === 'contact-discovery') {
    return {
      interestTags: ['outreach', 'research', 'journalism'],
      skillTags: ['research', 'organizing', 'journalism', 'contact-discovery'],
    };
  }

  if (family === 'system-improvement' || roleTitle.includes('system operator')) {
    return {
      interestTags: ['systems', 'optimize-earth', 'queue-quality'],
      skillTags: ['typescript', 'systems-design', 'research', 'policy'],
    };
  }

  if (roleTitle.includes('growth operator')) {
    return {
      interestTags: ['growth', 'distribution', 'conversion'],
      skillTags: ['growth', 'copywriting', 'typescript', 'web-ui'],
    };
  }

  if (roleTitle.includes('funding operator')) {
    return {
      interestTags: ['funding', 'procurement'],
      skillTags: ['funding', 'research', 'policy', 'writing'],
    };
  }

  if (roleTitle.includes('procurement operator')) {
    return {
      interestTags: ['procurement', 'funding'],
      skillTags: ['procurement', 'research', 'policy', 'negotiation'],
    };
  }

  if (roleTitle.includes('outreach operator')) {
    return {
      interestTags: ['outreach', 'research'],
      skillTags: ['research', 'organizing', 'journalism'],
    };
  }

  return {
    interestTags: [],
    skillTags: [],
  };
}

function capabilityFit(task: EarthActionTask, agent: EarthActionAgentCapabilities) {
  const assessment = assessTaskCapability({
    executor: {
      accessTags: agent.accessTags,
      credentialTags: agent.credentialTags,
      executorKind: 'agent',
      languageTags: agent.languageTags,
      skillTags: agent.skillTags,
      toolTags: agent.toolTags,
    },
    task,
  });
  if (assessment.status !== 'eligible') {
    return 0;
  }

  const family = classifyEarthTaskFamily(task);
  const implied = impliedTaskTags(task, family);
  const preferredSkills = mergeTags(task.preferredSkillTags, implied.skillTags);
  const relevantInterests = mergeTags(task.interestTags, implied.interestTags);
  const skillFit =
    preferredSkills.length === 0
      ? 1
      : jaccardScore(preferredSkills, agent.skillTags);
  const interestFit =
    relevantInterests.length === 0
      ? 1
      : jaccardScore(relevantInterests, agent.interestTags);
  const effortFit = hoursFitScore(task.estimatedEffortHours ?? null, agent.availableHoursPerWeek ?? null);

  return 0.6 * skillFit + 0.3 * interestFit + 0.1 * effortFit;
}

function isInternalOperatorTask(task: EarthActionTask, family: EarthTaskFamily) {
  if (isActionFollowThroughTask(task)) {
    return true;
  }

  const roleTitle = (task.roleTitle ?? '').toLowerCase();
  if (
    roleTitle.includes('system operator') ||
    roleTitle.includes('growth operator') ||
    roleTitle.includes('funding operator') ||
    roleTitle.includes('procurement operator')
  ) {
    return true;
  }

  return family === 'growth-conversion' || family === 'system-improvement' || family === 'contact-discovery';
}

function deriveCanAgentDoDirectly(
  task: EarthActionTask,
  family: EarthTaskFamily,
  agent: EarthActionAgentCapabilities,
  existing: ReturnType<typeof readExecutionContext>,
) {
  const existingCanAgentDoDirectly = existing?.canAgentDoDirectly;
  if (existingCanAgentDoDirectly !== null && existingCanAgentDoDirectly !== undefined) {
    return existingCanAgentDoDirectly;
  }

  if (task.activeChildTaskCount !== null && task.activeChildTaskCount !== undefined && task.activeChildTaskCount > 0) {
    return false;
  }

  if (family === 'treaty-signer') {
    return false;
  }

  const fit = capabilityFit(task, agent);
  if (fit >= 0.35) {
    return true;
  }

  return isInternalOperatorTask(task, family) && fit >= 0.2;
}

function explicitEstimatedCashCostUsd(
  task: EarthActionTask,
  existing: ReturnType<typeof readExecutionContext>,
) {
  const existingEstimatedExternalCostUsd = existing?.estimatedExternalCostUsd;
  if (
    existingEstimatedExternalCostUsd !== null &&
    existingEstimatedExternalCostUsd !== undefined
  ) {
    return clampNonNegative(existingEstimatedExternalCostUsd);
  }

  if (typeof task.selectedImpactFrame?.estimatedCashCostUsdBase === 'number') {
    return clampNonNegative(task.selectedImpactFrame.estimatedCashCostUsdBase);
  }

  return null;
}

function estimateExternalCostUsd(
  task: EarthActionTask,
  canAgentDoDirectly: boolean,
  existing: ReturnType<typeof readExecutionContext>,
) {
  if (canAgentDoDirectly) {
    return null;
  }

  return explicitEstimatedCashCostUsd(task, existing);
}

function deriveMaxRationalSpendUsd(task: EarthActionTask, existing: ReturnType<typeof readExecutionContext>) {
  const existingMaxRationalSpendUsd = existing?.maxRationalSpendUsd;
  if (existingMaxRationalSpendUsd !== null && existingMaxRationalSpendUsd !== undefined) {
    return clampNonNegative(existingMaxRationalSpendUsd);
  }

  return Math.max(
    baseExpectedEconomicValueUsd(task),
    baseExpectedValuePerHourUsd(task) * Math.max(1, task.estimatedEffortHours ?? 1),
    baseDelayEconomicValueUsdLostPerDay(task) * 7,
  );
}

function deriveProcurementPriority(delayUsdPerDay: number, maxRationalSpendUsd: number | null) {
  const urgencyBasis = Math.max(delayUsdPerDay, maxRationalSpendUsd ?? 0);
  if (urgencyBasis >= 1_000_000_000) {
    return 'URGENT';
  }
  if (urgencyBasis >= 10_000_000) {
    return 'HIGH';
  }
  if (urgencyBasis >= 100_000) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function deriveAllowedExecutionModes(input: {
  canAgentDoDirectly: boolean;
  estimatedExternalCostUsd: number | null;
  existing: ReturnType<typeof readExecutionContext>;
}) {
  if (input.existing?.allowedExecutionModes.length) {
    return input.existing.allowedExecutionModes;
  }

  const modes: EarthActionKind[] = [];
  if (input.canAgentDoDirectly) {
    modes.push('EXECUTE_DIRECT');
  } else {
    modes.push('EXECUTE_VIA_AGENT');
  }

  if ((input.estimatedExternalCostUsd ?? 0) > 0) {
    modes.push('PREPARE_PROCUREMENT', 'FUNDING_UNBLOCKER');
  }

  return Array.from(new Set(modes));
}

function mergeExecutionContext(input: {
  task: EarthActionTask;
  family: EarthTaskFamily;
  agent: EarthActionAgentCapabilities;
  policy: EarthExecutionPolicy;
}) {
  const existing = readExecutionContext(input.task);
  const canAgentDoDirectly = deriveCanAgentDoDirectly(
    input.task,
    input.family,
    input.agent,
    existing,
  );
  const estimatedExternalCostUsd = estimateExternalCostUsd(
    input.task,
    canAgentDoDirectly,
    existing,
  );
  const maxRationalSpendUsd = deriveMaxRationalSpendUsd(input.task, existing);
  const availableBudgetUsd = clampNonNegative(input.policy.availableExternalBudgetUsd);
  const existingFundingGapUsd = existing?.fundingGapUsd;
  const fundingGapUsd =
    existingFundingGapUsd !== null && existingFundingGapUsd !== undefined
      ? clampNonNegative(existingFundingGapUsd)
      : Math.max(0, (estimatedExternalCostUsd ?? 0) - availableBudgetUsd);
  const groundingRefs = normalizeStringArray(existing?.groundingRefs, defaultGroundingRefs(input.task));
  const lawfulSpendTypes = normalizeStringArray(
    existing?.lawfulSpendTypes,
    defaultLawfulSpendTypes(input.task, input.family, input.policy),
  );
  const counterpartyHints = normalizeStringArray(
    existing?.counterpartyHints,
    defaultCounterpartyHints(input.task, input.family),
  );
  const procurementPriority =
    existing?.procurementPriority ??
    deriveProcurementPriority(
      baseDelayEconomicValueUsdLostPerDay(input.task),
      maxRationalSpendUsd,
    );
  const allowedExecutionModes = deriveAllowedExecutionModes({
    canAgentDoDirectly,
    estimatedExternalCostUsd,
    existing,
  });

  return {
    allowedExecutionModes,
    canAgentDoDirectly,
    counterpartyHints,
    estimatedExternalCostUsd,
    fundingGapUsd,
    groundingRefs,
    lawfulSpendTypes,
    maxRationalSpendUsd,
    procurementPriority,
  } satisfies EarthTaskExecutionContextV1;
}

function hasAllowedAutoSpend(spendTypes: string[], policy: EarthExecutionPolicy) {
  const allowlist = new Set(policy.allowlistedAutoSpendTypes.map((value) => value.trim().toUpperCase()).filter(Boolean));
  if (allowlist.size === 0) {
    return false;
  }

  return spendTypes.some((spendType) => allowlist.has(spendType.trim().toUpperCase()));
}

function buildEconomicsOptions(input: {
  executionV1: EarthTaskExecutionContextV1;
  policy: EarthExecutionPolicy;
  task: EarthActionTask;
}) {
  const basePriorityUsd = priorityFromValue(input.task);
  const expectedEconomicValueUsd = baseExpectedEconomicValueUsd(input.task);
  const expectedValuePerHourUsd = baseExpectedValuePerHourUsd(input.task);
  const delayEconomicValueUsdLostPerDay = baseDelayEconomicValueUsdLostPerDay(input.task);
  const spendType = input.executionV1.lawfulSpendTypes[0] ?? null;
  const autoSpendAllowed = hasAllowedAutoSpend(input.executionV1.lawfulSpendTypes, input.policy);
  const withinCaps =
    (input.executionV1.estimatedExternalCostUsd ?? 0) > 0 &&
    autoSpendAllowed &&
    (input.executionV1.estimatedExternalCostUsd ?? 0) <= clampNonNegative(input.policy.perTaskAutoSpendCapUsd) &&
    (input.executionV1.estimatedExternalCostUsd ?? 0) <= clampNonNegative(input.policy.dailyAutoSpendCapUsd) &&
    input.executionV1.fundingGapUsd === 0;

  const directOption: EarthActionOption = {
    autoExecutable: input.executionV1.canAgentDoDirectly,
    eligible: input.executionV1.canAgentDoDirectly,
    estimatedNetValueUsd: basePriorityUsd,
    kind: 'EXECUTE_DIRECT',
    reason: input.executionV1.canAgentDoDirectly
      ? 'The current agent can execute this task directly without paid procurement.'
      : 'Direct execution is not a good fit for the current agent.',
    requiredApproval: false,
    spendType: null,
  };
  const viaAgentOption: EarthActionOption = {
    autoExecutable: !input.executionV1.canAgentDoDirectly && (input.executionV1.estimatedExternalCostUsd ?? 0) === 0,
    eligible: !input.executionV1.canAgentDoDirectly && (input.executionV1.estimatedExternalCostUsd ?? 0) === 0,
    estimatedNetValueUsd: basePriorityUsd * 0.92,
    kind: 'EXECUTE_VIA_AGENT',
    reason:
      (input.executionV1.estimatedExternalCostUsd ?? 0) === 0
        ? 'Another agent should be able to execute this without external cash spend.'
        : 'Agent delegation is dominated by the paid procurement path.',
    requiredApproval: false,
    spendType: null,
  };
  const procurementOption: EarthActionOption = {
    autoExecutable: withinCaps,
    eligible: (input.executionV1.estimatedExternalCostUsd ?? 0) > 0 && input.executionV1.fundingGapUsd === 0,
    estimatedNetValueUsd: basePriorityUsd - clampNonNegative(input.executionV1.estimatedExternalCostUsd),
    kind: 'PREPARE_PROCUREMENT',
    reason:
      (input.executionV1.estimatedExternalCostUsd ?? 0) > 0
        ? 'This task looks rational to buy externally if the provider and price check out.'
        : 'No external procurement path is required.',
    requiredApproval:
      (input.executionV1.estimatedExternalCostUsd ?? 0) > 0 && !withinCaps,
    spendType,
  };
  const fundingGapUsd = input.executionV1.fundingGapUsd ?? 0;
  const fundingOption: EarthActionOption = {
    autoExecutable: false,
    eligible: (input.executionV1.estimatedExternalCostUsd ?? 0) > 0 && fundingGapUsd > 0,
    estimatedNetValueUsd: basePriorityUsd - fundingGapUsd,
    kind: 'FUNDING_UNBLOCKER',
    reason:
      fundingGapUsd > 0
        ? 'The task is worth doing, but available budget is below the estimated external cost.'
        : 'Funding is not the limiting factor for this task.',
    requiredApproval: false,
    spendType,
  };

  const options = [directOption, viaAgentOption, procurementOption, fundingOption];
  const suggestedActionKind =
    options
      .filter((option) => option.eligible)
      .sort((left, right) => right.estimatedNetValueUsd - left.estimatedNetValueUsd)[0]?.kind ??
    'EXECUTE_DIRECT';

  return {
    autoExecutable: options.some((option) => option.eligible && option.autoExecutable),
    delayEconomicValueUsdLostPerDay,
    estimatedNetValueUsd: Math.max(...options.map((option) => option.estimatedNetValueUsd), 0),
    expectedEconomicValueUsd,
    expectedValuePerHourUsd,
    options,
    requiredApproval: options.some((option) => option.eligible && option.requiredApproval),
    suggestedActionKind,
  };
}

export function evaluateEarthTaskEconomics(input: {
  agent: EarthActionAgentCapabilities;
  policy?: Partial<EarthExecutionPolicy>;
  task: EarthActionTask;
}): EarthTaskEconomics {
  const policy: EarthExecutionPolicy = {
    ...DEFAULT_EARTH_EXECUTION_POLICY,
    ...input.policy,
  };
  const family = classifyEarthTaskFamily(input.task);
  const executionV1 = mergeExecutionContext({
    task: input.task,
    family,
    agent: input.agent,
    policy,
  });
  const options = buildEconomicsOptions({
    executionV1,
    policy,
    task: input.task,
  });

  return {
    autoExecutable: options.autoExecutable,
    availableBudgetUsd: clampNonNegative(policy.availableExternalBudgetUsd),
    capabilityFit: capabilityFit(input.task, input.agent),
    delayEconomicValueUsdLostPerDay: options.delayEconomicValueUsdLostPerDay,
    estimatedExternalCostUsd: executionV1.estimatedExternalCostUsd,
    estimatedNetValueUsd: options.estimatedNetValueUsd,
    executionV1,
    expectedEconomicValueUsd: options.expectedEconomicValueUsd,
    expectedValuePerHourUsd: options.expectedValuePerHourUsd,
    fundingGapUsd: executionV1.fundingGapUsd,
    lawfulSpendTypes: executionV1.lawfulSpendTypes,
    maxRationalSpendUsd: executionV1.maxRationalSpendUsd,
    options: options.options,
    requiredApproval: options.requiredApproval,
    suggestedActionKind: options.suggestedActionKind,
  };
}

function isQueueRepairFamily(family: EarthTaskFamily) {
  return (
    family === 'system-improvement' ||
    family === 'growth-conversion' ||
    family === 'contact-discovery'
  );
}

function hasActiveChildren(task: Pick<EarthActionTask, 'activeChildTaskCount'>) {
  return (task.activeChildTaskCount ?? 0) > 0;
}

function normalizeTaskStem(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isActionFollowThroughTask(task: Pick<EarthActionTask, 'taskKey'>) {
  const taskKey = (task.taskKey ?? '').toLowerCase();
  return (
    taskKey.includes('action-follow-through:') ||
    taskKey.includes('publish-budget-brief:') ||
    taskKey.includes('route-proof-pages-into-funding:') ||
    taskKey.includes('source-counterparties-and-price-ceiling:') ||
    taskKey.includes('prepare-approval-packet:')
  );
}

function referencesFundingBlockedTask(input: {
  blockedTaskStems: Set<string>;
  task: Pick<EarthActionTask, 'taskKey' | 'title'>;
}) {
  const taskKey = normalizeTaskStem(input.task.taskKey);
  const title = normalizeTaskStem(input.task.title);

  for (const stem of input.blockedTaskStems) {
    if (taskKey.includes(stem) || title.includes(stem)) {
      return true;
    }
  }

  return false;
}

function isFundingBlockedActionKind(actionKind: EarthActionKind) {
  return actionKind === 'FUNDING_UNBLOCKER' || actionKind === 'PREPARE_PROCUREMENT';
}

function priorityScoreUsd(task: EarthActionTask, economics: EarthTaskEconomics, actionKind: EarthActionKind) {
  let score = Math.max(
    0,
    economics.expectedValuePerHourUsd +
      economics.delayEconomicValueUsdLostPerDay / 24 -
      clampNonNegative(economics.estimatedExternalCostUsd),
  );

  if (actionKind === 'QUEUE_REPAIR') {
    score *= 1.25;
  } else if (actionKind === 'FUNDING_UNBLOCKER') {
    score *= 0.85;
  } else if (actionKind === 'PREPARE_PROCUREMENT') {
    score *= 0.95;
  }

  return score * Math.max(0.35, economics.capabilityFit);
}

export function selectNextEarthAction(input: {
  agent: EarthActionAgentCapabilities;
  policy?: Partial<EarthExecutionPolicy>;
  tasks: EarthActionTask[];
}): EarthNextActionDecision {
  const review = reviewEarthQueueAndBuildSystemImprovements(input.tasks);
  const policy: EarthExecutionPolicy = {
    ...DEFAULT_EARTH_EXECUTION_POLICY,
    ...input.policy,
  };
  const queueNeedsRepair = review.audit.issues.length > 0;
  const rawCandidateTasks = queueNeedsRepair
    ? input.tasks.filter((task) => isQueueRepairFamily(classifyEarthTaskFamily(task)))
    : input.tasks;
  const leafCandidateTasks = rawCandidateTasks.filter((task) => !hasActiveChildren(task));
  const candidateTasks = leafCandidateTasks.length > 0 ? leafCandidateTasks : rawCandidateTasks;
  const evaluatedCandidates = candidateTasks.map((task) => ({
    economics: evaluateEarthTaskEconomics({
      agent: input.agent,
      policy,
      task,
    }),
    task,
  }));
  const fundingBlockedTaskStems = new Set(
    evaluatedCandidates
      .filter(({ economics }) => isFundingBlockedActionKind(economics.suggestedActionKind))
      .map(({ task }) => normalizeTaskStem(task.taskKey ?? task.title))
      .filter(Boolean),
  );
  const followThroughCoveredBlockedTaskStems = new Set(
    Array.from(fundingBlockedTaskStems).filter((blockedStem) =>
      evaluatedCandidates.some(
        ({ task }) =>
          isActionFollowThroughTask(task) &&
          referencesFundingBlockedTask({
            blockedTaskStems: new Set([blockedStem]),
            task,
          }),
      ),
    ),
  );

  if (candidateTasks.length === 0) {
    return {
      actionKind: 'QUEUE_REPAIR',
      audit: review.audit,
      autoExecutable: false,
      economics: null,
      groundingRefs: [],
      queueRepairPlan: {
        candidateTaskKeys: review.proposal.candidates
          .map((candidate) => candidate.taskKey)
          .filter((value): value is string => typeof value === 'string' && value.length > 0),
        summary: review.proposal.review.summary,
      },
      rationale: [
        'The queue audit says the active frontier is not trustworthy.',
        review.proposal.review.summary,
      ],
      requiredApproval: false,
      task: null,
    };
  }

  const rankedCandidates = evaluatedCandidates
    .filter(({ economics, task }) => {
      const taskStem = normalizeTaskStem(task.taskKey ?? task.title);

      return !(
        isFundingBlockedActionKind(economics.suggestedActionKind) &&
        followThroughCoveredBlockedTaskStems.has(taskStem) &&
        !isActionFollowThroughTask(task)
      );
    })
    .map(({ economics, task }) => {
      const actionKind = queueNeedsRepair ? 'QUEUE_REPAIR' : economics.suggestedActionKind;
      const isFollowThrough =
        isActionFollowThroughTask(task) &&
        referencesFundingBlockedTask({
          blockedTaskStems: followThroughCoveredBlockedTaskStems,
          task,
        });
      const baseScore = priorityScoreUsd(task, economics, actionKind);

      return {
        actionKind,
        economics,
        scoreUsd: isFollowThrough ? baseScore * 2.25 : baseScore,
        task,
      };
    })
    .sort((left, right) => right.scoreUsd - left.scoreUsd);

  const winner = rankedCandidates[0];
  if (!winner) {
    return {
      actionKind: 'QUEUE_REPAIR',
      audit: review.audit,
      autoExecutable: false,
      economics: null,
      groundingRefs: [],
      queueRepairPlan: {
        candidateTaskKeys: review.proposal.candidates
          .map((candidate) => candidate.taskKey)
          .filter((value): value is string => typeof value === 'string' && value.length > 0),
        summary: review.proposal.review.summary,
      },
      rationale: [
        'No ranked executable task remained after filtering for queue repair and follow-through coverage.',
        review.proposal.review.summary,
      ],
      requiredApproval: false,
      task: null,
    };
  }
  const rationale = [
    queueNeedsRepair
      ? 'The queue audit is not clean, so queue-repair/system-fix work is being prioritized.'
      : 'The queue audit is clean, so the optimizer is selecting the highest-value executable work.',
    `Expected value per hour: ${winner.economics.expectedValuePerHourUsd.toFixed(2)} USD.`,
    `Delay cost per day: ${winner.economics.delayEconomicValueUsdLostPerDay.toFixed(2)} USD.`,
  ];

  if (winner.economics.estimatedExternalCostUsd !== null) {
    rationale.push(
      `Estimated external cost: ${winner.economics.estimatedExternalCostUsd.toFixed(2)} USD.`,
    );
  }
  if (winner.economics.fundingGapUsd > 0) {
    rationale.push(`Funding gap: ${winner.economics.fundingGapUsd.toFixed(2)} USD.`);
  }

  return {
    actionKind: winner.actionKind,
    audit: review.audit,
    autoExecutable: winner.economics.autoExecutable,
    economics: winner.economics,
    groundingRefs: winner.economics.executionV1.groundingRefs,
    queueRepairPlan: queueNeedsRepair
      ? {
          candidateTaskKeys: review.proposal.candidates
            .map((candidate) => candidate.taskKey)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
          summary: review.proposal.review.summary,
        }
      : null,
    rationale,
    requiredApproval: winner.economics.requiredApproval,
    task: winner.task,
  };
}
