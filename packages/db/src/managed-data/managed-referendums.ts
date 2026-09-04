import { createHash } from "node:crypto";
import { shareableSnippets } from "@optimitron/data/parameters";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import {
  COURT_OF_HUMANITY_REFERENDUM_SLUG,
  DECLARATION_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
  TREATY_REFERENDUM_SLUG,
} from "../constants.js";
import { MANAGED_HUMANITY_V_GOVERNMENT_VERDICT } from "./managed-humanity-v-government.js";
import {
  ReferendumKind,
  ReferendumStatus,
  type PrismaClient,
  type ReferendumKind as ReferendumKindValue,
  type ReferendumStatus as ReferendumStatusValue,
} from "../generated/prisma/client.js";

// Canonical Referendum records. Synced on every deploy + CI run via
// `pnpm db:sync:managed-data --apply`. Edit a record below → sync detects
// the change by comparing the row's content fields against the canonical
// record → upserts on drift. No change → skip the write.

const REFERENDUM_PUBLISHED_AT = new Date("2026-05-03T00:00:00.000Z");

interface ManagedReferendumRecord {
  slug: string;
  title: string;
  question: string;
  kind: ReferendumKindValue;
  description: string;
  bodyMarkdown: string;
  status: ReferendumStatusValue;
  publishedAt?: Date;
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
    slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG,
    title: "Patient Access to Pragmatic Clinical Trials",
    question: TRIAL_ABUNDANCE_REFERENDUM_QUESTION,
    kind: ReferendumKind.GENERAL,
    description:
      "Measures public support for patients joining pragmatic clinical trials through their regular physician.",
    bodyMarkdown:
      "Pragmatic clinical trials compare treatments during routine medical care. Participation is voluntary and requires informed consent and appropriate safety oversight.",
    status: ReferendumStatus.ACTIVE,
    publishedAt: new Date("2026-08-31T00:00:00.000Z"),
  },
  {
    slug: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
    title: "Patient-Funded Access to Pragmatic Clinical Trials",
    question: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
    kind: ReferendumKind.GENERAL,
    description:
      "Measures public support for patients paying the costs of receiving an otherwise unavailable treatment through a pragmatic clinical trial.",
    bodyMarkdown:
      "This question concerns patient-funded access when a promising treatment would otherwise be unavailable. The treatment must be provided through a pragmatic clinical trial with informed consent and appropriate safety oversight.",
    status: ReferendumStatus.ACTIVE,
    publishedAt: new Date("2026-08-31T00:00:00.000Z"),
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
  MANAGED_HUMANITY_V_GOVERNMENT_VERDICT,
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
  // Compare canonical record fields against the DB row directly. The stored
  // `contentHash` column is not a trustworthy change signal — a direct
  // `UPDATE referendum SET title = ...` leaves the hash stale, so the row
  // can drift away from canonical without us noticing. Field-by-field
  // comparison matches the pattern in `sync-managed-tasks.ts`.
  const existing = await prisma.referendum.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      title: true,
      question: true,
      kind: true,
      description: true,
      bodyMarkdown: true,
      publishedAt: true,
      status: true,
    },
  });
  const existingBySlug = new Map(existing.map((r) => [r.slug, r]));

  const upserted: string[] = [];
  const unchanged: string[] = [];

  for (const record of MANAGED_REFERENDUMS) {
    const row = existingBySlug.get(record.slug);
    if (
      row?.title === record.title &&
      row.question === record.question &&
      row.kind === record.kind &&
      row.description === record.description &&
      row.bodyMarkdown === record.bodyMarkdown &&
      row.publishedAt?.getTime() ===
        (record.publishedAt ?? REFERENDUM_PUBLISHED_AT).getTime() &&
      row.status === record.status
    ) {
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
      publishedAt: record.publishedAt ?? REFERENDUM_PUBLISHED_AT,
      lockedAt: null,
      status: record.status,
      contentHash: buildReferendumContentHash(record),
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
