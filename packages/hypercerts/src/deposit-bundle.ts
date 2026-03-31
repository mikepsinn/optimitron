import { z } from 'zod';
import { createActivityClaimRecord } from './create-activity.js';
import { createMeasurementRecord } from './create-measurement.js';
import { publishRecord, type AtprotoRecordPublisher, type AtprotoRecordRef } from './publish.js';
import {
  HypercertActivityClaimRecordSchema,
  HypercertMeasurementRecordSchema,
  MeasurementMetricInputSchema,
  PolicyMeasurementInputSchema,
  type HypercertActivityClaimRecord,
  type HypercertMeasurementRecord,
} from './types.js';

export const DepositHypercertInputSchema = z.object({
  depositorAddress: z.string().min(1),
  depositorName: z.string().optional(),
  amount: z.string().min(1),
  sharesReceived: z.string().min(1),
  txHash: z.string().min(1),
  chainId: z.number().int(),
  contributorDid: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

export type DepositHypercertInput = z.infer<typeof DepositHypercertInputSchema>;

export interface DepositHypercertDraft {
  activity: HypercertActivityClaimRecord;
  measurement: HypercertMeasurementRecord;
}

export interface PublishedDepositBundle extends DepositHypercertDraft {
  refs: {
    activity: AtprotoRecordRef;
    measurement: AtprotoRecordRef;
  };
}

function formatUsdcAmount(amount: string): string {
  const raw = BigInt(amount);
  const whole = raw / BigInt(1_000_000);
  const frac = raw % BigInt(1_000_000);
  if (frac === BigInt(0)) {
    return `$${whole.toLocaleString()}`;
  }
  return `$${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}

export function createDepositHypercertDraft(
  input: DepositHypercertInput,
): DepositHypercertDraft {
  const parsed = DepositHypercertInputSchema.parse(input);
  const displayAmount = formatUsdcAmount(parsed.amount);
  const displayName = parsed.depositorName ?? `${parsed.depositorAddress.slice(0, 6)}...${parsed.depositorAddress.slice(-4)}`;

  const pendingRef = {
    uri: `optimitron:pending:deposit:${parsed.txHash}`,
    cid: 'pending',
  };

  const activity = HypercertActivityClaimRecordSchema.parse(
    createActivityClaimRecord({
      policyName: `PRIZE Pool Contribution: ${displayAmount} USDC`,
      policyDescription: `${displayName} funded the Earth Optimization Prize pool with ${displayAmount} USDC.`,
      shortDescription: `${displayName} funded the Earth Optimization Prize pool with ${displayAmount} USDC. Transaction: ${parsed.txHash}`,
      description: [
        `Depositor: ${displayName} (${parsed.depositorAddress})`,
        `Amount: ${displayAmount} USDC`,
        `PRIZE shares received: ${parsed.sharesReceived}`,
        `Chain ID: ${parsed.chainId}`,
        `Transaction: ${parsed.txHash}`,
      ].join('\n'),
      createdAt: parsed.createdAt,
      contributorDid: parsed.contributorDid,
      contributorRole: 'Prize pool funder',
      workScope: 'Earth Optimization Prize pool funding',
    }),
  );

  const baseOptions = PolicyMeasurementInputSchema.omit({ extraMetrics: true }).parse({
    subject: pendingRef,
    createdAt: parsed.createdAt,
    methodType: 'on-chain-deposit',
  });

  const measurement = HypercertMeasurementRecordSchema.parse(
    createMeasurementRecord(
      MeasurementMetricInputSchema.parse({
        metric: 'Deposit Amount',
        value: displayAmount,
        unit: 'USDC',
        comment: `On-chain deposit tx: ${parsed.txHash}`,
      }),
      baseOptions,
    ),
  );

  return { activity, measurement };
}

export async function publishDepositHypercertDraft(
  publisher: AtprotoRecordPublisher,
  repo: string,
  draft: DepositHypercertDraft,
  options: {
    activityRkey?: string;
    measurementRkey?: string;
  } = {},
): Promise<PublishedDepositBundle> {
  const activityRef = await publishRecord(publisher, repo, draft.activity, {
    rkey: options.activityRkey,
  });

  // Re-create measurement with real activity ref as subject
  const baseOptions = PolicyMeasurementInputSchema.omit({ extraMetrics: true }).parse({
    subject: activityRef,
    createdAt: draft.activity.createdAt,
    methodType: 'on-chain-deposit',
  });

  const measurement = HypercertMeasurementRecordSchema.parse(
    createMeasurementRecord(
      MeasurementMetricInputSchema.parse({
        metric: draft.measurement.metric,
        value: draft.measurement.value,
        unit: draft.measurement.unit,
        comment: draft.measurement.comment,
      }),
      baseOptions,
    ),
  );

  const measurementRef = await publishRecord(publisher, repo, measurement, {
    rkey: options.measurementRkey,
  });

  return {
    activity: draft.activity,
    measurement,
    refs: {
      activity: activityRef,
      measurement: measurementRef,
    },
  };
}
