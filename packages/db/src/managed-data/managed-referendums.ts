import { createHash } from "node:crypto";
import { shareableSnippets } from "@optimitron/data/parameters";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import {
  ReferendumKind,
  ReferendumStatus,
  type ReferendumKind as ReferendumKindValue,
  type ReferendumStatus as ReferendumStatusValue,
} from "../generated/prisma/client.js";

// Canonical Referendum records. The data sync upserts these on every
// deploy (and in CI before tests), matching the production deploy flow.
// Previously these lived inline in `prisma/seed.ts` and depended on the
// full seed running, which never happens in production.

export const TREATY_REFERENDUM_SLUG = "one-percent-treaty";
export const DECLARATION_REFERENDUM_SLUG = "declaration-of-optimization";
export const COURT_OF_HUMANITY_REFERENDUM_SLUG = "court-of-humanity";

export const MANAGED_REFERENDUMS_COLLECTION_KEY = "managed-referendums";

const REFERENDUM_PUBLISHED_AT = new Date("2026-05-03T00:00:00.000Z");

export interface ManagedReferendumRecord {
  slug: string;
  title: string;
  question: string;
  kind: ReferendumKindValue;
  description: string;
  bodyMarkdown: string;
  status: ReferendumStatusValue;
}

export const MANAGED_REFERENDUMS: readonly ManagedReferendumRecord[] = [
  {
    slug: TREATY_REFERENDUM_SLUG,
    title: "The 1% Treaty",
    question:
      "Should governments redirect 1% of military spending to pragmatic clinical trials and disease eradication by adopting the 1% Treaty?",
    kind: ReferendumKind.TREATY,
    description:
      "The 1% Treaty redirects one percent of military spending into pragmatic clinical trials so disease gets less time to kill people.",
    bodyMarkdown: shareableSnippets.onePercentTreatyText.markdown,
    status: ReferendumStatus.ACTIVE,
  },
  {
    slug: DECLARATION_REFERENDUM_SLUG,
    title: "Declaration of Optimization",
    question: "Do you endorse the Declaration of Optimization?",
    kind: ReferendumKind.DECLARATION,
    description:
      "Sign the Declaration of Optimization to declare your support for evidence-based governance.",
    bodyMarkdown: [
      shareableSnippets.whyOptimizationIsNecessary.markdown,
      shareableSnippets.declarationOfOptimization.markdown,
    ].join("\n\n"),
    status: ReferendumStatus.ACTIVE,
  },
  {
    slug: COURT_OF_HUMANITY_REFERENDUM_SLUG,
    title: "The Court of Humanity",
    question: COURT_OF_HUMANITY_QUESTION,
    kind: ReferendumKind.MEMBERSHIP,
    description:
      "Join the decentralized court where 8 billion humans are the jury and sovereign immunity is abolished.",
    bodyMarkdown: COURT_OF_HUMANITY_TEXT.markdown,
    status: ReferendumStatus.ACTIVE,
  },
] as const;

function normalizeReferendumContentText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: normalizeReferendumContentText(input.description),
        bodyMarkdown: normalizeReferendumContentText(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

interface ReferendumUpsertData {
  title: string;
  slug: string;
  question: string;
  kind: ReferendumKindValue;
  description: string;
  bodyMarkdown: string;
  publishedAt: Date;
  lockedAt: Date | null;
  status: ReferendumStatusValue;
  contentHash: string;
}

interface ManagedReferendumRow {
  slug: string;
  contentHash: string;
}

export interface ManagedReferendumClient {
  referendum: {
    findMany(args: {
      where: { slug: { in: string[] } };
      select: { slug: true; contentHash: true };
    }): Promise<ManagedReferendumRow[]>;
    upsert(args: {
      where: { slug: string };
      update: ReferendumUpsertData;
      create: ReferendumUpsertData;
    }): Promise<{ slug: string }>;
  };
}

export interface SyncManagedReferendumsOptions {
  apply: boolean;
}

export interface SyncManagedReferendumsResult {
  totalRecords: number;
  upserted: string[];
  unchanged: string[];
}

export async function syncManagedReferendums(
  client: ManagedReferendumClient,
  options: SyncManagedReferendumsOptions,
): Promise<SyncManagedReferendumsResult> {
  const slugs = MANAGED_REFERENDUMS.map((r) => r.slug);
  const existing = await client.referendum.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, contentHash: true },
  });
  const existingHashBySlug = new Map(existing.map((r) => [r.slug, r.contentHash]));

  const upserted: string[] = [];
  const unchanged: string[] = [];

  for (const record of MANAGED_REFERENDUMS) {
    const contentHash = buildReferendumContentHash({
      question: record.question,
      description: record.description,
      bodyMarkdown: record.bodyMarkdown,
    });

    if (existingHashBySlug.get(record.slug) === contentHash) {
      unchanged.push(record.slug);
      continue;
    }

    if (!options.apply) {
      // Dry-run: report would-be-upsert but don't write.
      upserted.push(record.slug);
      continue;
    }

    const data: ReferendumUpsertData = {
      title: record.title,
      slug: record.slug,
      question: record.question,
      kind: record.kind,
      description: record.description,
      bodyMarkdown: record.bodyMarkdown,
      publishedAt: REFERENDUM_PUBLISHED_AT,
      lockedAt: null,
      status: record.status,
      contentHash,
    };

    await client.referendum.upsert({
      where: { slug: record.slug },
      update: data,
      create: data,
    });
    upserted.push(record.slug);
  }

  return {
    totalRecords: MANAGED_REFERENDUMS.length,
    upserted,
    unchanged,
  };
}

export function formatManagedReferendumsResult(
  result: SyncManagedReferendumsResult,
): string {
  const parts = [
    `Referendums: ${result.upserted.length}/${result.totalRecords} upserted`,
  ];
  if (result.unchanged.length) {
    parts.push(`${result.unchanged.length} unchanged`);
  }
  return parts.join(", ");
}
