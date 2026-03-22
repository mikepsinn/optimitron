/**
 * Legislation Drafter — Gemini + Google Search Grounding
 *
 * Takes efficient frontier results (which countries do better for less)
 * and policy exemplars, then uses Gemini with Google Search grounding
 * to draft model legislation with real citations.
 *
 * The pipeline:
 * 1. Efficient frontier identifies best-performing countries per category
 * 2. Policy exemplars provide the framing context
 * 3. Gemini with search grounding researches specific policies and drafts legislation
 * 4. Response includes source citations with confidence scores
 */

import { GoogleGenAI } from '@google/genai';
import { resolveGeminiApiKey } from './gemini.js';
import type { EfficiencyAnalysis } from '@optimitron/obg';

// ─── Types ──────────────────────────────────────────────────────────

export interface EfficiencyEvidence {
  /** Budget category (e.g., "Military", "Healthcare") */
  category: string;
  /** US spending per capita */
  usSpendingPerCapita: number;
  /** US outcome value */
  usOutcome: number;
  /** Outcome metric name (e.g., "Life Expectancy") */
  outcomeName: string;
  /** US efficiency rank (1 = best) */
  usRank: number;
  /** Total countries compared */
  totalCountries: number;
  /** Overspend ratio (actual / floor) */
  overspendRatio: number;
  /** Floor spending per capita */
  floorSpendingPerCapita: number;
  /** Top efficient countries with their data */
  topCountries: Array<{
    name: string;
    spendingPerCapita: number;
    outcome: number;
  }>;
}

/**
 * Convert OBG's canonical EfficiencyAnalysis into the simplified
 * EfficiencyEvidence used for Gemini prompt construction.
 */
export function toEfficiencyEvidence(
  analysis: EfficiencyAnalysis,
  category: string,
): EfficiencyEvidence {
  return {
    category,
    usSpendingPerCapita: analysis.spending,
    usOutcome: analysis.outcome,
    outcomeName: analysis.outcomeName,
    usRank: analysis.rank,
    totalCountries: analysis.totalCountries,
    overspendRatio: analysis.overspendRatio,
    floorSpendingPerCapita: analysis.floorSpending,
    topCountries: analysis.topEfficient.map(c => ({
      name: c.name,
      spendingPerCapita: c.spending,
      outcome: c.outcome,
    })),
  };
}

export interface PolicyExemplarInput {
  name: string;
  originCountry: string;
  description: string;
  yearImplemented: number;
  adaptationNotes: string;
}

export interface GroundingSource {
  url: string;
  domain: string;
}

export interface CitedClaim {
  text: string;
  sourceIndices: number[];
  confidence: number[];
}

export interface LegislationDraft {
  /** The drafted legislation text (markdown) */
  legislationText: string;
  /** Executive summary */
  summary: string;
  /** Sources from Google Search grounding */
  sources: GroundingSource[];
  /** Inline citation mapping */
  citations: CitedClaim[];
  /** Search queries Gemini executed */
  searchQueries: string[];
  /** The prompt that was sent */
  prompt: string;
  /** Category this legislation addresses */
  category: string;
  /** Google Search branding HTML (required by ToS to render) */
  searchBrandingHtml: string;
}

export interface DraftLegislationOptions {
  apiKey?: string;
  model?: string;
  /** Target jurisdiction (default: "United States") */
  targetJurisdiction?: string;
}

// ─── Prompt Construction ────────────────────────────────────────────

function buildPrompt(
  evidence: EfficiencyEvidence,
  exemplars: PolicyExemplarInput[],
  targetJurisdiction: string,
): string {
  const countryList = evidence.topCountries
    .map(c => `${c.name}: $${c.spendingPerCapita}/cap, ${evidence.outcomeName} ${c.outcome}`)
    .join('\n    ');

  const exemplarList = exemplars.length > 0
    ? exemplars.map(e =>
        `- ${e.name} (${e.originCountry}, ${e.yearImplemented}): ${e.description}\n` +
        `  Adaptation notes: ${e.adaptationNotes}`
      ).join('\n')
    : 'No specific exemplars available — research the best-performing countries\' policies.';

  return `You are a nonpartisan policy analyst drafting model legislation for ${targetJurisdiction}.

## EVIDENCE: ${evidence.category} Spending Efficiency

The ${targetJurisdiction} ranks **${evidence.usRank} out of ${evidence.totalCountries}** OECD countries in ${evidence.category.toLowerCase()} spending efficiency.

- **${targetJurisdiction}**: $${evidence.usSpendingPerCapita}/capita → ${evidence.outcomeName}: ${evidence.usOutcome}
- **Overspend ratio**: ${evidence.overspendRatio}x (spending ${evidence.overspendRatio}x more than the minimum level needed for comparable outcomes)
- **Floor spending**: $${evidence.floorSpendingPerCapita}/capita (lowest spending that achieves comparable outcomes)

**Top-performing countries** (better outcomes, lower cost):
    ${countryList}

## KNOWN POLICY EXEMPLARS

${exemplarList}

## YOUR TASK

Research what specific policies, regulations, and institutional structures the top-performing countries use that enable them to achieve better ${evidence.outcomeName.toLowerCase()} outcomes at lower cost. Then draft model legislation for ${targetJurisdiction} that adapts these evidence-based approaches.

### Required sections in the legislation:

1. **FINDINGS** — Cite specific data comparing ${targetJurisdiction} to the top-performing countries. Include spending levels, outcomes, and the efficiency gap. Reference real studies, government reports, and international evaluations.

2. **PURPOSE** — State the goal: achieve outcomes comparable to [best country] while reducing per-capita spending from $${evidence.usSpendingPerCapita} toward the efficient floor of $${evidence.floorSpendingPerCapita}.

3. **KEY PROVISIONS** — For each major policy mechanism:
   - What it does (modeled on which country's approach)
   - How it works operationally
   - Expected impact (cite evidence from the source country)
   - Implementation timeline

4. **FISCAL IMPACT** — Estimate savings based on moving toward the efficient floor. Current overspend: ${evidence.overspendRatio}x.

5. **IMPLEMENTATION TIMELINE** — Phased rollout (pilot → scale).

6. **EVALUATION & SUNSET PROVISIONS** — This is critical. The legislation MUST include:
   - **BASELINE MEASUREMENT** (Section X01): Within 90 days of enactment, the GAO shall establish baseline measurements of (a) real after-tax median household income (source: Census/BLS) and (b) median healthy life expectancy at birth (source: CDC/NCHS). These are the ONLY two metrics that matter.
   - **REVIEW CADENCE** (Section X02): Biennial review by the GAO. Every 2 years, re-measure both metrics and compare to baseline. Publish results publicly.
   - **TARGET THRESHOLDS** (Section X03): Define specific expected improvements (e.g., "+0.5 pp/year income growth, +0.3 years HALE within 5 years"). Also define MINIMUM acceptable thresholds (50% of expected).
   - **HARD SUNSET** (Section X04): If BOTH metrics fail to meet MINIMUM thresholds by the second review (Year 4), the Act automatically expires unless renewed by a supermajority vote. This prevents zombie legislation.
   - **DATA COLLECTION MANDATE** (Section X05): Require the specific agencies to collect and publish the data needed for evaluation (median income annually from BLS, HALE annually from CDC, per-capita spending from OMB). All data must be publicly accessible.
   - **BENCHMARK JURISDICTIONS** (Section X06): Name 3-5 OECD countries as ongoing benchmarks. If benchmark countries continue to outperform the US on both metrics despite the reform, the review must explain why and recommend adjustments.

7. **EVIDENCE APPENDIX** — Summarize the cross-country evidence for each provision.

### REALLOCATION: Where should the savings go?

The savings from reducing ${evidence.category.toLowerCase()} overspend should fund evidence-based alternatives that directly improve ${evidence.outcomeName.toLowerCase()}. Consider:

- **Singapore-style healthcare** (if not already the category): Mandatory health savings accounts (Medisave) + catastrophic insurance (MediShield) + means-tested safety net (Medifund). Singapore achieves life expectancy 84.1 at 4% GDP vs US 76.9 at 17% GDP. The key is MARKET MECHANISMS with universal coverage — not single-payer, not the current US model. Price transparency, hospital competition, and co-payments keep costs down while mandatory savings ensure everyone is covered.

- **Universal Basic Income (UBI)**: Countries with stronger social safety nets consistently achieve higher life expectancy. A UBI funded by redirected overspend could eliminate poverty-driven health disparities. Research Alaska's Permanent Fund Dividend, Finland's UBI pilot, and GiveDirectly's evidence. A 0.5% transaction tax replacing the current welfare/IRS bureaucracy could fund UBI at the poverty line while simplifying government.

- **Pragmatic clinical trials**: The US spends $48B/yr on NIH but <10% goes to pragmatic trials. The UK's NIHR model produces actionable evidence at 1/10th the cost.

The legislation should include BOTH the spending reduction AND the reallocation mechanism. Don't just cut — redirect to what works.

### INTERMEDIATE METRICS & CAUSAL CHAINS

For each provision, don't just state the expected welfare improvement. Show the CAUSAL CHAIN with intermediate metrics that can be measured independently:

Example for healthcare reform:
  1. Price transparency mandate → **30% reduction in average procedure cost** (measurable: CMS price database)
  2. Lower costs → **15% increase in preventive care visits** (measurable: CDC BRFSS survey)
  3. More prevention → **20% reduction in preventable hospitalizations** (measurable: AHRQ PQI)
  4. Fewer preventable deaths → **+0.3 years median HALE** (measurable: CDC/NCHS)
  5. Lower healthcare spending → **+$2,100/yr after-tax median income** (measurable: Census CPS)

Each intermediate metric should:
- Be independently measurable with a named data source
- Have a specific threshold (number, not "improvement")
- Explain HOW it translates to the two ultimate metrics (income + HALE)
- Be included in the data collection mandates

### REPLACEMENT FRAMING: Name what you're replacing and the savings

Every provision MUST explicitly state:
- **REPLACES**: What existing program/policy/spending this replaces (name it specifically)
- **CURRENT COST**: What the replaced program costs today
- **NEW COST**: What the replacement costs
- **NET SAVINGS**: The difference
- **SAVINGS DESTINATION**: ALL net savings flow to the Optimization Dividend Pool (see below)

Do NOT frame this as "cutting" anything. Frame it as: "Replacing an inefficient system with a proven one, and returning the savings directly to citizens."

### UNIVERSAL DIVIDEND POOL

ALL net savings from every provision in this Act flow to a single "Optimization Dividend Pool" distributed equally to every adult citizen as a monthly payment. This is critical for political viability — every citizen has a direct financial incentive to support the reforms.

Calculate the projected per-person annual dividend:
  Dividend = (Total annual savings from all provisions) / (Adult US population ~258M)

Example: $601B military savings → $2,329/adult/year → $194/month per person

The dividend creates a constituency FOR reform. Instead of "the government is cutting programs," the message is "you get a check every month because we stopped overpaying."

**CITIZEN CHOICE PROVISION**: Every citizen receiving the Optimization Dividend may redirect any portion of their payment to any federal budget category of their choosing. This is a simple opt-in on their Treasury account: "Redirect X% of my dividend to [Defense / Healthcare / Education / etc.]". Default = receive the full cash payment.

This eliminates the strongest political objection: "But I liked the old program!" Fine — donate your savings back to it. If enough people do, the program effectively continues via voluntary funding. If they don't, it proves citizens prefer cash over the inefficient program. This is the free market applied to government spending: revealed preference through voluntary allocation, not politicians deciding for you.

Implementation: Same infrastructure as the Presidential Election Campaign Fund checkbox on tax returns, but expanded to all budget categories. Citizens can change their allocation quarterly via IRS.gov or Treasury Direct.

### Style requirements:
- Use actual legislative formatting (Section numbers, subsections)
- Be specific — name the exact mechanisms, not vague principles
- Every factual claim must be researchable and grounded in real data
- Include both the policy mechanism AND the institutional structure needed
- Address likely objections with counter-evidence from countries that succeeded
- For healthcare provisions, ALWAYS research and reference Singapore's 3M system as the primary model — it uses market competition, not government monopoly, to achieve the world's best cost-efficiency`;
}

// ─── Core Function ──────────────────────────────────────────────────

/**
 * Draft model legislation using Gemini with Google Search grounding.
 *
 * Gemini researches the specific policies used by efficient countries
 * and drafts legislation with inline citations and source URLs.
 */
export async function draftLegislation(
  evidence: EfficiencyEvidence,
  exemplars: PolicyExemplarInput[],
  options: DraftLegislationOptions = {},
): Promise<LegislationDraft> {
  const apiKey = resolveGeminiApiKey(options.apiKey);
  const model = options.model ?? 'gemini-2.5-flash';
  const targetJurisdiction = options.targetJurisdiction ?? 'United States';

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(evidence, exemplars, targetJurisdiction);

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  // Extract text — in @google/genai v1.x+ `text` is a getter property
  const text = response.text ?? '';

  // Extract grounding metadata
  // Access grounding metadata from the raw response.
  // The @google/genai SDK types don't expose groundingMetadata directly,
  // so we cast through unknown to access the underlying response structure.
  const raw = response as unknown as {
    candidates?: Array<{
      groundingMetadata?: {
        webSearchQueries?: string[];
        searchEntryPoint?: { renderedContent?: string };
        groundingChunks?: Array<{ web?: { uri: string; title: string } }>;
        groundingSupports?: Array<{
          segment?: { startIndex: number; endIndex: number; text: string };
          groundingChunkIndices?: number[];
          confidenceScores?: number[];
        }>;
      };
    }>;
  };
  const candidate = raw.candidates;

  const metadata = candidate?.[0]?.groundingMetadata;

  const sources: GroundingSource[] = (metadata?.groundingChunks ?? [])
    .filter(c => c.web)
    .map(c => ({
      url: c.web!.uri,
      domain: c.web!.title,
    }));

  const citations: CitedClaim[] = (metadata?.groundingSupports ?? [])
    .filter(s => s.segment?.text)
    .map(s => ({
      text: s.segment!.text,
      sourceIndices: s.groundingChunkIndices ?? [],
      confidence: s.confidenceScores ?? [],
    }));

  const searchQueries = metadata?.webSearchQueries ?? [];
  const searchBrandingHtml = metadata?.searchEntryPoint?.renderedContent ?? '';

  // Extract summary (first paragraph or section)
  const summaryMatch = text.match(/^(.+?)(?:\n\n|\n#)/s);
  const summary = summaryMatch?.[1]?.trim() ?? text.slice(0, 500);

  return {
    legislationText: text,
    summary,
    sources,
    citations,
    searchQueries,
    prompt,
    category: evidence.category,
    searchBrandingHtml,
  };
}

// ─── Batch Helper ───────────────────────────────────────────────────

/**
 * Draft legislation for multiple budget categories.
 * Processes sequentially to respect API rate limits.
 */
export async function draftLegislationBatch(
  evidenceItems: EfficiencyEvidence[],
  exemplarsByCategory: Record<string, PolicyExemplarInput[]>,
  options: DraftLegislationOptions = {},
): Promise<LegislationDraft[]> {
  const results: LegislationDraft[] = [];

  for (const evidence of evidenceItems) {
    const exemplars = exemplarsByCategory[evidence.category] ?? [];
    const draft = await draftLegislation(evidence, exemplars, options);
    results.push(draft);
  }

  return results;
}

// ─── Citation Insertion Helper ──────────────────────────────────────

/**
 * Insert markdown citation links into the legislation text.
 * Returns the text with [1], [2], etc. appended to cited passages.
 */
export function insertCitations(draft: LegislationDraft): string {
  let text = draft.legislationText;

  // Sort descending by end index to avoid shifting positions
  const sorted = [...draft.citations]
    .filter(c => c.sourceIndices.length > 0)
    .sort((a, b) => {
      const aEnd = text.indexOf(a.text) + a.text.length;
      const bEnd = text.indexOf(b.text) + b.text.length;
      return bEnd - aEnd;
    });

  for (const citation of sorted) {
    const idx = text.indexOf(citation.text);
    if (idx === -1) continue;

    const endIdx = idx + citation.text.length;
    const refs = citation.sourceIndices
      .map(i => {
        const source = draft.sources[i];
        return source ? `[${i + 1}](${source.url})` : null;
      })
      .filter(Boolean);

    if (refs.length > 0) {
      text = text.slice(0, endIdx) + ' ' + refs.join(' ') + text.slice(endIdx);
    }
  }

  return text;
}

/**
 * Generate a source footnotes section for the legislation.
 */
export function generateSourceFootnotes(draft: LegislationDraft): string {
  if (draft.sources.length === 0) return '';

  const lines = ['## Sources\n'];
  for (let i = 0; i < draft.sources.length; i++) {
    const s = draft.sources[i]!;
    lines.push(`${i + 1}. [${s.domain}](${s.url})`);
  }
  return lines.join('\n');
}
