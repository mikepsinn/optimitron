import { z } from 'zod';
import { createActivityClaimRecord } from './create-activity.js';
import { createAttachmentRecord } from './create-attachment.js';
import { createEvaluationRecord } from './create-evaluation.js';
import { createMeasurementRecord } from './create-measurement.js';
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
  type HypercertActivityClaimRecord,
  type HypercertAttachmentRecord,
  type HypercertEvaluationRecord,
  type HypercertMeasurementRecord,
  type HypercertRightsRecord,
  type MeasurementMetricInput,
} from './types.js';

const AlignmentItemScoreSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1).optional(),
  score: z.number().min(0).max(100),
  citizenPreferredPct: z.number().optional(),
  politicianVotedPct: z.number().optional(),
});

type AlignmentItemScore = z.infer<typeof AlignmentItemScoreSchema>;

export const AlignmentHypercertInputSchema = z.object({
  politicianId: z.string().min(1),
  politicianName: z.string().min(1),
  party: z.string().optional(),
  title: z.string().optional(),
  chamber: z.string().optional(),
  jurisdictionId: z.string().min(1),
  jurisdictionName: z.string().min(1).optional(),
  alignmentScore: z.number().min(0).max(100),
  votesCompared: z.number().int().nonnegative(),
  participantCount: z.number().int().nonnegative().default(0),
  itemScores: z.array(AlignmentItemScoreSchema).default([]),
  contributorDid: z.string().min(1),
  evaluatorDid: z.string().min(1).default('did:plc:wishocracy-aggregate'),
  createdAt: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  rights: RightsInputSchema.optional(),
  sourceUrls: z.array(z.string().min(1)).optional(),
  attachments: z.array(AttachmentInputSchema.omit({ createdAt: true, subjects: true })).optional(),
  storageCid: z.string().optional(),
  methodURI: z.string().optional(),
});

export type AlignmentHypercertInput = z.infer<typeof AlignmentHypercertInputSchema>;

export interface AlignmentHypercertDraft {
  activity: HypercertActivityClaimRecord;
  attachmentDrafts: Array<{ title: string; urls: string[]; contentType?: string; shortDescription?: string }>;
  measurements: MeasurementMetricInput[];
  measurementOptions: {
    subject: AtprotoRecordRef;
    createdAt?: string;
    startDate?: string;
    endDate?: string;
    methodType: string;
    methodURI?: string;
    measurerDid?: string;
    evidenceURI?: string[];
  };
  evaluationInput: z.infer<typeof EvaluationInputSchema>;
  rights?: HypercertRightsRecord;
}

export interface MaterializedAlignmentBundle {
  activity: HypercertActivityClaimRecord;
  attachments: HypercertAttachmentRecord[];
  evaluation: HypercertEvaluationRecord;
  measurements: HypercertMeasurementRecord[];
  rights?: HypercertRightsRecord;
}

export interface PublishedAlignmentBundle extends MaterializedAlignmentBundle {
  refs: {
    activity: AtprotoRecordRef;
    attachments: AtprotoRecordRef[];
    evaluation: AtprotoRecordRef;
    measurements: AtprotoRecordRef[];
    rights?: AtprotoRecordRef;
  };
}

function buildAlignmentShortDescription(input: AlignmentHypercertInput): string {
  const score = input.alignmentScore.toFixed(1);
  const jurisdiction = input.jurisdictionName ?? input.jurisdictionId;
  const role = input.title ?? 'Official';
  return `${role} ${input.politicianName} has ${score}% alignment with citizen preferences in ${jurisdiction}. Based on ${input.votesCompared} vote comparisons from ${input.participantCount} participants.`;
}

function buildAlignmentDescription(input: AlignmentHypercertInput): string {
  const lines: string[] = [];

  if (input.party) {
    lines.push(`Party: ${input.party}`);
  }
  if (input.chamber) {
    lines.push(`Chamber: ${input.chamber}`);
  }

  lines.push(`Citizen Alignment Score: ${input.alignmentScore.toFixed(1)}%`);
  lines.push(`Votes compared: ${input.votesCompared}`);
  lines.push(`Participants: ${input.participantCount}`);

  if (input.itemScores.length > 0) {
    lines.push('');
    lines.push('Category breakdown:');
    for (const cat of input.itemScores) {
      const name = cat.itemName ?? cat.itemId;
      const parts = [`  ${name}: ${cat.score.toFixed(1)}%`];
      if (cat.citizenPreferredPct !== undefined && cat.politicianVotedPct !== undefined) {
        parts.push(`(citizens want ${cat.citizenPreferredPct.toFixed(1)}%, voted ${cat.politicianVotedPct.toFixed(1)}%)`);
      }
      lines.push(parts.join(' '));
    }
  }

  return lines.join('\n');
}

function buildAlignmentMeasurements(input: AlignmentHypercertInput): MeasurementMetricInput[] {
  const metrics: MeasurementMetricInput[] = [
    {
      metric: 'Citizen Alignment Score',
      value: input.alignmentScore,
      unit: 'percent',
      comment: `Weighted average alignment across ${input.votesCompared} vote comparisons`,
    },
    {
      metric: 'Votes Compared',
      value: input.votesCompared,
      unit: 'count',
    },
    {
      metric: 'Participant Count',
      value: input.participantCount,
      unit: 'count',
    },
  ];

  for (const cat of input.itemScores) {
    const name = cat.itemName ?? cat.itemId;
    metrics.push({
      metric: `Category Alignment: ${name}`,
      value: cat.score,
      unit: 'percent',
      comment: cat.citizenPreferredPct !== undefined && cat.politicianVotedPct !== undefined
        ? `Citizens: ${cat.citizenPreferredPct.toFixed(1)}%, Voted: ${cat.politicianVotedPct.toFixed(1)}%`
        : undefined,
    });
  }

  return metrics;
}

function buildEvaluationSummary(input: AlignmentHypercertInput): string {
  const score = input.alignmentScore.toFixed(1);
  const jurisdiction = input.jurisdictionName ?? input.jurisdictionId;
  return [
    `Citizen Alignment Assessment: ${input.politicianName} scores ${score}% alignment with citizen budget preferences in ${jurisdiction}.`,
    `Based on ${input.votesCompared} voting record comparisons against aggregated preferences from ${input.participantCount} participants.`,
  ].join(' ');
}

export function createAlignmentHypercertDraft(
  input: AlignmentHypercertInput,
): AlignmentHypercertDraft {
  const parsed = AlignmentHypercertInputSchema.parse(input);
  const rights = parsed.rights
    ? HypercertRightsRecordSchema.parse({
      $type: 'org.hypercerts.claim.rights' as const,
      rightsName: parsed.rights.rightsName,
      rightsType: parsed.rights.rightsType,
      rightsDescription: parsed.rights.rightsDescription,
      createdAt: parsed.rights.createdAt ?? parsed.createdAt ?? new Date().toISOString(),
    })
    : undefined;

  const pendingRef = {
    uri: `optimitron:pending:alignment:${parsed.politicianId}`,
    cid: 'pending',
  };

  return {
    rights,
    activity: createActivityClaimRecord({
      policyName: `Citizen Alignment: ${parsed.politicianName}`,
      policyDescription: buildAlignmentShortDescription(parsed),
      shortDescription: buildAlignmentShortDescription(parsed),
      description: buildAlignmentDescription(parsed),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      createdAt: parsed.createdAt,
      contributorDid: parsed.contributorDid,
      contributorRole: 'Alignment scoring engine',
      workScope: `Citizen alignment assessment for ${parsed.jurisdictionName ?? parsed.jurisdictionId}`,
      sourceUrls: parsed.sourceUrls,
    }),
    attachmentDrafts: parsed.attachments ?? (parsed.sourceUrls?.length
      ? [{
        title: `${parsed.politicianName} alignment data sources`,
        urls: parsed.sourceUrls,
        contentType: 'evidence',
        shortDescription: 'Voting records and citizen preference data used for alignment scoring.',
      }]
      : []),
    measurements: buildAlignmentMeasurements(parsed),
    measurementOptions: {
      subject: pendingRef,
      createdAt: parsed.createdAt,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      methodType: 'wishocracy-alignment-score',
      methodURI: parsed.methodURI ?? 'https://wishocracy.warondisease.org',
      measurerDid: parsed.contributorDid,
      evidenceURI: parsed.sourceUrls,
    },
    evaluationInput: EvaluationInputSchema.parse({
      subject: pendingRef,
      participantCount: parsed.participantCount,
      citizenPreferenceWeight: parsed.alignmentScore / 100,
      createdAt: parsed.createdAt,
      evaluatorDid: parsed.evaluatorDid,
      summary: buildEvaluationSummary(parsed),
      contentUrls: parsed.sourceUrls,
    }),
  };
}

export function materializeAlignmentBundle(
  draft: AlignmentHypercertDraft,
  activityRef: AtprotoRecordRef,
): MaterializedAlignmentBundle {
  const attachments = draft.attachmentDrafts.map((attachment) =>
    HypercertAttachmentRecordSchema.parse(
      createAttachmentRecord({
        ...attachment,
        createdAt: draft.activity.createdAt,
        subjects: [activityRef],
      }),
    ));

  const baseOptions = PolicyMeasurementInputSchema.omit({ extraMetrics: true }).parse({
    ...draft.measurementOptions,
    subject: activityRef,
  });

  const measurements = draft.measurements.map((metric) =>
    HypercertMeasurementRecordSchema.parse(
      createMeasurementRecord(MeasurementMetricInputSchema.parse(metric), baseOptions),
    ));

  const evaluation = HypercertEvaluationRecordSchema.parse(
    createEvaluationRecord({
      ...draft.evaluationInput,
      subject: activityRef,
      measurementRefs: measurements.map((_measurement, index) => ({
        uri: `pending:measurement:${index}`,
        cid: 'pending',
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

function remapMeasurementRefs(
  evaluation: HypercertEvaluationRecord,
  measurementRefs: AtprotoRecordRef[],
): HypercertEvaluationRecord {
  return HypercertEvaluationRecordSchema.parse({
    ...evaluation,
    measurements: measurementRefs,
  });
}

export async function publishAlignmentHypercertDraft(
  publisher: AtprotoRecordPublisher,
  repo: string,
  draft: AlignmentHypercertDraft,
): Promise<PublishedAlignmentBundle> {
  const rightsRef = draft.rights
    ? await publishRecord(publisher, repo, draft.rights)
    : undefined;

  const activityRecord = rightsRef
    ? HypercertActivityClaimRecordSchema.parse({ ...draft.activity, rights: rightsRef })
    : draft.activity;
  const activityRef = await publishRecord(publisher, repo, activityRecord);

  const materialized = materializeAlignmentBundle(
    { ...draft, activity: activityRecord },
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

  const evaluationRecord = remapMeasurementRefs(materialized.evaluation, measurementRefs);
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
