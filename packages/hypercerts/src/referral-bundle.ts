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

export const ReferralHypercertInputSchema = z.object({
  referrerId: z.string().min(1),
  referrerName: z.string().min(1),
  referendumId: z.string().min(1),
  referendumTitle: z.string().min(1),
  verifiedVotesRecruited: z.number().int().nonnegative(),
  totalReferrals: z.number().int().nonnegative(),
  campaignProgressPct: z.number().min(0).max(100).optional(),
  voteTokenTxHashes: z.array(z.string().min(1)).optional(),
  contributorDid: z.string().min(1),
  evaluatorDid: z.string().min(1).default('did:plc:wishocracy-aggregate'),
  createdAt: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  rights: RightsInputSchema.optional(),
  sourceUrls: z.array(z.string().min(1)).optional(),
  attachments: z.array(AttachmentInputSchema.omit({ createdAt: true, subjects: true })).optional(),
});

export type ReferralHypercertInput = z.infer<typeof ReferralHypercertInputSchema>;

export interface ReferralHypercertDraft {
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

export interface MaterializedReferralBundle {
  activity: HypercertActivityClaimRecord;
  attachments: HypercertAttachmentRecord[];
  evaluation: HypercertEvaluationRecord;
  measurements: HypercertMeasurementRecord[];
  rights?: HypercertRightsRecord;
}

export interface PublishedReferralBundle extends MaterializedReferralBundle {
  refs: {
    activity: AtprotoRecordRef;
    attachments: AtprotoRecordRef[];
    evaluation: AtprotoRecordRef;
    measurements: AtprotoRecordRef[];
    rights?: AtprotoRecordRef;
  };
}

function buildReferralShortDescription(input: ReferralHypercertInput): string {
  const verified = input.verifiedVotesRecruited;
  const total = input.totalReferrals;
  const rate = total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0';
  return `${input.referrerName} recruited ${verified} verified voters for ${input.referendumTitle}. ${total} total referrals, ${rate}% verification rate.`;
}

function buildReferralDescription(input: ReferralHypercertInput): string {
  const lines: string[] = [];

  lines.push(`Referrer: ${input.referrerName}`);
  lines.push(`Referendum: ${input.referendumTitle}`);
  lines.push(`Verified votes recruited: ${input.verifiedVotesRecruited}`);
  lines.push(`Total referrals: ${input.totalReferrals}`);

  if (input.totalReferrals > 0) {
    const rate = ((input.verifiedVotesRecruited / input.totalReferrals) * 100).toFixed(1);
    lines.push(`Verification rate: ${rate}%`);
  }

  if (input.campaignProgressPct !== undefined) {
    lines.push(`Campaign progress contribution: ${input.campaignProgressPct.toFixed(2)}%`);
  }

  if (input.voteTokenTxHashes?.length) {
    lines.push('');
    lines.push(`On-chain VOTE mint transactions: ${input.voteTokenTxHashes.length}`);
  }

  return lines.join('\n');
}

function buildReferralMeasurements(input: ReferralHypercertInput): MeasurementMetricInput[] {
  const metrics: MeasurementMetricInput[] = [
    {
      metric: 'Verified Votes Recruited',
      value: input.verifiedVotesRecruited,
      unit: 'count',
      comment: `World ID-verified voters recruited for ${input.referendumTitle}`,
    },
    {
      metric: 'Total Referrals',
      value: input.totalReferrals,
      unit: 'count',
      comment: 'Total signups attributed to this referrer (including unverified)',
    },
  ];

  if (input.totalReferrals > 0) {
    metrics.push({
      metric: 'Recruitment Verification Rate',
      value: Number(((input.verifiedVotesRecruited / input.totalReferrals) * 100).toFixed(1)),
      unit: 'percent',
      comment: 'Percentage of referrals that completed World ID verification and voted',
    });
  }

  return metrics;
}

function buildReferralEvaluationSummary(input: ReferralHypercertInput): string {
  const rate = input.totalReferrals > 0
    ? ((input.verifiedVotesRecruited / input.totalReferrals) * 100).toFixed(1)
    : '0.0';
  return [
    `Voter recruitment assessment: ${input.referrerName} recruited ${input.verifiedVotesRecruited} verified voters for ${input.referendumTitle}.`,
    `${input.totalReferrals} total referrals with ${rate}% verification rate.`,
  ].join(' ');
}

export function createReferralHypercertDraft(
  input: ReferralHypercertInput,
): ReferralHypercertDraft {
  const parsed = ReferralHypercertInputSchema.parse(input);
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
    uri: `optimitron:pending:referral:${parsed.referrerId}`,
    cid: 'pending',
  };

  // Scale score: 1 verified vote = 10 points, capped at 100
  const scoreValue = Math.min(parsed.verifiedVotesRecruited * 10, 100);

  return {
    rights,
    activity: createActivityClaimRecord({
      policyName: `Voter Recruitment: ${parsed.referrerName}`,
      policyDescription: buildReferralShortDescription(parsed),
      shortDescription: buildReferralShortDescription(parsed),
      description: buildReferralDescription(parsed),
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      createdAt: parsed.createdAt,
      contributorDid: parsed.contributorDid,
      contributorRole: 'Voter recruiter',
      workScope: `Civic outreach and voter recruitment for ${parsed.referendumTitle}`,
      sourceUrls: parsed.sourceUrls,
    }),
    attachmentDrafts: parsed.attachments ?? (parsed.sourceUrls?.length
      ? [{
        title: `${parsed.referrerName} referral evidence`,
        urls: parsed.sourceUrls,
        contentType: 'evidence',
        shortDescription: 'Referral tracking and verified vote attribution data.',
      }]
      : []),
    measurements: buildReferralMeasurements(parsed),
    measurementOptions: {
      subject: pendingRef,
      createdAt: parsed.createdAt,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      methodType: 'voter-referral-tracking',
      measurerDid: parsed.contributorDid,
      evidenceURI: parsed.sourceUrls,
    },
    evaluationInput: EvaluationInputSchema.parse({
      subject: pendingRef,
      participantCount: parsed.verifiedVotesRecruited,
      citizenPreferenceWeight: scoreValue / 100,
      createdAt: parsed.createdAt,
      evaluatorDid: parsed.evaluatorDid,
      summary: buildReferralEvaluationSummary(parsed),
      contentUrls: parsed.sourceUrls,
    }),
  };
}

export function materializeReferralBundle(
  draft: ReferralHypercertDraft,
  activityRef: AtprotoRecordRef,
): MaterializedReferralBundle {
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

export async function publishReferralHypercertDraft(
  publisher: AtprotoRecordPublisher,
  repo: string,
  draft: ReferralHypercertDraft,
): Promise<PublishedReferralBundle> {
  const rightsRef = draft.rights
    ? await publishRecord(publisher, repo, draft.rights)
    : undefined;

  const activityRecord = rightsRef
    ? HypercertActivityClaimRecordSchema.parse({ ...draft.activity, rights: rightsRef })
    : draft.activity;
  const activityRef = await publishRecord(publisher, repo, activityRecord);

  const materialized = materializeReferralBundle(
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
