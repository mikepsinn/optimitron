import {
  assessTaskCapability,
  type TaskCapabilityAssessment,
} from './task-capability.js';

export type OptimalActionKind =
  | 'EXECUTE_DIRECT'
  | 'EXECUTE_VIA_AGENT'
  | 'DELEGATE'
  | 'OUTSOURCE'
  | 'FUNDING_UNBLOCKER'
  | 'DE_RISK'
  | 'DECOMPOSE'
  | 'QUEUE_REPAIR'
  | 'KILL';

export type OptimalActorKind =
  | 'USER'
  | 'ORGANIZATION'
  | 'AGENT'
  | 'CONTRACTOR'
  | 'VENDOR'
  | 'ALLY'
  | 'AUTOMATION';

export interface OptimalActorCapabilities {
  accessTags?: string[] | null;
  availableHoursPerWeek?: number | null;
  budgetUsd?: number | null;
  credentialTags?: string[] | null;
  hourlyRateUsd?: number | null;
  interestTags: string[];
  kind?: OptimalActorKind;
  languageTags?: string[] | null;
  organizationId?: string | null;
  organizationTags?: string[] | null;
  runwayDays?: number | null;
  skillTags: string[];
  toolTags?: string[] | null;
}

export type OptimalIncentiveKind = 'WISH_POINT' | 'WISH_TOKEN';

export interface OptimalIncentiveSignal {
  amount: number;
  estimatedUsdValue?: number | null;
  kind: OptimalIncentiveKind;
  note?: string | null;
}

export interface OptimalImpactFrame {
  delayEconomicValueUsdLostPerDayBase?: number | null;
  delayEconomicValueUsdLostPerDayHigh?: number | null;
  delayEconomicValueUsdLostPerDayLow?: number | null;
  estimatedCashCostUsdBase?: number | null;
  estimatedCashCostUsdHigh?: number | null;
  estimatedCashCostUsdLow?: number | null;
  estimatedEffortHoursBase?: number | null;
  estimatedEffortHoursHigh?: number | null;
  estimatedEffortHoursLow?: number | null;
  expectedEconomicValueUsdBase?: number | null;
  expectedEconomicValueUsdHigh?: number | null;
  expectedEconomicValueUsdLow?: number | null;
  successProbabilityBase?: number | null;
  successProbabilityHigh?: number | null;
  successProbabilityLow?: number | null;
  timeToImpactStartDays?: number | null;
}

export interface OptimalActionTaskEdge {
  edgeType?: string | null;
  probabilityDeltaBase?: number | null;
  timeDeltaDaysBase?: number | null;
  toTask?: OptimalActionTask | null;
  toTaskId?: string | null;
}

export interface OptimalActionTask {
  activeChildTaskCount?: number | null;
  activeClaimCount?: number | null;
  blockerStatuses?: string[] | null;
  category?: string | null;
  claimPolicy?: string | null;
  contextJson?: unknown;
  dueAt?: Date | string | null;
  estimatedEffortHours?: number | null;
  executionMode?: string | null;
  id: string;
  impact?: {
    delayEconomicValueUsdLostPerDay?: number | null;
    expectedValuePerHourUsd?: number | null;
  } | null;
  incentiveSignals?: OptimalIncentiveSignal[] | null;
  interestTags?: string[] | null;
  isPublic?: boolean | null;
  maxClaims?: number | null;
  outgoingEdges?: OptimalActionTaskEdge[] | null;
  preferredSkillTags?: string[] | null;
  requiredAccessTags?: string[] | null;
  requiredCredentialTags?: string[] | null;
  requiredLanguageTags?: string[] | null;
  requiredToolTags?: string[] | null;
  selectedImpactFrame?: OptimalImpactFrame | null;
  skillTags?: string[] | null;
  status?: string | null;
  taskKey?: string | null;
  title: string;
  assigneeOrganization?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
  } | null;
}

export interface OptimalObjectivePolicy {
  coordinationCostUsdPerHour?: number;
  defaultExternalLaborRateUsdPerHour?: number;
  dependencyFallbackShare?: number;
  directExecutionFitThreshold?: number;
  externalBudgetUsd?: number;
  highUncertaintyThreshold?: number;
  maxActionBlockMinutes?: number;
  minActionBlockMinutes?: number;
  missingEstimatePenaltyUsd?: number;
  platformRunwayDays?: number | null;
  platformRunwayTargetDays?: number;
  platformSurvivalWeight?: number;
  switchCostHours?: number;
  uncertaintyPenaltyWeight?: number;
  valueOfInformationWeight?: number;
  usdPerEarthOptimizationPoint?: number;
}

export interface OptimalNextActionInput {
  actor: OptimalActorCapabilities;
  now?: Date;
  policy?: OptimalObjectivePolicy;
  tasks: OptimalActionTask[];
}

export interface EvaluateActionOptionInput {
  actionKind: OptimalActionKind;
  actor: OptimalActorCapabilities;
  graph?: OptimalGraphContext;
  now?: Date;
  policy?: OptimalObjectivePolicy;
  task: OptimalActionTask;
}

export interface OptimalGraphContext {
  downstreamBlockerCounts: Map<string, number>;
}

export interface RankedActionOption {
  actionBlockMinutes: number;
  actionKind: OptimalActionKind;
  assumptions: string[];
  autoExecutable: boolean;
  capabilityFit: number;
  cashCostUsd: number;
  computeCostUsd: number;
  coordinationCostUsd: number;
  expectedMarginalUtilityUsd: number;
  explanation: string[];
  normalizedBy: 'USER_HOUR' | 'COORDINATION_HOUR' | 'CASH' | 'QUEUE_HEALTH';
  requiredApproval: boolean;
  riskAdjustedScore: number;
  route: string;
  scarceResourceHours: number;
  sensitivity: string[];
  task: OptimalActionTask | null;
  uncertaintyPenaltyUsd: number;
  valueOfInformationBonusUsd: number;
  whatWouldChangeMyMind: string[];
}

export interface OptimalNextActionDecision {
  action: RankedActionOption | null;
  alternatives: RankedActionOption[];
  assumptions: string[];
  rationale: string[];
  sensitivity: string[];
}

export interface NotionOptimizationRateInput {
  downstreamLiftShare?: number | null;
  downstreamValueUsd?: number | null;
  hours: number;
  probability: number;
  valueUsd: number;
}

const DEFAULT_POLICY: Required<Omit<OptimalObjectivePolicy, 'platformRunwayDays'>> & {
  platformRunwayDays: number | null;
} = {
  coordinationCostUsdPerHour: 75,
  defaultExternalLaborRateUsdPerHour: 75,
  dependencyFallbackShare: 0.2,
  directExecutionFitThreshold: 0.35,
  externalBudgetUsd: 0,
  highUncertaintyThreshold: 0.85,
  maxActionBlockMinutes: 120,
  minActionBlockMinutes: 15,
  missingEstimatePenaltyUsd: 500,
  platformRunwayDays: null,
  platformRunwayTargetDays: 90,
  platformSurvivalWeight: 0.35,
  switchCostHours: 0.1,
  uncertaintyPenaltyWeight: 0.22,
  usdPerEarthOptimizationPoint: 150_000,
  valueOfInformationWeight: 0.18,
};

const RESOLVED_TASK_STATUSES = new Set(['VERIFIED', 'COMPLETED', 'DONE']);
const ACTIVE_TASK_STATUSES = new Set(['ACTIVE', 'IN_PROGRESS']);

function mergePolicy(policy?: OptimalObjectivePolicy) {
  return {
    ...DEFAULT_POLICY,
    ...policy,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampNonNegative(value: number | null | undefined) {
  return Math.max(0, finiteNumber(value) ?? 0);
}

function normalizeTags(tags: string[] | null | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function jaccardScore(left: string[] | null | undefined, right: string[] | null | undefined) {
  const leftSet = new Set(normalizeTags(left));
  const rightSet = new Set(normalizeTags(right));

  if (leftSet.size === 0 && rightSet.size === 0) {
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
  const effort = finiteNumber(taskHours);
  const capacity = finiteNumber(availableHours);

  if (effort === null || capacity === null) {
    return 0.75;
  }

  if (effort <= capacity) {
    return 1;
  }

  return clamp(1 - (effort - capacity) / Math.max(1, capacity), 0.1, 1);
}

function executorKind(actor: OptimalActorCapabilities) {
  return actor.kind === 'AGENT' || actor.kind === 'AUTOMATION' ? 'agent' : 'human';
}

export function assessOptimalActorCapability(
  task: OptimalActionTask,
  actor: OptimalActorCapabilities,
): TaskCapabilityAssessment {
  return assessTaskCapability({
    executor: {
      accessTags: actor.accessTags,
      credentialTags: actor.credentialTags,
      executorKind: executorKind(actor),
      languageTags: actor.languageTags,
      skillTags: [...actor.skillTags, ...(actor.organizationTags ?? [])],
      toolTags: actor.toolTags,
    },
    task,
  });
}

export function scoreActorCapability(task: OptimalActionTask, actor: OptimalActorCapabilities) {
  if (assessOptimalActorCapability(task, actor).status !== 'eligible') {
    return 0;
  }

  const isAssignedOrganization =
    actor.kind === 'ORGANIZATION' &&
    typeof actor.organizationId === 'string' &&
    actor.organizationId.length > 0 &&
    task.assigneeOrganization?.id === actor.organizationId;
  const actorSkillTags = [...actor.skillTags, ...(actor.organizationTags ?? [])];
  const actorInterestTags = [...actor.interestTags, ...(actor.organizationTags ?? [])];
  const taskOrgTags = [
    task.assigneeOrganization?.type ?? '',
    task.assigneeOrganization?.name ?? '',
  ].filter(Boolean);
  const skillScore = task.preferredSkillTags?.length
    ? Math.max(
        jaccardScore(task.preferredSkillTags, actor.skillTags),
        jaccardScore(task.preferredSkillTags, actorSkillTags),
      )
    : 1;
  const relevantInterests = [...(task.interestTags ?? []), ...taskOrgTags];
  const interestScore =
    relevantInterests.length === 0
      ? 1
      : Math.max(
          jaccardScore(task.interestTags, actor.interestTags),
          jaccardScore(relevantInterests, actorInterestTags),
        );
  const effortScore = hoursFitScore(task.estimatedEffortHours, actor.availableHoursPerWeek);

  const baseScore = 0.6 * skillScore + 0.3 * interestScore + 0.1 * effortScore;

  return isAssignedOrganization ? Math.max(0.9, baseScore) : baseScore;
}

function selectedFrame(task: OptimalActionTask) {
  return task.selectedImpactFrame ?? null;
}

function effortHours(task: OptimalActionTask) {
  return Math.max(
    0.25,
    finiteNumber(task.estimatedEffortHours) ??
      finiteNumber(selectedFrame(task)?.estimatedEffortHoursBase) ??
      1,
  );
}

function actionEffortHours(actionKind: OptimalActionKind, task: OptimalActionTask) {
  const fullEffort = effortHours(task);

  switch (actionKind) {
    case 'DE_RISK':
      return clamp(fullEffort * 0.1, 0.25, 2);
    case 'DECOMPOSE':
      return clamp(fullEffort * 0.05, 0.25, 1);
    case 'KILL':
      return 0.25;
    default:
      return fullEffort;
  }
}

function expectedEconomicValueUsd(task: OptimalActionTask) {
  const frameValue = finiteNumber(selectedFrame(task)?.expectedEconomicValueUsdBase);
  if (frameValue !== null) {
    return frameValue;
  }

  const valuePerHour = finiteNumber(task.impact?.expectedValuePerHourUsd);
  if (valuePerHour !== null) {
    return valuePerHour * effortHours(task);
  }

  return 0;
}

function delayEconomicValueUsdLostPerDay(task: OptimalActionTask) {
  return (
    finiteNumber(selectedFrame(task)?.delayEconomicValueUsdLostPerDayBase) ??
    finiteNumber(task.impact?.delayEconomicValueUsdLostPerDay) ??
    0
  );
}

function cashCostUsd(task: OptimalActionTask) {
  return clampNonNegative(selectedFrame(task)?.estimatedCashCostUsdBase);
}

function successProbability(task: OptimalActionTask) {
  const probability = finiteNumber(selectedFrame(task)?.successProbabilityBase);
  return probability === null ? 0.6 : clamp(probability, 0, 1);
}

function isTaskActive(task: OptimalActionTask) {
  if (!task.status) {
    return true;
  }
  return ACTIVE_TASK_STATUSES.has(task.status.toUpperCase());
}

function isTaskBlocked(task: OptimalActionTask) {
  return (task.blockerStatuses ?? []).some(
    (status) => !RESOLVED_TASK_STATUSES.has(status.toUpperCase()),
  );
}

function hasActiveChildTasks(task: OptimalActionTask) {
  return (task.activeChildTaskCount ?? 0) > 0;
}

function readExecutionContext(task: OptimalActionTask) {
  const context = asRecord(task.contextJson);
  const execution = asRecord(context?.['executionV1']);
  if (!execution) {
    return {};
  }
  const allowedExecutionModes = execution['allowedExecutionModes'];

  return {
    allowedExecutionModes: Array.isArray(allowedExecutionModes)
      ? allowedExecutionModes.filter((value): value is string => typeof value === 'string')
      : [],
    canAgentDoDirectly:
      typeof execution['canAgentDoDirectly'] === 'boolean' ? execution['canAgentDoDirectly'] : null,
    computeCostUsd: finiteNumber(execution['computeCostUsd'] as number | null | undefined),
    coordinationHours: finiteNumber(execution['coordinationHours'] as number | null | undefined),
    estimatedExternalCostUsd: finiteNumber(execution['estimatedExternalCostUsd'] as number | null | undefined),
    fundingGapUsd: finiteNumber(execution['fundingGapUsd'] as number | null | undefined),
    routeProbability: finiteNumber(execution['routeProbability'] as number | null | undefined),
  };
}

function relativeUncertainty(task: OptimalActionTask) {
  const frame = selectedFrame(task);
  const base = finiteNumber(frame?.expectedEconomicValueUsdBase);
  const low = finiteNumber(frame?.expectedEconomicValueUsdLow);
  const high = finiteNumber(frame?.expectedEconomicValueUsdHigh);

  if (base === null && finiteNumber(task.impact?.expectedValuePerHourUsd) === null) {
    return 1.5;
  }

  if (base !== null && low !== null && high !== null) {
    return clamp((high - low) / Math.max(1, Math.abs(base)), 0, 5);
  }

  const pLow = finiteNumber(frame?.successProbabilityLow);
  const pHigh = finiteNumber(frame?.successProbabilityHigh);
  const pBase = finiteNumber(frame?.successProbabilityBase);
  if (pLow !== null && pHigh !== null && pBase !== null) {
    return clamp((pHigh - pLow) / Math.max(0.01, Math.abs(pBase)), 0, 5);
  }

  return 0.25;
}

function hasEnoughEstimate(task: OptimalActionTask) {
  return expectedEconomicValueUsd(task) > 0 || delayEconomicValueUsdLostPerDay(task) > 0;
}

function taskSearchText(task: OptimalActionTask) {
  return [
    task.title,
    task.taskKey,
    task.category,
    task.assigneeOrganization?.name,
    task.assigneeOrganization?.type,
    ...(task.skillTags ?? []),
    ...(task.interestTags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function incentiveAdoptionBonusUsd(task: OptimalActionTask, expectedMarginalUtilityUsd: number) {
  const pricedSignals = (task.incentiveSignals ?? [])
    .map((signal) => clampNonNegative(signal.estimatedUsdValue))
    .filter((value) => value > 0);

  if (pricedSignals.length === 0) {
    return 0;
  }

  // Incentives can improve adoption and routing, but they are not the welfare
  // objective. Cap them so Wish Points/tokens cannot swamp real impact.
  const rawValue = pricedSignals.reduce((sum, value) => sum + value, 0);
  return Math.min(rawValue, Math.max(0, expectedMarginalUtilityUsd) * 0.1);
}

function isRevenueOrFundingTask(task: OptimalActionTask) {
  const text = taskSearchText(task);
  return [
    'revenue',
    'funding',
    'fund',
    'grant',
    'donation',
    'deposit',
    'stripe',
    'runway',
    'salary',
    'aum',
    'partnership',
    'sponsor',
  ].some((needle) => text.includes(needle));
}

function platformSurvivalPressure(policy: ReturnType<typeof mergePolicy>) {
  if (policy.platformRunwayDays === null) {
    return 0;
  }

  return clamp(
    (policy.platformRunwayTargetDays - policy.platformRunwayDays) /
      Math.max(1, policy.platformRunwayTargetDays),
    0,
    1,
  );
}

function platformSurvivalValueUsd(
  task: OptimalActionTask,
  expectedMarginalUtilityUsd: number,
  policy: ReturnType<typeof mergePolicy>,
) {
  if (!isRevenueOrFundingTask(task)) {
    return 0;
  }

  return (
    Math.max(0, expectedMarginalUtilityUsd) *
    platformSurvivalPressure(policy) *
    policy.platformSurvivalWeight
  );
}

function getDownstreamTaskId(edge: OptimalActionTaskEdge) {
  return edge.toTask?.id ?? edge.toTaskId ?? null;
}

function buildGraphContext(tasks: OptimalActionTask[]): OptimalGraphContext {
  const downstreamBlockerCounts = new Map<string, number>();

  for (const task of tasks) {
    for (const edge of task.outgoingEdges ?? []) {
      const toTaskId = getDownstreamTaskId(edge);
      if (!toTaskId) continue;
      downstreamBlockerCounts.set(toTaskId, (downstreamBlockerCounts.get(toTaskId) ?? 0) + 1);
    }
  }

  return { downstreamBlockerCounts };
}

function edgeMarginalValueUsd(input: {
  edge: OptimalActionTaskEdge;
  graph: OptimalGraphContext;
  policy: ReturnType<typeof mergePolicy>;
  task: OptimalActionTask;
}) {
  const downstream = input.edge.toTask;
  if (!downstream) {
    return {
      assumptions: [] as string[],
      valueUsd: 0,
    };
  }

  const probabilityDelta = finiteNumber(input.edge.probabilityDeltaBase);
  const timeDeltaDays = finiteNumber(input.edge.timeDeltaDaysBase);
  const downstreamValue = Math.max(0, expectedEconomicValueUsd(downstream));
  const downstreamDelay = Math.max(0, delayEconomicValueUsdLostPerDay(downstream));
  const assumptions: string[] = [];

  let valueUsd = 0;
  if (probabilityDelta !== null && probabilityDelta > 0) {
    valueUsd += downstreamValue * clamp(probabilityDelta, 0, 1);
  }
  if (timeDeltaDays !== null && timeDeltaDays > 0) {
    valueUsd += downstreamDelay * timeDeltaDays;
  }

  if (valueUsd > 0) {
    return { assumptions, valueUsd };
  }

  const downstreamTaskId = getDownstreamTaskId(input.edge);
  const sharedBlockerCount = Math.max(
    1,
    downstreamTaskId === null ? 1 : input.graph.downstreamBlockerCounts.get(downstreamTaskId) ?? 1,
  );

  assumptions.push(
    `Used conservative fallback downstream share ${input.policy.dependencyFallbackShare} split across ${sharedBlockerCount} blocker(s).`,
  );

  return {
    assumptions,
    valueUsd:
      (downstreamValue *
        input.policy.dependencyFallbackShare *
        successProbability(input.task)) /
      sharedBlockerCount,
  };
}

function dependencyMarginalValueUsd(input: {
  graph: OptimalGraphContext;
  policy: ReturnType<typeof mergePolicy>;
  task: OptimalActionTask;
}) {
  const byDownstreamTask = new Map<string, { assumptions: string[]; valueUsd: number }>();
  const assumptions: string[] = [];

  for (const edge of input.task.outgoingEdges ?? []) {
    const toTaskId = getDownstreamTaskId(edge);
    if (!toTaskId) continue;
    const value = edgeMarginalValueUsd({
      edge,
      graph: input.graph,
      policy: input.policy,
      task: input.task,
    });
    const existing = byDownstreamTask.get(toTaskId);
    if (!existing || value.valueUsd > existing.valueUsd) {
      byDownstreamTask.set(toTaskId, value);
    }
  }

  let valueUsd = 0;
  for (const value of byDownstreamTask.values()) {
    valueUsd += value.valueUsd;
    assumptions.push(...value.assumptions);
  }

  return {
    assumptions: Array.from(new Set(assumptions)),
    valueUsd,
  };
}

function delayValueForImmediateActionUsd(task: OptimalActionTask, actionKind: OptimalActionKind = 'EXECUTE_DIRECT') {
  const dailyDelay = Math.max(0, delayEconomicValueUsdLostPerDay(task));
  if (dailyDelay === 0) {
    return 0;
  }

  const actionDays = actionEffortHours(actionKind, task) / 8;
  return dailyDelay * clamp(actionDays, 0.05, 7);
}

function baseMarginalUtility(input: {
  actionKind?: OptimalActionKind;
  graph: OptimalGraphContext;
  policy: ReturnType<typeof mergePolicy>;
  task: OptimalActionTask;
}) {
  const dependency = dependencyMarginalValueUsd(input);
  return {
    assumptions: dependency.assumptions,
    valueUsd:
      Math.max(0, expectedEconomicValueUsd(input.task)) +
      dependency.valueUsd +
      delayValueForImmediateActionUsd(input.task, input.actionKind),
  };
}

function recommendedMinutes(
  actionKind: OptimalActionKind,
  task: OptimalActionTask,
  policy: ReturnType<typeof mergePolicy>,
) {
  return clamp(
    Math.round(actionEffortHours(actionKind, task) * 60),
    policy.minActionBlockMinutes,
    policy.maxActionBlockMinutes,
  );
}

function computeCosts(input: {
  actionKind: OptimalActionKind;
  actor: OptimalActorCapabilities;
  policy: ReturnType<typeof mergePolicy>;
  task: OptimalActionTask;
}) {
  const execution = readExecutionContext(input.task);
  const externalCost = clampNonNegative(execution.estimatedExternalCostUsd);
  const directCashCost = cashCostUsd(input.task);
  const coordinationHours =
    execution.coordinationHours ??
    (input.actionKind === 'OUTSOURCE' || input.actionKind === 'DELEGATE' ? 0.5 : 0);
  const normalizedBy: RankedActionOption['normalizedBy'] =
    input.actionKind === 'OUTSOURCE' || input.actionKind === 'DELEGATE'
      ? 'COORDINATION_HOUR'
      : input.actionKind === 'FUNDING_UNBLOCKER'
        ? 'CASH'
        : input.actionKind === 'QUEUE_REPAIR' || input.actionKind === 'KILL'
          ? 'QUEUE_HEALTH'
          : 'USER_HOUR';

  const cashCost =
    input.actionKind === 'OUTSOURCE' || input.actionKind === 'DELEGATE'
      ? externalCost || directCashCost
      : input.actionKind === 'FUNDING_UNBLOCKER'
        ? Math.max(0, externalCost - input.policy.externalBudgetUsd)
        : directCashCost;

  const computeCost =
    input.actionKind === 'EXECUTE_VIA_AGENT' ? clampNonNegative(execution.computeCostUsd) : 0;
  const coordinationCost = coordinationHours * input.policy.coordinationCostUsdPerHour;
  const switchingCost =
    input.actionKind === 'EXECUTE_DIRECT'
      ? input.policy.switchCostHours * (input.actor.hourlyRateUsd ?? input.policy.coordinationCostUsdPerHour)
      : 0;

  return {
    cashCost,
    computeCost,
    coordinationCost,
    normalizedBy,
    scarceResourceHours:
      normalizedBy === 'USER_HOUR'
        ? actionEffortHours(input.actionKind, input.task)
        : normalizedBy === 'CASH'
          ? Math.max(0.25, cashCost / Math.max(1, input.policy.defaultExternalLaborRateUsdPerHour))
          : Math.max(0.25, coordinationHours),
    switchingCost,
  };
}

function buildSensitivity(input: {
  actionKind: OptimalActionKind;
  task: OptimalActionTask;
  uncertainty: number;
}) {
  const sensitivity: string[] = [];

  if (input.uncertainty >= 0.85) {
    sensitivity.push('Ranking is sensitive to the high/low impact range.');
  }
  if ((input.task.outgoingEdges?.length ?? 0) > 0) {
    sensitivity.push('Ranking is sensitive to dependency-edge probability and time-delta assumptions.');
  }
  if (input.actionKind === 'OUTSOURCE' || input.actionKind === 'DELEGATE') {
    sensitivity.push('Ranking is sensitive to external cost, provider quality, and coordination time.');
  }
  if (isRevenueOrFundingTask(input.task)) {
    sensitivity.push('Ranking is sensitive to platform runway and the probability that revenue arrives soon enough.');
  }

  return sensitivity;
}

function buildChangeMyMind(input: {
  actionKind: OptimalActionKind;
  task: OptimalActionTask;
  uncertainty: number;
}) {
  const changes: string[] = [];

  if (input.uncertainty >= 0.85) {
    changes.push('A tighter low/base/high estimate could move this below a more certain task.');
  }
  if (isTaskBlocked(input.task)) {
    changes.push('A blocker being verified would make direct execution eligible.');
  }
  if (input.actionKind === 'FUNDING_UNBLOCKER') {
    changes.push('More available budget would turn this into an execution/procurement action.');
  }
  if ((input.task.outgoingEdges?.length ?? 0) > 0) {
    changes.push('Better edge metadata could increase or reduce the dependency credit.');
  }
  if (changes.length === 0) {
    changes.push('A materially better EV/hour estimate or lower-risk route on another task would outrank it.');
  }

  return changes;
}

function isActionFeasible(input: {
  actionKind: OptimalActionKind;
  actor: OptimalActorCapabilities;
  capabilityFit: number;
  policy: ReturnType<typeof mergePolicy>;
  task: OptimalActionTask;
}) {
  const execution = readExecutionContext(input.task);
  const active = isTaskActive(input.task);
  const blocked = isTaskBlocked(input.task);
  const activeChildTasks = hasActiveChildTasks(input.task);
  const externalCost = clampNonNegative(execution.estimatedExternalCostUsd);
  const fundingGap = execution.fundingGapUsd ?? Math.max(0, externalCost - input.policy.externalBudgetUsd);

  if (input.actionKind === 'QUEUE_REPAIR' || input.actionKind === 'KILL') {
    return true;
  }
  if (!active) {
    return input.actionKind === 'DECOMPOSE' || input.actionKind === 'DE_RISK';
  }
  if (blocked) {
    return input.actionKind === 'DE_RISK' && relativeUncertainty(input.task) >= input.policy.highUncertaintyThreshold;
  }
  if (activeChildTasks) {
    return input.actionKind === 'DECOMPOSE' || input.actionKind === 'DE_RISK';
  }

  switch (input.actionKind) {
    case 'EXECUTE_DIRECT':
      return input.capabilityFit >= input.policy.directExecutionFitThreshold;
    case 'EXECUTE_VIA_AGENT':
      return (
        input.actor.kind !== 'AGENT' &&
        (execution.canAgentDoDirectly === true ||
          (execution.allowedExecutionModes?.includes('EXECUTE_VIA_AGENT') ?? false))
      );
    case 'DELEGATE':
      return execution.allowedExecutionModes?.includes('DELEGATE') ?? false;
    case 'OUTSOURCE':
      return externalCost > 0 && fundingGap === 0;
    case 'FUNDING_UNBLOCKER':
      return externalCost > 0 && fundingGap > 0;
    case 'DE_RISK':
      return relativeUncertainty(input.task) >= input.policy.highUncertaintyThreshold;
    case 'DECOMPOSE':
      return effortHours(input.task) >= 6 || !hasEnoughEstimate(input.task);
    default:
      return false;
  }
}

export function evaluateActionOption(input: EvaluateActionOptionInput): RankedActionOption {
  const policy = mergePolicy(input.policy);
  const graph = input.graph ?? buildGraphContext([input.task]);
  const capabilityFit = scoreActorCapability(input.task, input.actor);
  const uncertainty = relativeUncertainty(input.task);
  const marginal = baseMarginalUtility({
    actionKind: input.actionKind,
    graph,
    policy,
    task: input.task,
  });
  const costs = computeCosts({
    actionKind: input.actionKind,
    actor: input.actor,
    policy,
    task: input.task,
  });
  const feasible = isActionFeasible({
    actionKind: input.actionKind,
    actor: input.actor,
    capabilityFit,
    policy,
    task: input.task,
  });

  let expectedMarginalUtilityUsd = marginal.valueUsd;
  let valueOfInformationBonusUsd = 0;
  let uncertaintyPenaltyUsd =
    Math.max(0, expectedMarginalUtilityUsd) *
    Math.min(1, uncertainty) *
    policy.uncertaintyPenaltyWeight;

  if (input.actionKind === 'DE_RISK') {
    expectedMarginalUtilityUsd = 0;
    uncertaintyPenaltyUsd = 0;
    valueOfInformationBonusUsd =
      Math.max(0, marginal.valueUsd) *
      Math.min(0.4, uncertainty * policy.valueOfInformationWeight);
  }

  if (input.actionKind === 'DECOMPOSE') {
    expectedMarginalUtilityUsd = Math.max(0, marginal.valueUsd) * 0.08;
    uncertaintyPenaltyUsd = 0;
    valueOfInformationBonusUsd =
      !hasEnoughEstimate(input.task) ? policy.missingEstimatePenaltyUsd : Math.max(0, marginal.valueUsd) * 0.03;
  }

  if (input.actionKind === 'KILL') {
    expectedMarginalUtilityUsd =
      expectedEconomicValueUsd(input.task) <= 0 ? policy.missingEstimatePenaltyUsd : 0;
    uncertaintyPenaltyUsd = 0;
  }

  if (input.actionKind === 'QUEUE_REPAIR') {
    expectedMarginalUtilityUsd = marginal.valueUsd;
    uncertaintyPenaltyUsd = 0;
  }

  const platformSurvivalValue = platformSurvivalValueUsd(
    input.task,
    Math.max(0, marginal.valueUsd),
    policy,
  );
  const incentiveBonus = incentiveAdoptionBonusUsd(input.task, marginal.valueUsd);
  const netValueUsd =
    expectedMarginalUtilityUsd -
    costs.cashCost -
    costs.computeCost -
    costs.coordinationCost -
    costs.switchingCost -
    uncertaintyPenaltyUsd +
    valueOfInformationBonusUsd +
    platformSurvivalValue +
    incentiveBonus;
  const fitMultiplier =
    input.actionKind === 'EXECUTE_DIRECT' ? Math.max(0.25, capabilityFit) : Math.max(0.5, capabilityFit);
  const riskAdjustedScore =
    (netValueUsd / Math.max(0.25, costs.scarceResourceHours)) * fitMultiplier;
  const recommendedBlock = recommendedMinutes(input.actionKind, input.task, policy);
  const assumptions = [
    ...marginal.assumptions,
    'expectedEconomicValueUsdBase is treated as already probability-weighted.',
  ];

  if (!hasEnoughEstimate(input.task)) {
    assumptions.push('Task lacks a usable expected value or delay-cost estimate.');
  }
  if (platformSurvivalValue > 0) {
    assumptions.push('Platform-survival value is active because runway is below target.');
  }
  if (incentiveBonus > 0) {
    assumptions.push('Priced incentive signals are capped at 10% of expected marginal utility.');
  }
  if ((input.task.incentiveSignals ?? []).length > 0) {
    assumptions.push('Wish Points/tokens are treated as incentives, not the canonical welfare unit.');
  }

  const explanation = [
    `${input.actionKind} for "${input.task.title}" scored ${riskAdjustedScore.toFixed(2)} risk-adjusted USD per scarce hour.`,
    `Expected marginal utility: ${expectedMarginalUtilityUsd.toFixed(2)} USD.`,
    `Recommended action block: ${recommendedBlock} minutes.`,
  ];

  if (!feasible) {
    explanation.push('This route is not currently feasible, so it is excluded from ranking.');
  }

  return {
    actionBlockMinutes: recommendedBlock,
    actionKind: input.actionKind,
    assumptions: Array.from(new Set(assumptions)),
    autoExecutable:
      feasible &&
      (input.actionKind === 'EXECUTE_DIRECT' || input.actionKind === 'EXECUTE_VIA_AGENT') &&
      costs.cashCost === 0,
    capabilityFit,
    cashCostUsd: costs.cashCost,
    computeCostUsd: costs.computeCost,
    coordinationCostUsd: costs.coordinationCost,
    expectedMarginalUtilityUsd,
    explanation,
    normalizedBy: costs.normalizedBy,
    requiredApproval: input.actionKind === 'OUTSOURCE' || input.actionKind === 'FUNDING_UNBLOCKER',
    riskAdjustedScore: feasible ? riskAdjustedScore : Number.NEGATIVE_INFINITY,
    route: input.actionKind.toLowerCase().replace(/_/g, '-'),
    scarceResourceHours: costs.scarceResourceHours,
    sensitivity: buildSensitivity({
      actionKind: input.actionKind,
      task: input.task,
      uncertainty,
    }),
    task: input.task,
    uncertaintyPenaltyUsd,
    valueOfInformationBonusUsd,
    whatWouldChangeMyMind: buildChangeMyMind({
      actionKind: input.actionKind,
      task: input.task,
      uncertainty,
    }),
  };
}

export function earthOptimizationPointsFromUsd(
  valueUsd: number,
  usdPerEarthOptimizationPoint = DEFAULT_POLICY.usdPerEarthOptimizationPoint,
) {
  if (!Number.isFinite(valueUsd) || !Number.isFinite(usdPerEarthOptimizationPoint)) {
    return 0;
  }

  return valueUsd / Math.max(1, usdPerEarthOptimizationPoint);
}

export function notionExpectedValuePerHourUsd(input: Pick<NotionOptimizationRateInput, 'hours' | 'probability' | 'valueUsd'>) {
  const hours = Math.max(0.0001, input.hours);
  const probability = clamp(input.probability, 0, 1);

  return (probability * input.valueUsd) / hours;
}

export function notionOptimizationRateUsdPerHour(input: NotionOptimizationRateInput) {
  const hours = Math.max(0.0001, input.hours);
  const probability = clamp(input.probability, 0, 1);
  const downstreamLiftShare = finiteNumber(input.downstreamLiftShare) ?? DEFAULT_POLICY.dependencyFallbackShare;
  const downstreamBoostUsd =
    clampNonNegative(input.downstreamValueUsd) *
    clamp(downstreamLiftShare, 0, 1) *
    probability;

  return notionExpectedValuePerHourUsd(input) + downstreamBoostUsd / hours;
}

function candidateActionKinds(task: OptimalActionTask, policy: ReturnType<typeof mergePolicy>) {
  const execution = readExecutionContext(task);
  const externalCost = clampNonNegative(execution.estimatedExternalCostUsd);
  const kinds = new Set<OptimalActionKind>([
    'EXECUTE_DIRECT',
    'EXECUTE_VIA_AGENT',
    'DE_RISK',
    'DECOMPOSE',
  ]);

  const expectedValue = expectedEconomicValueUsd(task);
  if (expectedValue < 0 || task.status?.toUpperCase() === 'STALE') {
    kinds.add('KILL');
  }

  if (externalCost > 0 || execution.allowedExecutionModes?.includes('OUTSOURCE')) {
    const fundingGap = execution.fundingGapUsd ?? Math.max(0, externalCost - policy.externalBudgetUsd);
    if (fundingGap > 0) {
      kinds.add('FUNDING_UNBLOCKER');
    } else {
      kinds.add('OUTSOURCE');
    }
  }
  if (execution.allowedExecutionModes?.includes('DELEGATE')) {
    kinds.add('DELEGATE');
  }

  return Array.from(kinds);
}

function queueRepairOption(input: {
  actor: OptimalActorCapabilities;
  missingEstimateCount: number;
  policy: ReturnType<typeof mergePolicy>;
  tasks: OptimalActionTask[];
}) {
  if (input.missingEstimateCount === 0) {
    return null;
  }

  const task: OptimalActionTask = {
    id: 'queue-repair',
    title: `Repair ${input.missingEstimateCount} under-specified task estimate(s)`,
    estimatedEffortHours: 1,
    interestTags: ['systems', 'queue-quality'],
    skillTags: ['research', 'systems'],
    status: 'ACTIVE',
    selectedImpactFrame: {
      expectedEconomicValueUsdBase:
        input.policy.missingEstimatePenaltyUsd * Math.max(1, input.missingEstimateCount),
      estimatedEffortHoursBase: 1,
    },
  };

  return evaluateActionOption({
    actionKind: 'QUEUE_REPAIR',
    actor: input.actor,
    graph: buildGraphContext(input.tasks),
    policy: input.policy,
    task,
  });
}

export function rankActionOptions(input: OptimalNextActionInput): RankedActionOption[] {
  const policy = mergePolicy(input.policy);
  const graph = buildGraphContext(input.tasks);
  const options: RankedActionOption[] = [];
  let missingEstimateCount = 0;

  for (const task of input.tasks) {
    if (!hasEnoughEstimate(task)) {
      missingEstimateCount += 1;
    }

    for (const actionKind of candidateActionKinds(task, policy)) {
      const option = evaluateActionOption({
        actionKind,
        actor: input.actor,
        graph,
        now: input.now,
        policy,
        task,
      });

      if (Number.isFinite(option.riskAdjustedScore)) {
        options.push(option);
      }
    }
  }

  const repair = queueRepairOption({
    actor: input.actor,
    missingEstimateCount,
    policy,
    tasks: input.tasks,
  });
  if (repair) {
    options.push(repair);
  }

  return options.sort((left, right) => {
    if (right.riskAdjustedScore !== left.riskAdjustedScore) {
      return right.riskAdjustedScore - left.riskAdjustedScore;
    }
    return right.expectedMarginalUtilityUsd - left.expectedMarginalUtilityUsd;
  });
}

export function selectOptimalNextAction(input: OptimalNextActionInput): OptimalNextActionDecision {
  const ranked = rankActionOptions(input);
  const action = ranked[0] ?? null;
  const alternatives = ranked.slice(1, 4);

  if (!action) {
    return {
      action: null,
      alternatives: [],
      assumptions: ['No feasible action options were found.'],
      rationale: ['The queue needs repair or new actionable tasks.'],
      sensitivity: [],
    };
  }

  return {
    action,
    alternatives,
    assumptions: action.assumptions,
    rationale: [
      'Selected the highest risk-adjusted action option under the current explicit model.',
      ...action.explanation,
      alternatives[0]
        ? `Next-best alternative: ${alternatives[0].actionKind} for "${alternatives[0].task?.title ?? 'queue'}".`
        : 'No close alternative was available.',
    ],
    sensitivity: action.sensitivity,
  };
}

export function buildNotionExpectedValueImpactFrame(input: {
  hours: number;
  probability: number;
  valueUsd: number;
  cashCostUsd?: number | null;
  delayEconomicValueUsdLostPerDay?: number | null;
}): OptimalImpactFrame {
  const probability = clamp(input.probability, 0, 1);
  const expectedValue = probability * input.valueUsd;

  return {
    delayEconomicValueUsdLostPerDayBase: input.delayEconomicValueUsdLostPerDay ?? null,
    estimatedCashCostUsdBase: input.cashCostUsd ?? null,
    estimatedEffortHoursBase: Math.max(0.0001, input.hours),
    expectedEconomicValueUsdBase: expectedValue,
    expectedEconomicValueUsdHigh: expectedValue,
    expectedEconomicValueUsdLow: expectedValue,
    successProbabilityBase: probability,
  };
}
