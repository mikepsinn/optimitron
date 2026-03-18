import {
  ACTIVITY_COLLECTION,
  ActivityClaimInputSchema,
  HypercertActivityClaimRecordSchema,
  type ActivityClaimInput,
  type HypercertActivityClaimRecord,
  type HypercertContributor,
} from './types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function trimText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

function buildShortDescription(input: ActivityClaimInput): string {
  const parts = [input.policyDescription];
  if (input.evidenceGrade) {
    parts.push(`Evidence Grade ${input.evidenceGrade}`);
  }
  if (input.welfareScore !== undefined) {
    parts.push(`Welfare Score ${formatNumber(input.welfareScore)}`);
  }
  return trimText(parts.filter(Boolean).join(', '), 300);
}

function buildDescription(input: ActivityClaimInput): string | undefined {
  const lines = [input.description, input.analysisSummary];
  const urls = input.sourceUrls?.length ? `Sources: ${input.sourceUrls.join(', ')}` : undefined;
  if (urls) {
    lines.push(urls);
  }
  const text = lines.filter(Boolean).join('\n\n');
  return text || undefined;
}

function createDefaultContributor(input: ActivityClaimInput): HypercertContributor {
  return {
    contributorIdentity: { identity: input.contributorDid },
    contributionWeight: input.contributorWeight ?? '100',
    contributionDetails: {
      role: input.contributorRole ?? 'Causal inference engine',
    },
  };
}

export function createActivityClaimRecord(
  input: ActivityClaimInput,
): HypercertActivityClaimRecord {
  const parsed = ActivityClaimInputSchema.parse(input);
  return HypercertActivityClaimRecordSchema.parse({
    $type: ACTIVITY_COLLECTION,
    title: `${parsed.policyName} — Causal Analysis by Optimitron`,
    shortDescription: trimText(
      parsed.shortDescription ?? buildShortDescription(parsed),
      3000,
    ),
    description: buildDescription(parsed),
    workScope: { scope: parsed.workScope ?? 'Evidence-based policy analysis' },
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    createdAt: parsed.createdAt ?? nowIso(),
    rights: parsed.rights,
    contributors: [createDefaultContributor(parsed)],
    locations: parsed.locations,
    image: parsed.imageUri ? { uri: parsed.imageUri } : undefined,
  });
}
