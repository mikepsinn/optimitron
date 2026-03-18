import type { OptimitronPolicyHypercertInput, PublishedPolicyHypercertBundle } from '@optimitron/hypercerts';
import type {
  CreateOptimitronPolicyAnalysisInput,
  CreateWishocracyAggregationInput,
} from '@optimitron/storage';
import {
  AgentAnalysisArtifactSchema,
  AgentDiscoveryDecisionSchema,
  AgentInterpretationSchema,
  AgentManifestSchema,
  AgentPlanDecisionSchema,
  AgentRunInputSchema,
  AgentRunLogSchema,
  AgentVerificationDecisionSchema,
  type AgentAnalysisArtifact,
  type AgentAnalysisTarget,
  type AgentInterpretation,
  type AgentManifest,
  type AgentPublishReceipt,
  type AgentRunInput,
  type AgentRunLog,
  type AgentStepLog,
  type AgentTargetExecution,
  type AgentToolCall,
  type AgentVerificationDecision,
  type StructuredReasoner,
  type WishocracySnapshotInput,
} from './types.js';
import {
  assertSufficientData,
  createGuardrailState,
  ensureRuntimeRemaining,
  recordApiCall,
  reserveAnalysisSlot,
} from './guardrails.js';

const DISCOVERY_JSON_SCHEMA = {
  type: 'object',
  required: ['selectedTargets', 'rationale'],
  properties: {
    rationale: { type: 'string' },
    discardedItemIds: { type: 'array', items: { type: 'string' } },
    selectedTargets: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['itemId', 'itemName', 'preferredPct', 'actualPct', 'gapPct', 'availableDataSources', 'rationale'],
        properties: {
          itemId: { type: 'string' },
          itemName: { type: 'string' },
          preferredPct: { type: 'number' },
          actualPct: { type: 'number' },
          gapPct: { type: 'number' },
          gapUsd: { type: 'number' },
          tractabilityScore: { type: 'number' },
          rationale: { type: 'string' },
          availableDataSources: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;

const PLAN_JSON_SCHEMA = {
  type: 'object',
  required: ['plannedTargets', 'rationale', 'executionNotes'],
  properties: {
    rationale: { type: 'string' },
    executionNotes: { type: 'array', items: { type: 'string' } },
    plannedTargets: DISCOVERY_JSON_SCHEMA.properties.selectedTargets,
  },
} as const;

const INTERPRETATION_JSON_SCHEMA = {
  type: 'object',
  required: ['summary', 'confidenceAssessment', 'caveats', 'additionalDataNeeded'],
  properties: {
    summary: { type: 'string' },
    confidenceAssessment: { type: 'string' },
    caveats: { type: 'array', items: { type: 'string' } },
    additionalDataNeeded: { type: 'array', items: { type: 'string' } },
  },
} as const;

const VERIFICATION_JSON_SCHEMA = {
  type: 'object',
  required: ['verdict', 'rationale'],
  properties: {
    verdict: { type: 'string', enum: ['proceed', 'retry', 'abort'] },
    rationale: { type: 'string' },
    retryReason: { type: 'string' },
  },
} as const;

const DEFAULT_EVALUATOR_DID = 'did:plc:wishocracy-aggregate';

export interface AgentExecutionAdapters {
  analysis: {
    execute(target: AgentAnalysisTarget): Promise<AgentAnalysisArtifact>;
  };
  hypercerts: {
    publishPolicy(input: OptimitronPolicyHypercertInput): Promise<PublishedPolicyHypercertBundle>;
  };
  storage?: {
    storeAggregation(input: CreateWishocracyAggregationInput): Promise<{ cid: string }>;
    storePolicyAnalysis(input: CreateOptimitronPolicyAnalysisInput): Promise<{ cid: string }>;
  };
  registries?: {
    recordReputation(input: {
      detailsHash?: string;
      detailsUri?: string;
      score: number;
      target: AgentAnalysisTarget;
    }): Promise<{ txHash?: string }>;
  };
}

export interface RunAgentOptions {
  adapters: AgentExecutionAdapters;
  manifest: AgentManifest;
  now?: () => Date;
  reasoner: StructuredReasoner;
  runInput: AgentRunInput;
}

function nowIso(now: () => Date): string {
  return now().toISOString();
}

function toDidPkh(address: string, chainId = 11155111): string {
  return `did:pkh:eip155:${chainId}:${address.toLowerCase()}`;
}

function summarizeToolCall(call: AgentToolCall): AgentToolCall {
  return call;
}

function createStepLog(step: AgentStepLog['step'], now: () => Date): AgentStepLog {
  const startedAt = nowIso(now);
  return {
    step,
    status: 'completed',
    startedAt,
    completedAt: startedAt,
    toolCalls: [],
  };
}

function finishStep(
  step: AgentStepLog,
  now: () => Date,
  updates: Partial<AgentStepLog>,
): AgentStepLog {
  return {
    ...step,
    ...updates,
    completedAt: nowIso(now),
    toolCalls: (updates.toolCalls ?? step.toolCalls).map(summarizeToolCall),
  };
}

function buildDiscoveryPrompt(input: AgentRunInput, maxTargets: number): string {
  return [
    'Select the most tractable preference gaps for autonomous Optimitron analysis.',
    `Jurisdiction: ${input.jurisdictionName ?? input.jurisdictionId}.`,
    `Choose at most ${maxTargets} targets.`,
    'Prioritize large gaps with feasible public data sources and explain why they are tractable.',
    `Available data sources: ${input.availableDataSources.join(', ') || 'none provided'}.`,
    `Preference gaps JSON: ${JSON.stringify(input.preferenceGaps)}`,
  ].join('\n');
}

function buildPlanPrompt(targets: AgentAnalysisTarget[]): string {
  return [
    'Order these candidate analyses for execution.',
    'Return the targets in the preferred execution order and include concise execution notes.',
    `Targets JSON: ${JSON.stringify(targets)}`,
  ].join('\n');
}

function buildInterpretationPrompt(artifact: AgentAnalysisArtifact): string {
  return [
    'Interpret this Optimitron policy analysis result for publication.',
    'Return a concise plain-language summary, confidence assessment, caveats, and what additional data would strengthen the conclusion.',
    `Analysis JSON: ${JSON.stringify(artifact)}`,
  ].join('\n');
}

function buildVerificationPrompt(
  artifact: AgentAnalysisArtifact,
  interpretation: AgentInterpretation,
): string {
  return [
    'Review this autonomous policy analysis and decide whether to proceed, retry, or abort.',
    'Abort on insufficient data, malformed signals, or untrustworthy evidence. Retry only if another attempt is justified.',
    `Analysis JSON: ${JSON.stringify(artifact)}`,
    `Interpretation JSON: ${JSON.stringify(interpretation)}`,
  ].join('\n');
}

function buildHypercertInput(
  artifact: AgentAnalysisArtifact,
  interpretation: AgentInterpretation,
  manifest: AgentManifest,
): OptimitronPolicyHypercertInput {
  return {
    policyId: artifact.policyId,
    jurisdictionId: artifact.target.itemId,
    policyName: artifact.policyName,
    policyDescription: artifact.policyDescription,
    recommendation: artifact.recommendation,
    analysisSummary: interpretation.summary,
    rationale: [
      interpretation.confidenceAssessment,
      ...interpretation.caveats,
    ].join(' '),
    contributorDid: toDidPkh(manifest.operatorWallet),
    evaluatorDid: DEFAULT_EVALUATOR_DID,
    participantCount: artifact.participantCount,
    evidenceGrade: artifact.evidenceGrade,
    welfareScore: artifact.welfareScore,
    policyImpactScore: artifact.policyImpactScore,
    causalConfidenceScore: artifact.causalConfidenceScore,
    citizenPreferenceWeight: artifact.citizenPreferenceWeight,
    governmentAllocationPct: artifact.governmentAllocationPct,
    preferenceGapPct: artifact.preferenceGapPct,
    sourceUrls: artifact.sourceUrls,
  };
}

function buildPolicyStorageInput(
  input: AgentRunInput,
  artifact: AgentAnalysisArtifact,
  interpretation: AgentInterpretation,
): CreateOptimitronPolicyAnalysisInput {
  return {
    jurisdictionId: input.jurisdictionId,
    policies: [
      {
        id: artifact.policyId,
        name: artifact.policyName,
        grade: artifact.evidenceGrade ?? 'D',
        welfareScore: artifact.welfareScore ?? 0,
        ccs: artifact.causalConfidenceScore,
        pis: artifact.policyImpactScore,
        recommendation: artifact.recommendation,
        rationale: interpretation.summary,
      },
    ],
  };
}

function buildAggregationStorageInput(
  snapshot: WishocracySnapshotInput,
): CreateWishocracyAggregationInput {
  return {
    jurisdictionId: snapshot.jurisdictionId,
    participantCount: snapshot.participantCount,
    consistencyRatio: snapshot.consistencyRatio,
    preferenceWeights: snapshot.preferenceWeights,
    aggregatedComparisonMatrix: snapshot.aggregatedComparisonMatrix,
    convergenceAnalysis: snapshot.convergenceAnalysis,
  };
}

function publishReceiptFromBundle(
  bundle: PublishedPolicyHypercertBundle,
  policyStorageCid?: string,
  aggregationStorageCid?: string,
  reputationTxHash?: string,
): AgentPublishReceipt {
  return {
    activityUri: bundle.refs.activity.uri,
    evaluationUri: bundle.refs.evaluation.uri,
    attachmentUris: bundle.refs.attachments.map((ref) => ref.uri),
    measurementUris: bundle.refs.measurements.map((ref) => ref.uri),
    policyStorageCid,
    aggregationStorageCid,
    reputationTxHash,
  };
}

export async function runAgent(
  options: RunAgentOptions,
): Promise<AgentRunLog> {
  const manifest = AgentManifestSchema.parse(options.manifest);
  const input = AgentRunInputSchema.parse(options.runInput);
  const now = options.now ?? (() => new Date());
  const guardrails = createGuardrailState(
    manifest.computeConstraints,
    new Date(input.startedAt ?? nowIso(now)).getTime(),
  );
  const runId = input.runId ?? `run-${Date.now()}`;
  const steps: AgentStepLog[] = [];
  const targetExecutions: AgentTargetExecution[] = [];
  const failures: string[] = [];
  const activityUris: string[] = [];
  const storageCids: string[] = [];
  const reputationTxHashes: string[] = [];
  let discovery;
  let aggregationStorageCid: string | undefined;

  const maxTargets = Math.min(
    manifest.computeConstraints.maxAnalysesPerRun,
    input.preferenceGaps.length,
  );

  const discoverStep = createStepLog('discover', now);
  try {
    ensureRuntimeRemaining(guardrails, now().getTime());
    recordApiCall(guardrails);
    discovery = await options.reasoner.generateObject({
      schemaName: 'AgentDiscoveryDecision',
      prompt: buildDiscoveryPrompt(input, maxTargets),
      responseJsonSchema: DISCOVERY_JSON_SCHEMA,
      parse: (value) => AgentDiscoveryDecisionSchema.parse(value),
    });
    steps.push(finishStep(discoverStep, now, { reasoning: discovery.rationale }));
  } catch (error) {
    steps.push(finishStep(discoverStep, now, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    throw error;
  }

  const planStep = createStepLog('plan', now);
  ensureRuntimeRemaining(guardrails, now().getTime());
  recordApiCall(guardrails);
  const plan = await options.reasoner.generateObject({
    schemaName: 'AgentPlanDecision',
    prompt: buildPlanPrompt(discovery.selectedTargets),
    responseJsonSchema: PLAN_JSON_SCHEMA,
    parse: (value) => AgentPlanDecisionSchema.parse(value),
  });
  steps.push(finishStep(planStep, now, { reasoning: plan.rationale }));

  const executeStep = createStepLog('execute', now);
  const interpretStep = createStepLog('interpret', now);
  const verifyStep = createStepLog('verify', now);
  const publishStep = createStepLog('publish', now);
  const executeToolCalls: AgentToolCall[] = [];
  const interpretToolCalls: AgentToolCall[] = [];
  const verifyToolCalls: AgentToolCall[] = [];
  const publishToolCalls: AgentToolCall[] = [];

  for (const target of plan.plannedTargets.slice(0, maxTargets)) {
    let attemptCount = 0;
    let finalArtifact: AgentAnalysisArtifact | undefined;
    let finalInterpretation: AgentInterpretation | undefined;
    let finalVerification: AgentVerificationDecision | undefined;
    let finalPublishReceipt: AgentPublishReceipt | undefined;
    let status: AgentTargetExecution['status'] = 'failed';

    while (attemptCount < 2) {
      attemptCount += 1;
      ensureRuntimeRemaining(guardrails, now().getTime());
      reserveAnalysisSlot(guardrails);

      try {
        const artifact = AgentAnalysisArtifactSchema.parse(
          await options.adapters.analysis.execute(target),
        );
        finalArtifact = artifact;
        executeToolCalls.push({
          name: 'analysis.execute',
          status: 'success',
          inputSummary: target.itemName,
          outputSummary: artifact.policyName,
          at: nowIso(now),
        });

        recordApiCall(guardrails);
        const interpretation = await options.reasoner.generateObject({
          schemaName: 'AgentInterpretation',
          prompt: buildInterpretationPrompt(artifact),
          responseJsonSchema: INTERPRETATION_JSON_SCHEMA,
          parse: (value) => AgentInterpretationSchema.parse(value),
        });
        finalInterpretation = interpretation;
        interpretToolCalls.push({
          name: 'gemini.interpret',
          status: 'success',
          inputSummary: artifact.policyName,
          outputSummary: interpretation.summary,
          at: nowIso(now),
        });

        recordApiCall(guardrails);
        const verification = await options.reasoner.generateObject({
          schemaName: 'AgentVerificationDecision',
          prompt: buildVerificationPrompt(artifact, interpretation),
          responseJsonSchema: VERIFICATION_JSON_SCHEMA,
          parse: (value) => AgentVerificationDecisionSchema.parse(value),
        });
        finalVerification = verification;
        verifyToolCalls.push({
          name: 'gemini.verify',
          status: 'success',
          inputSummary: artifact.policyName,
          outputSummary: verification.verdict,
          at: nowIso(now),
        });

        try {
          assertSufficientData(artifact);
        } catch (error) {
          finalVerification = {
            verdict: 'abort',
            rationale: error instanceof Error ? error.message : String(error),
          };
        }

        if (finalVerification.verdict === 'retry' && attemptCount < 2) {
          continue;
        }

        if (finalVerification.verdict !== 'proceed') {
          status = 'aborted';
          failures.push(`${target.itemName}: ${finalVerification.rationale}`);
          break;
        }

        let policyStorageCid: string | undefined;
        if (options.adapters.storage?.storeAggregation && input.wishocracySnapshot && !aggregationStorageCid) {
          recordApiCall(guardrails);
          aggregationStorageCid = (
            await options.adapters.storage.storeAggregation(
              buildAggregationStorageInput(input.wishocracySnapshot),
            )
          ).cid;
          storageCids.push(aggregationStorageCid);
          publishToolCalls.push({
            name: 'storage.storeAggregation',
            status: 'success',
            outputSummary: aggregationStorageCid,
            at: nowIso(now),
          });
        }

        recordApiCall(guardrails);
        const published = await options.adapters.hypercerts.publishPolicy(
          buildHypercertInput(artifact, interpretation, manifest),
        );
        activityUris.push(published.refs.activity.uri);
        publishToolCalls.push({
          name: 'hypercerts.publishPolicy',
          status: 'success',
          inputSummary: artifact.policyName,
          outputSummary: published.refs.activity.uri,
          at: nowIso(now),
        });

        if (options.adapters.storage?.storePolicyAnalysis) {
          recordApiCall(guardrails);
          policyStorageCid = (
            await options.adapters.storage.storePolicyAnalysis(
              buildPolicyStorageInput(input, artifact, interpretation),
            )
          ).cid;
          storageCids.push(policyStorageCid);
          publishToolCalls.push({
            name: 'storage.storePolicyAnalysis',
            status: 'success',
            outputSummary: policyStorageCid,
            at: nowIso(now),
          });
        }

        let reputationTxHash: string | undefined;
        if (options.adapters.registries?.recordReputation) {
          recordApiCall(guardrails);
          const reputationResult = await options.adapters.registries.recordReputation({
            score: artifact.causalConfidenceScore ?? 0,
            target,
          });
          reputationTxHash = reputationResult.txHash;
          if (reputationTxHash) {
            reputationTxHashes.push(reputationTxHash);
          }
          publishToolCalls.push({
            name: 'erc8004.recordReputation',
            status: 'success',
            outputSummary: reputationTxHash,
            at: nowIso(now),
          });
        }

        finalPublishReceipt = publishReceiptFromBundle(
          published,
          policyStorageCid,
          aggregationStorageCid,
          reputationTxHash,
        );
        status = 'completed';
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        executeToolCalls.push({
          name: 'analysis.execute',
          status: 'failed',
          inputSummary: target.itemName,
          error: message,
          at: nowIso(now),
        });
        failures.push(`${target.itemName}: ${message}`);
        status = 'failed';
        break;
      }
    }

    targetExecutions.push({
      target,
      attemptCount,
      analysis: finalArtifact,
      interpretation: finalInterpretation,
      verification: finalVerification,
      publishReceipt: finalPublishReceipt,
      status,
    });
  }

  steps.push(finishStep(executeStep, now, {
    status: executeToolCalls.some((call) => call.status === 'failed') ? 'failed' : 'completed',
    toolCalls: executeToolCalls,
  }));
  steps.push(finishStep(interpretStep, now, {
    status: interpretToolCalls.length ? 'completed' : 'skipped',
    toolCalls: interpretToolCalls,
  }));
  steps.push(finishStep(verifyStep, now, {
    status: verifyToolCalls.length ? 'completed' : 'skipped',
    toolCalls: verifyToolCalls,
  }));
  steps.push(finishStep(publishStep, now, {
    status: publishToolCalls.length ? 'completed' : 'skipped',
    toolCalls: publishToolCalls,
  }));

  const completedCount = targetExecutions.filter((execution) => execution.status === 'completed').length;
  const failedCount = targetExecutions.filter((execution) => execution.status === 'failed').length;
  const status = completedCount === targetExecutions.length
    ? 'completed'
    : completedCount > 0 && failedCount < targetExecutions.length
      ? 'partial'
      : failedCount > 0
        ? 'failed'
        : 'partial';

  return AgentRunLogSchema.parse({
    runId,
    startedAt: input.startedAt ?? nowIso(now),
    completedAt: nowIso(now),
    status,
    manifestName: manifest.name,
    manifestVersion: manifest.version,
    operatorWallet: manifest.operatorWallet,
    erc8004Identity: manifest.erc8004Identity,
    jurisdictionId: input.jurisdictionId,
    discovery,
    plan,
    targetExecutions,
    steps,
    outputs: {
      activityUris,
      storageCids,
      reputationTxHashes,
    },
    failures,
  });
}
