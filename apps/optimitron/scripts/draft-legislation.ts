#!/usr/bin/env tsx
/**
 * Draft model legislation from the generated budget analysis artifact.
 *
 * Reads the typed us-budget-analysis report, derives legislation briefs from
 * @optimitron/obg, then uses Gemini + Google Search grounding to draft
 * evidence-based markdown into the repo-level content directory.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run draft:legislation
 *   pnpm --filter @optimitron/web run draft:legislation -- --category Military
 *
 * Requires: GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY env var
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import {
  draftLegislation,
  generateSourceFootnotes,
  synthesizeLegislationEvidenceBundle,
  type LegislationResearchPacket,
  type PolicyExemplarInput,
  type WishoniaLegislativePromptContext,
} from "../../../packages/agent/src/index.ts";
import {
  createBudgetLegislationBriefs,
  type BudgetLegislationBrief,
} from "../../../packages/obg/src/budget-legislation-brief.ts";
import {
  createPolicyLegislationBriefs,
  type PolicyLegislationBrief,
} from "../../../packages/opg/src/policy-legislation-brief.ts";
import {
  getWishoniaLegislativePackageForCategory,
  OECD_CATEGORY_MAPPINGS,
  POLICY_EXEMPLARS,
  resolveWishoniaLegislativePackage,
} from "@optimitron/data";
import { usBudgetAnalysis } from "../src/data/us-budget-analysis.js";
import { usPolicyAnalysis } from "../src/data/us-policy-analysis.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, "../../..");
const envPath = resolve(monorepoRoot, ".env");

if (existsSync(envPath)) {
  loadDotenv({ path: envPath });
}

const outputDir = resolve(monorepoRoot, "content/legislation");
const CURATED_PUBLIC_SLUGS = new Set([
  "military-reform",
  "health-non-medicare-medicaid-reform",
  "education-reform",
  "science-nasa-reform",
]);
const DRAFT_MODEL = process.env["LEGISLATION_DRAFT_MODEL"] ?? "gemini-3.1-pro-preview";
const EVIDENCE_MODEL =
  process.env["LEGISLATION_EVIDENCE_MODEL"] ?? "gemini-3.1-pro-preview";

const EXEMPLAR_CATEGORY_MAP: Record<string, string[]> = {
  Military: [
    "Singapore 3M Health System (Medisave / MediShield / Medifund)",
    "Costa Rica CCSS Universal Healthcare",
  ],
  Medicare: ["Singapore 3M Health System (Medisave / MediShield / Medifund)"],
  Medicaid: [
    "Singapore 3M Health System (Medisave / MediShield / Medifund)",
    "Costa Rica CCSS Universal Healthcare",
  ],
  "Health (non-Medicare/Medicaid)": [
    "Singapore 3M Health System (Medisave / MediShield / Medifund)",
    "Japan Tokutei Kenshin Health Screening",
  ],
  "Social Security": [],
  Education: ["Finland Comprehensive Education Reform"],
  "Science / NASA": ["South Korea Broadband and Digital Infrastructure"],
};

function getExemplarsForCategory(categoryName: string): PolicyExemplarInput[] {
  const names = EXEMPLAR_CATEGORY_MAP[categoryName] ?? [];

  return POLICY_EXEMPLARS
    .filter((exemplar) => names.includes(exemplar.name))
    .map((exemplar) => ({
      name: exemplar.name,
      originCountry: exemplar.originCountry,
      description: exemplar.description,
      yearImplemented: exemplar.yearImplemented,
      adaptationNotes: exemplar.adaptationNotes,
    }));
}

function formatUsdCompact(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T/yr`;
  }

  if (absoluteValue >= 1_000_000_000) {
    return `$${Math.round(value / 1_000_000_000)}B/yr`;
  }

  if (absoluteValue >= 1_000_000) {
    return `$${Math.round(value / 1_000_000)}M/yr`;
  }

  return `$${Math.round(value)}/yr`;
}

function quoteFrontmatter(value: string): string {
  return JSON.stringify(value);
}

function canonicalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getCurrentPublishedSlugs(): Set<string> {
  if (!existsSync(outputDir)) {
    return new Set(CURATED_PUBLIC_SLUGS);
  }

  const slugs = new Set(
    readdirSync(outputDir)
      .filter((entry) => entry.endsWith(".md"))
      .map((entry) => entry.replace(/\.md$/, "")),
  );

  return slugs.size > 0 ? slugs : new Set(CURATED_PUBLIC_SLUGS);
}

function getDeduplicationKey(brief: BudgetLegislationBrief): string {
  const mapping =
    OECD_CATEGORY_MAPPINGS[brief.categoryId as keyof typeof OECD_CATEGORY_MAPPINGS];

  return mapping?.spendingField ?? brief.categoryId;
}

function compareBriefPriority(
  left: BudgetLegislationBrief,
  right: BudgetLegislationBrief,
  publishedSlugs: Set<string>,
): number {
  const leftPublished = publishedSlugs.has(left.slug) ? 1 : 0;
  const rightPublished = publishedSlugs.has(right.slug) ? 1 : 0;

  if (leftPublished !== rightPublished) {
    return rightPublished - leftPublished;
  }

  const leftExemplars = getExemplarsForCategory(left.categoryName).length;
  const rightExemplars = getExemplarsForCategory(right.categoryName).length;

  if (leftExemplars !== rightExemplars) {
    return rightExemplars - leftExemplars;
  }

  return right.evidence.potentialSavingsTotal - left.evidence.potentialSavingsTotal;
}

function dedupeBriefs(
  briefs: BudgetLegislationBrief[],
  publishedSlugs: Set<string>,
): BudgetLegislationBrief[] {
  const byGroup = new Map<string, BudgetLegislationBrief>();

  for (const brief of briefs) {
    const groupKey = getDeduplicationKey(brief);
    const existing = byGroup.get(groupKey);

    if (!existing || compareBriefPriority(existing, brief, publishedSlugs) > 0) {
      byGroup.set(groupKey, brief);
    }
  }

  return [...byGroup.values()].sort(
    (left, right) => right.evidence.potentialSavingsTotal - left.evidence.potentialSavingsTotal,
  );
}

function getPolicyAliases(categoryId: string): string[] {
  const aliases: Record<string, string[]> = {
    military: ["military"],
    health_discretionary: ["health_non_medicare_medicaid", "health_discretionary"],
    education: ["education"],
    science_nasa: ["science_nasa", "science", "nasa"],
  };

  return aliases[categoryId] ?? [categoryId];
}

function getRelatedPolicyBriefs(
  brief: BudgetLegislationBrief,
  policyBriefs: PolicyLegislationBrief[],
): PolicyLegislationBrief[] {
  const aliases = new Set(getPolicyAliases(brief.categoryId).map(canonicalize));

  return policyBriefs.filter((policyBrief) => {
    const category = canonicalize(policyBrief.category);
    const slug = canonicalize(policyBrief.slug);
    const title = canonicalize(policyBrief.title);

    for (const alias of aliases) {
      if (category === alias || slug.includes(alias) || title.includes(alias)) {
        return true;
      }
    }

    return false;
  });
}

function getWishoniaContext(
  brief: BudgetLegislationBrief,
): WishoniaLegislativePromptContext | undefined {
  const pkg = getWishoniaLegislativePackageForCategory(brief.categoryId);
  const resolved = pkg ? resolveWishoniaLegislativePackage(pkg) : undefined;

  if (!resolved) {
    return undefined;
  }

  return {
    packageId: resolved.id,
    packageTitle: resolved.title,
    shortDescription: resolved.shortDescription,
    citizenBenefit: resolved.citizenBenefit,
    defaultSavingsDisposition: resolved.defaultSavingsDisposition,
    scopeGuardrails: resolved.scopeGuardrails,
    draftingDirectives: resolved.draftingDirectives,
    agencies: resolved.agencies.map(({ agency, role, relevance }) => ({
      id: agency.id,
      dName: agency.dName,
      role,
      relevance,
      replacesAgencyName: agency.replacesAgencyName,
      tagline: agency.tagline,
      description: agency.description,
      optimalMetrics: agency.optimalMetrics.map(
        (metric) => `${metric.metric}: ${metric.description}`,
      ),
      codeHeader: agency.codeHeader,
      codeExplanation: agency.codeExplanation,
      annualSavings: agency.annualSavings,
      savingsComparison: agency.savingsComparison,
    })),
  };
}

function getDraftEvidence(brief: BudgetLegislationBrief) {
  const category = usBudgetAnalysis.categories.find(
    (budgetCategory) =>
      budgetCategory.id === brief.categoryId &&
      budgetCategory.name === brief.categoryName &&
      budgetCategory.efficiency !== undefined,
  );

  if (!category?.efficiency) {
    throw new Error(`No full efficiency evidence found for ${brief.categoryId}`);
  }

  return {
    ...category.efficiency,
    category: category.name,
  };
}

function sleep(ms: number) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function buildLegislationObjective(
  brief: BudgetLegislationBrief,
  relatedPolicies: PolicyLegislationBrief[],
  wishoniaContext?: WishoniaLegislativePromptContext,
): string {
  const relatedPolicySummary =
    relatedPolicies.length > 0
      ? relatedPolicies
          .map(
            (policy) =>
              `${policy.policyName} (${policy.recommendationType}, evidence grade ${policy.evidenceGrade})`,
          )
          .join("; ")
      : "No directly matched OPG policy briefs.";

  const wishoniaSummary = wishoniaContext
    ? [
        `Wishonia package: ${wishoniaContext.packageTitle}.`,
        `Citizen benefit: ${wishoniaContext.citizenBenefit}`,
        `Default savings disposition: ${wishoniaContext.defaultSavingsDisposition}.`,
        `Scope guardrails: ${wishoniaContext.scopeGuardrails.join(" ")}`,
        `Relevant agencies: ${wishoniaContext.agencies
          .map((agency) => `${agency.dName} (${agency.role})`)
          .join("; ")}.`,
      ].join(" ")
    : "No Wishonia package context.";

  return [
    `Draft concise federal legislation that directly reforms ${brief.categoryName.toLowerCase()} institutions`,
    `so the United States can move from rank`,
    `${brief.evidence.rank}/${brief.evidence.totalCountries} toward ${brief.modelCountry}'s`,
    `${brief.evidence.outcomeName.toLowerCase()} performance.`,
    `Keep the bill category-faithful: the main provisions must stay about ${brief.categoryName.toLowerCase()},`,
    `not turn into a general-purpose reallocation manifesto.`,
    `Current overspend ratio: ${brief.evidence.overspendRatio.toFixed(1)}x.`,
    `Potential annual savings: ${formatUsdCompact(brief.evidence.potentialSavingsTotal)}.`,
    `Related policy context: ${relatedPolicySummary}`,
    wishoniaSummary,
    `Make any savings disposition short and default to the Optimization Dividend after implementation and transition costs,`,
    `unless a narrow public-goods exception is truly required.`,
    `Favor market mechanisms, explicit public-goods tests, public-choice realism,`,
    `anti-capture safeguards, anti-corruption design, and compensated Pareto improvements where strict Pareto is impossible.`,
    `Write for normal citizens: plain English, short sections, and obvious personal benefits.`,
  ].join(" ");
}

function hasPromptLeakage(text: string): boolean {
  return /\[(?:from prompt|citation needed|best country)\]|(?:^|\s)(?:TODO|TBD)(?:\s|$)/i.test(
    text,
  );
}

function hasStructuredCitationGap(text: string): boolean {
  const hasEvidenceSections = /## Findings|## Key Provisions|## Evidence Appendix/.test(text);
  const hasRenderedRefs = /\[\d+\]\(https?:\/\/.+?\)/.test(text);

  return hasEvidenceSections && !hasRenderedRefs;
}

function validateGovernancePacket(packet: LegislationResearchPacket): string[] {
  const failures: string[] = [];

  if (packet.publicGoodsAndMarketFramework.length === 0) {
    failures.push("missing public-goods and market framework");
  }

  if (packet.publicChoiceAndCapture.length === 0) {
    failures.push("missing public choice / capture analysis");
  }

  if (packet.paretoAndCompensation.length === 0) {
    failures.push("missing pareto / compensation analysis");
  }

  const invalidParetoClaims = packet.paretoAndCompensation.filter(
    (analysis) =>
      analysis.status === "strict_pareto" &&
      /unclear|unknown|none identified|not specified/i.test(analysis.summary),
  );

  if (invalidParetoClaims.length > 0) {
    failures.push("strict pareto claim without a defensible summary");
  }

  for (const provision of packet.keyProvisions) {
    if (!provision.marketMechanism.trim()) {
      failures.push(`${provision.title}: missing market mechanism`);
    }
    if (!provision.publicGoodsJustification.trim()) {
      failures.push(`${provision.title}: missing public-goods justification`);
    }
    if (!provision.publicChoiceRationale.trim()) {
      failures.push(`${provision.title}: missing public-choice rationale`);
    }
    if (!provision.paretoRationale.trim()) {
      failures.push(`${provision.title}: missing pareto rationale`);
    }
    if (!provision.compensationMechanism.trim()) {
      failures.push(`${provision.title}: missing compensation mechanism`);
    }
    if (!provision.residualRentHandling.trim()) {
      failures.push(`${provision.title}: missing residual rent handling`);
    }
    if (provision.captureRisks.length === 0) {
      failures.push(`${provision.title}: missing capture risks`);
    }
    if (provision.antiCaptureSafeguards.length < 2) {
      failures.push(`${provision.title}: too few anti-capture safeguards`);
    }
    if (provision.corruptionRisks.length === 0) {
      failures.push(`${provision.title}: missing corruption risks`);
    }
    if (provision.antiCorruptionSafeguards.length < 2) {
      failures.push(`${provision.title}: too few anti-corruption safeguards`);
    }
  }

  return failures;
}

async function draftWithGroundingRetry(
  brief: BudgetLegislationBrief,
  exemplars: PolicyExemplarInput[],
  relatedPolicies: PolicyLegislationBrief[],
  wishoniaContext?: WishoniaLegislativePromptContext,
) {
  const draftEvidence = getDraftEvidence(brief);
  const evidenceBundle = await synthesizeLegislationEvidenceBundle({
    objective: buildLegislationObjective(
      brief,
      relatedPolicies,
      wishoniaContext,
    ),
    model: EVIDENCE_MODEL,
    context: {
      categoryName: brief.categoryName,
      categoryId: brief.categoryId,
      targetJurisdiction: "United States",
      overspendRatio: brief.evidence.overspendRatio,
      rank: brief.evidence.rank,
      totalCountries: brief.evidence.totalCountries,
      modelCountry: brief.modelCountry,
      outcomeName: brief.evidence.outcomeName,
      spendingPerCapita: brief.evidence.spendingPerCapita,
      floorSpendingPerCapita: brief.evidence.floorSpendingPerCapita,
      potentialSavingsTotal: brief.evidence.potentialSavingsTotal,
      relatedPolicies: relatedPolicies.map((policy) => ({
        policyName: policy.policyName,
        recommendationType: policy.recommendationType,
        evidenceGrade: policy.evidenceGrade,
        rationale: policy.rationale,
      })),
    },
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const draft = await draftLegislation(draftEvidence, exemplars, {
      model: DRAFT_MODEL,
      evidenceBundle,
      wishoniaContext,
    });
    const hasGrounding =
      (draft.sources.length > 0 && draft.searchQueries.length > 0) ||
      (draft.sources.length >= 8 && draft.citations.length >= 12);
    const leakedPromptText = hasPromptLeakage(draft.legislationText);
    const citationGap = hasStructuredCitationGap(draft.legislationText);
    const governanceFailures = validateGovernancePacket(draft.researchPacket);

    if (hasGrounding && !leakedPromptText && !citationGap && governanceFailures.length === 0) {
      return {
        draft,
        evidenceBundle,
      };
    }

    if (attempt === 2) {
      const failureReasons = [
        hasGrounding ? null : "grounding metadata missing",
        leakedPromptText ? "prompt leakage placeholders detected" : null,
        citationGap ? "structured packet rendered without inline citations" : null,
        governanceFailures.length > 0
          ? `governance guardrails failed (${governanceFailures.join("; ")})`
          : null,
      ]
        .filter(Boolean)
        .join("; ");

      throw new Error(`Draft failed quality checks: ${failureReasons}`);
    }

    console.log("  Draft quality check failed; retrying once...");
    await sleep(1500);
  }

  throw new Error("Unreachable retry state");
}

function buildFrontmatter(brief: BudgetLegislationBrief, generatedAt: string): string {
  return [
    "---",
    `title: ${quoteFrontmatter(brief.title)}`,
    `summary: ${quoteFrontmatter(brief.summary)}`,
    'status: "draft"',
    `category_id: ${quoteFrontmatter(brief.categoryId)}`,
    `category_name: ${quoteFrontmatter(brief.categoryName)}`,
    `model_country: ${quoteFrontmatter(brief.modelCountry)}`,
    `overspend_ratio: ${quoteFrontmatter(`${brief.evidence.overspendRatio.toFixed(1)}x`)}`,
    `us_rank: ${quoteFrontmatter(`${brief.evidence.rank}/${brief.evidence.totalCountries}`)}`,
    `potential_savings: ${quoteFrontmatter(formatUsdCompact(brief.evidence.potentialSavingsTotal))}`,
    'source_artifact: "apps/optimitron/src/data/us-budget-analysis.ts"',
    'source_brief: "@optimitron/obg:createBudgetLegislationBriefs"',
    'generated_by: "optimitron-agent-gemini"',
    `generated_at: ${quoteFrontmatter(generatedAt)}`,
    `analysis_generated_at: ${quoteFrontmatter(brief.sourceGeneratedAt)}`,
    "---",
    "",
  ].join("\n");
}

async function main() {
  const generateAll = process.argv.includes("--all");
  const categoryFilter = process.argv.find((_, index) => process.argv[index - 1] === "--category");
  const minOverspendRatio = parseFloat(
    process.argv.find((_, index) => process.argv[index - 1] === "--min-overspend") ?? "1.5",
  );
  const publishedSlugs = getCurrentPublishedSlugs();
  const policyBriefs = createPolicyLegislationBriefs(usPolicyAnalysis);

  const briefs = dedupeBriefs(
    createBudgetLegislationBriefs(usBudgetAnalysis, {
      minOverspendRatio,
    }),
    publishedSlugs,
  ).filter((brief) => {
    if (categoryFilter) {
      return (
        brief.categoryName === categoryFilter ||
        brief.categoryId === categoryFilter ||
        brief.slug === categoryFilter
      );
    }

    if (generateAll) {
      return true;
    }

    return publishedSlugs.has(brief.slug);
  });

  if (briefs.length === 0) {
    console.log(`No legislation briefs found with overspend ratio >= ${minOverspendRatio}.`);
    if (categoryFilter) {
      console.log(`  (filtered to: ${categoryFilter})`);
    }
    process.exit(0);
  }

  console.log(`Found ${briefs.length} legislation candidates:\n`);
  for (const brief of briefs) {
    console.log(
      `  ${brief.categoryName}: ${brief.evidence.overspendRatio.toFixed(1)}x overspend ` +
      `(rank ${brief.evidence.rank}/${brief.evidence.totalCountries})`,
    );
  }
  console.log("");

  mkdirSync(outputDir, { recursive: true });

  for (const brief of briefs) {
    const exemplars = getExemplarsForCategory(brief.categoryName);
    const relatedPolicies = getRelatedPolicyBriefs(brief, policyBriefs);
    const wishoniaContext = getWishoniaContext(brief);

    console.log(`Drafting legislation for ${brief.categoryName}...`);
    console.log(
      `  Evidence: ${brief.evidence.overspendRatio.toFixed(1)}x overspend, ` +
      `rank ${brief.evidence.rank}/${brief.evidence.totalCountries}`,
    );
    console.log(
      `  Exemplars: ${
        exemplars.length > 0
          ? exemplars.map((exemplar) => exemplar.originCountry).join(", ")
          : "none (Gemini will research)"
      }`,
    );
    console.log(
      `  Related OPG policies: ${
        relatedPolicies.length > 0
          ? relatedPolicies.map((policy) => policy.policyName).join(", ")
          : "none"
      }`,
    );
    console.log(
      `  Wishonia package: ${
        wishoniaContext
          ? `${wishoniaContext.packageTitle} (${wishoniaContext.agencies
              .map((agency) => agency.id)
              .join(", ")})`
          : "none"
      }`,
    );
    console.log(`  Evidence synthesis model: ${EVIDENCE_MODEL}`);
    console.log(`  Draft model: ${DRAFT_MODEL}`);

    try {
      const generatedAt = new Date().toISOString();
      const { draft, evidenceBundle } = await draftWithGroundingRetry(
        brief,
        exemplars,
        relatedPolicies,
        wishoniaContext,
      );
      const footnotes = generateSourceFootnotes(draft);
      const title = draft.billTitle || brief.title;
      const output = [
        buildFrontmatter(brief, generatedAt),
        `# ${title}`,
        "",
        `> Generated by Optimitron OBG + Gemini (search-grounded structured research packet)`,
        `> Based on ${brief.evidenceSource}`,
        `> Category: ${brief.categoryName} | Overspend: ${brief.evidence.overspendRatio.toFixed(1)}x | US Rank: ${brief.evidence.rank}/${brief.evidence.totalCountries}`,
        "",
        draft.legislationText,
        "",
        "---",
        "",
        footnotes,
        "",
        "---",
        "",
        "## Metadata",
        "",
        `- **Search queries**: ${draft.searchQueries.join("; ")}`,
        `- **Sources cited**: ${draft.sources.length}`,
        `- **Claims with citations**: ${draft.citations.length}`,
        `- **Rendered bill title**: ${title}`,
        `- **Structured research model**: ${draft.researchModel}`,
        `- **Structured findings**: ${draft.researchPacket.findings.length}`,
        `- **Structured provisions**: ${draft.researchPacket.keyProvisions.length}`,
        `- **Structured evaluation metrics**: ${draft.researchPacket.evaluationAndSunset.length}`,
        `- **Evidence bundle model**: ${evidenceBundle.model}`,
        `- **Evidence bundle parameters**: ${evidenceBundle.parameters.length}`,
        `- **Evidence bundle insights**: ${evidenceBundle.insights.length}`,
        `- **Evidence bundle summary**: ${evidenceBundle.summary}`,
        `- **Category**: ${brief.categoryName}`,
        `- **Model country**: ${brief.modelCountry}`,
        `- **Wishonia package**: ${
          wishoniaContext ? wishoniaContext.packageTitle : "none"
        }`,
        `- **Wishonia agencies**: ${
          wishoniaContext
            ? wishoniaContext.agencies
                .map((agency) => `${agency.dName} (${agency.role})`)
                .join("; ")
            : "none"
        }`,
        `- **Default savings disposition**: ${
          wishoniaContext
            ? wishoniaContext.defaultSavingsDisposition
            : "unspecified"
        }`,
        `- **Overspend ratio**: ${brief.evidence.overspendRatio.toFixed(1)}x`,
        `- **Potential savings**: ${formatUsdCompact(brief.evidence.potentialSavingsTotal)}`,
        `- **Related OPG policy briefs**: ${
          relatedPolicies.length > 0
            ? relatedPolicies
                .map(
                  (policy) =>
                    `${policy.policyName} (${policy.recommendationType}, grade ${policy.evidenceGrade})`,
                )
                .join("; ")
            : "none"
        }`,
      ].join("\n");

      const outPath = resolve(outputDir, `${brief.slug}.md`);
      writeFileSync(outPath, output);

      console.log(
        `  OK -> ${brief.slug}.md (${draft.sources.length} sources, ${draft.citations.length} cited claims)`,
      );
    } catch (error) {
      console.error(`  Failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\nDone! Legislation drafts are in content/legislation/");
}

main().catch(console.error);
