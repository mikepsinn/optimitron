import { createHash } from "node:crypto";
import { shareableSnippets } from "@optimitron/data/parameters";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import {
  ReferendumKind,
  ReferendumStatus,
  type PrismaClient,
  type ReferendumKind as ReferendumKindValue,
  type ReferendumStatus as ReferendumStatusValue,
} from "../generated/prisma/client.js";

// Canonical Referendum records. Synced on every deploy + CI run via
// `pnpm db:sync:managed-data --apply`. Edit a record below → sync detects
// the content-hash change → upserts. No change → skip the write.

export const TREATY_REFERENDUM_SLUG = "one-percent-treaty";
export const DECLARATION_REFERENDUM_SLUG = "declaration-of-optimization";
export const COURT_OF_HUMANITY_REFERENDUM_SLUG = "court-of-humanity";

const REFERENDUM_PUBLISHED_AT = new Date("2026-05-03T00:00:00.000Z");

interface ManagedReferendumRecord {
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

export function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}): string {
  const normalize = (v: string | null | undefined) => v?.trim() || null;
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: normalize(input.description),
        bodyMarkdown: normalize(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

export async function syncManagedReferendums(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ totalRecords: number; upserted: string[]; unchanged: string[] }> {
  const slugs = MANAGED_REFERENDUMS.map((r) => r.slug);
  const existing = await prisma.referendum.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, contentHash: true },
  });
  const existingHashBySlug = new Map(existing.map((r) => [r.slug, r.contentHash]));

  const upserted: string[] = [];
  const unchanged: string[] = [];

  for (const record of MANAGED_REFERENDUMS) {
    const contentHash = buildReferendumContentHash(record);

    if (existingHashBySlug.get(record.slug) === contentHash) {
      unchanged.push(record.slug);
      continue;
    }

    if (!options.apply) {
      upserted.push(record.slug);
      continue;
    }

    const data = {
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

    await prisma.referendum.upsert({
      where: { slug: record.slug },
      update: data,
      create: data,
    });
    upserted.push(record.slug);
  }

  return { totalRecords: MANAGED_REFERENDUMS.length, upserted, unchanged };
}

export function formatManagedReferendumsResult(
  result: { totalRecords: number; upserted: string[]; unchanged: string[] },
): string {
  const parts = [`Referendums: ${result.upserted.length}/${result.totalRecords} upserted`];
  if (result.unchanged.length) parts.push(`${result.unchanged.length} unchanged`);
  return parts.join(", ");
}
