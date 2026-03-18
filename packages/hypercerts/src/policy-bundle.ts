import { z } from 'zod';
import {
  createActivityClaimRecord,
} from './create-activity.js';
import {
  createAttachmentRecord,
} from './create-attachment.js';
import {
  createEvaluationRecord,
} from './create-evaluation.js';
import {
  createPolicyMeasurementRecords,
} from './create-measurement.js';
import {
  createRightsRecord,
} from './create-rights.js';
import { publishRecord, type AtprotoRecordPublisher, type AtprotoRecordRef } from './publish.js';
import {
  AttachmentInputSchema,
  EvaluationInputSchema,
  HypercertActivityClaimRecordSchema,
  HypercertAttachmentRecordSchema,
  HypercertEvaluationRecordSchema,
  HypercertMeasurementRecordSchema,
  HypercertRightsRecordSchema,
  MeasurementMetricInputSchema,
  PolicyMeasurementInputSchema,
  RightsInputSchema,
  type EvaluationInput,
  type HypercertActivityClaimRecord,
  type HypercertAttachmentRecord,
  type HypercertEvaluationRecord,
  type HypercertMeasurementRecord,
  type HypercertRightsRecord,
  type PolicyMeasurementInput,
} from './types.js';

const PolicyHypercertAttachmentDraftSchema = AttachmentInputSchema.omit({
  createdAt: true,
  subjects: true,
});

type PolicyHypercertAttachmentDraft = z.infer<typeof PolicyHypercertAttachmentDraftSchema>;

export const OptimitronPolicyHypercertInputSchema = z.object({
  policyId: z.string().optional(),
  jurisdictionId: z.string().min(1),
  jurisdictionName: z.string().min(1).optional(),
  policyName: z.string().min(1),
  policyDescription: z.string().optional(),
  recommendation: z.string().min(1),
  analysisSummary: z.string().optional(),
  rationale: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  contributorDid: z.string().min(1),
  evaluatorDid: z.string().min(1).default('did:plc:wishocracy-aggregate'),
  contributorWeight: z.string().optional(),
  contributorRole: z.string().optional(),
  workScope: z.string().optional(),
  imageUri: z.string().min(1).optional(),
  rights: RightsInputSchema.optional(),
  sourceUrls: z.array(z.string().min(1)).optional(),
  attachments: z.array(PolicyHypercertAttachmentDraftSchema).optional(),
  participantCount: z.number().int().nonnegative().default(0),
  evidenceGrade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  welfareScore: z.number().optional(),
  policyImpactScore: z.number().optional(),
  causalConfidenceScore: z.number().min(0).max(1).optional(),
  citizenPreferenceWeight: z.number().min(0).max(1).optional(),
  governmentAllocationPct: z.number().optional(),
  preferenceGapPct: z.number().optional(),
  methodType: z.string().optional(),
  methodURI: z.string().optional(),
  evidenceURI: z.array(z.string().min(1)).optional(),
  extraMetrics: z.array(MeasurementMetricInputSchema).optional(),
  evaluationSummary: z.string().optional(),
});

export type OptimitronPolicyHypercertInput = z.infer<typeof OptimitronPolicyHypercertInputSchema>;

export interface PolicyHypercertDraft {
  activity: HypercertActivityClaimRecord;
  attachmentDrafts: PolicyHypercertAttachmentDraft[];
  evaluationInput: EvaluationInput;
  measurementInput: PolicyMeasurementInput;
  rights?: HypercertRightsRecord;
}

export interface MaterializedPolicyHypercertBundle {
  activity: HypercertActivityClaimRecord;
  attachments: HypercertAttachmentRecord[];
  evaluation: HypercertEvaluationRecord;
  measurements: HypercertMeasurementRecord[];
  rights?: HypercertRightsRecord;
}

export interface PublishedPolicyHypercertBundle extends MaterializedPolicyHypercertBundle {
  refs: {
    activity: AtprotoRecordRef;
    attachments: AtprotoRecordRef[];
    evaluation: AtprotoRecordRef;
    measurements: AtprotoRecordRef[];
    rights?: AtprotoRecordRef;
  };
}

function buildDefaultAttachmentDrafts(
  input: OptimitronPolicyHypercertInput,
): PolicyHypercertAttachmentDraft[] {
  if (input.attachments?.length) {
    return input.attachments;
  }

  if (!input.sourceUrls?.length) {
    return [];
  }

  return [
    {
      title: `${input.policyName} source analysis`,
      urls: input.sourceUrls,
      contentType: 'evidence',
      shortDescription: 'Source analyses, reports, and reproducibility references.',
    },
  ];
}

function buildEvaluationSummary(input: OptimitronPolicyHypercertInput): string | undefined {
  if (input.evaluationSummary) {
    return input.evaluationSummary;
  }

  const lines = [
    input.analysisSummary,
    input.rationale,
    `Recommendation: ${input.recommendation}.`,
  ].filter(Boolean);

  return lines.length ? lines.join(' ') : undefined;
}

export function createPolicyHypercertDraft(
  input: OptimitronPolicyHypercertInput,
): PolicyHypercertDraft {
  const parsed = OptimitronPolicyHypercertInputSchema.parse(input);
  const rights = parsed.rights ? createRightsRecord(parsed.rights) : undefined;

  return {
    rights,
    activity: createActivityClaimRecord({
      policyName: parsed.policyName,
      policyDescription: parsed.policyDescription,
      evidenceGrade: parsed.evidenceGrade,
      welfareScore: parsed.welfareScore,
      analysisSummary: parsed.analysisSummary,
      description: parsed.rationale,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      createdAt: parsed.createdAt,
      contributorDid: parsed.contributorDid,
      contributorWeight: parsed.contributorWeight,
      contributorRole: parsed.contributorRole,
      workScope: parsed.workScope ?? `Policy analysis for ${parsed.jurisdictionName ?? parsed.jurisdictionId}`,
      imageUri: parsed.imageUri,
      sourceUrls: parsed.sourceUrls,
    }),
    attachmentDrafts: buildDefaultAttachmentDrafts(parsed),
    measurementInput: PolicyMeasurementInputSchema.parse({
      subject: {
        uri: `optimitron:pending:${parsed.policyId ?? parsed.policyName}`,
        cid: 'pending',
      },
      createdAt: parsed.createdAt,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      methodType: parsed.methodType ?? 'optimitron-policy-analysis',
      methodURI: parsed.methodURI,
      measurerDid: parsed.contributorDid,
      evidenceURI: parsed.evidenceURI ?? parsed.sourceUrls,
      welfareScore: parsed.welfareScore,
      policyImpactScore: parsed.policyImpactScore,
      causalConfidenceScore: parsed.causalConfidenceScore,
      evidenceGrade: parsed.evidenceGrade,
      citizenPreferenceWeight: parsed.citizenPreferenceWeight,
      governmentAllocationPct: parsed.governmentAllocationPct,
      preferenceGapPct: parsed.preferenceGapPct,
      extraMetrics: parsed.extraMetrics,
    }),
    evaluationInput: EvaluationInputSchema.parse({
      subject: {
        uri: `optimitron:pending:${parsed.policyId ?? parsed.policyName}`,
        cid: 'pending',
      },
      participantCount: parsed.participantCount,
      citizenPreferenceWeight: parsed.citizenPreferenceWeight ?? 0,
      governmentAllocationPct: parsed.governmentAllocationPct,
      preferenceGapPct: parsed.preferenceGapPct,
      createdAt: parsed.createdAt,
      evaluatorDid: parsed.evaluatorDid,
      summary: buildEvaluationSummary(parsed),
      contentUrls: parsed.sourceUrls,
    }),
  };
}

export function materializePolicyHypercertBundle(
  draft: PolicyHypercertDraft,
  activityRef: AtprotoRecordRef,
): MaterializedPolicyHypercertBundle {
  const attachments = draft.attachmentDrafts.map((attachment) =>
    HypercertAttachmentRecordSchema.parse(
      createAttachmentRecord({
        ...attachment,
        createdAt: draft.activity.createdAt,
        subjects: [activityRef],
      }),
    ));

  const measurements = createPolicyMeasurementRecords({
    ...draft.measurementInput,
    subject: activityRef,
  }).map((record) => HypercertMeasurementRecordSchema.parse(record));

  const evaluation = HypercertEvaluationRecordSchema.parse(
    createEvaluationRecord({
      ...draft.evaluationInput,
      subject: activityRef,
      measurementRefs: measurements.map((measurement, index) => ({
        uri: `pending:measurement:${index}`,
        cid: measurement.$type,
      })),
    }),
  );

  return {
    rights: draft.rights ? HypercertRightsRecordSchema.parse(draft.rights) : undefined,
    activity: HypercertActivityClaimRecordSchema.parse(draft.activity),
    attachments,
    measurements,
    evaluation,
  };
}

function remapEvaluationMeasurements(
  evaluation: HypercertEvaluationRecord,
  measurementRefs: AtprotoRecordRef[],
): HypercertEvaluationRecord {
  return HypercertEvaluationRecordSchema.parse({
    ...evaluation,
    measurements: measurementRefs,
  });
}

export async function publishPolicyHypercertDraft(
  publisher: AtprotoRecordPublisher,
  repo: string,
  draft: PolicyHypercertDraft,
): Promise<PublishedPolicyHypercertBundle> {
  const rightsRef = draft.rights
    ? await publishRecord(publisher, repo, draft.rights)
    : undefined;

  const activityRecord = rightsRef
    ? HypercertActivityClaimRecordSchema.parse({
      ...draft.activity,
      rights: rightsRef,
    })
    : draft.activity;
  const activityRef = await publishRecord(publisher, repo, activityRecord);
  const materialized = materializePolicyHypercertBundle(
    {
      ...draft,
      activity: activityRecord,
    },
    activityRef,
  );

  const attachmentRefs: AtprotoRecordRef[] = [];
  for (const attachment of materialized.attachments) {
    attachmentRefs.push(await publishRecord(publisher, repo, attachment));
  }

  const measurementRefs: AtprotoRecordRef[] = [];
  for (const measurement of materialized.measurements) {
    measurementRefs.push(await publishRecord(publisher, repo, measurement));
  }

  const evaluationRecord = remapEvaluationMeasurements(
    materialized.evaluation,
    measurementRefs,
  );
  const evaluationRef = await publishRecord(publisher, repo, evaluationRecord);

  return {
    ...materialized,
    evaluation: evaluationRecord,
    refs: {
      rights: rightsRef,
      activity: activityRef,
      attachments: attachmentRefs,
      measurements: measurementRefs,
      evaluation: evaluationRef,
    },
  };
}

export function createPolicyHypercertDrafts(
  inputs: OptimitronPolicyHypercertInput[],
): PolicyHypercertDraft[] {
  return inputs.map((input) => createPolicyHypercertDraft(input));
}
