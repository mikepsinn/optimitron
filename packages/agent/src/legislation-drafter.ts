/**
 * Legislation Drafter — structured Google Search-grounded legislation research
 *
 * The pipeline:
 * 1. Efficient frontier identifies best-performing countries per category
 * 2. Policy exemplars provide the framing context
 * 3. Gemini with Google Search returns a structured research packet
 * 4. Code renders the final markdown from that packet
 */

import { z } from 'zod';
import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai';
import {
  parseJsonResponse,
  resolveGeminiApiKey,
  responseText,
} from './gemini.js';
import type { EfficiencyAnalysis } from '@optimitron/obg';
import {
  renderLegislationEvidenceBundle,
  type LegislationEvidenceBundle,
} from './legislation-evidence.js';

const DEFAULT_LEGISLATION_RESEARCH_MODEL =
  process.env['LEGISLATION_DRAFT_MODEL'] ?? 'gemini-3.1-pro-preview';

// ─── Types ──────────────────────────────────────────────────────────

/** Efficiency evidence for a budget category — just EfficiencyAnalysis + category name */
export type EfficiencyEvidence = EfficiencyAnalysis & { category: string };

export interface PolicyExemplarInput {
  name: string;
  originCountry: string;
  description: string;
  yearImplemented: number;
  adaptationNotes: string;
}

export type WishoniaSavingsDisposition =
  | 'optimization_dividend'
  | 'implementation_then_dividend'
  | 'public_goods_exception';

export interface WishoniaLegislativeAgencyContext {
  id: string;
  dName: string;
  role: 'primary' | 'supporting';
  relevance: string;
  replacesAgencyName: string;
  tagline: string;
  description: string;
  optimalMetrics: string[];
  codeHeader: string;
  codeExplanation: string;
  annualSavings?: string;
  savingsComparison?: string;
}

export interface WishoniaLegislativePromptContext {
  packageId: string;
  packageTitle: string;
  shortDescription: string;
  citizenBenefit: string;
  defaultSavingsDisposition: WishoniaSavingsDisposition;
  scopeGuardrails: string[];
  draftingDirectives: string[];
  agencies: WishoniaLegislativeAgencyContext[];
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

export interface LegislationResearchNote {
  title: string;
  body: string;
  sourceUrls: string[];
}

export interface LegislationResearchMetric {
  metric: string;
  target: string;
  rationale: string;
  sourceUrls: string[];
}

export interface LegislationResearchObjection {
  objection: string;
  response: string;
  sourceUrls: string[];
}

export type LegislationParetoStatus =
  | 'strict_pareto'
  | 'compensated_pareto'
  | 'public_goods_exception';

export interface LegislationParetoAnalysis {
  status: LegislationParetoStatus;
  summary: string;
  likelyLosers: string[];
  compensationMechanism: string;
  sourceUrls: string[];
}

export interface LegislationResearchProvision {
  title: string;
  modeledOn: string[];
  summary: string;
  sourceUrls: string[];
  marketMechanism: string;
  publicGoodsJustification: string;
  publicChoiceRationale: string;
  paretoStatus: LegislationParetoStatus;
  paretoRationale: string;
  compensationMechanism: string;
  residualRentHandling: string;
  captureRisks: string[];
  antiCaptureSafeguards: string[];
  corruptionRisks: string[];
  antiCorruptionSafeguards: string[];
  operativeClauses: string[];
  implementationTimeline: string;
  currentCost?: string;
  newCost?: string;
  netSavings?: string;
  savingsDestination?: string;
  expectedImpacts: LegislationResearchMetric[];
  objections: LegislationResearchObjection[];
}

export interface LegislationResearchPacket {
  billTitle: string;
  billSummary: string;
  purpose: string;
  findings: LegislationResearchNote[];
  keyProvisions: LegislationResearchProvision[];
  publicGoodsAndMarketFramework: LegislationResearchNote[];
  publicChoiceAndCapture: LegislationResearchNote[];
  paretoAndCompensation: LegislationParetoAnalysis[];
  reallocationPlan: LegislationResearchNote[];
  fiscalImpact: LegislationResearchNote[];
  implementationTimeline: LegislationResearchNote[];
  evaluationAndSunset: LegislationResearchMetric[];
  evidenceAppendix: LegislationResearchNote[];
  openQuestions: string[];
}

export interface LegislationDraft {
  /** The drafted legislation text (markdown) */
  legislationText: string;
  /** Executive summary */
  summary: string;
  /** Title for the draft */
  billTitle: string;
  /** Sources referenced by the rendered draft */
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
  /** The structured research packet used to render the markdown */
  researchPacket: LegislationResearchPacket;
  /** Research model used for the structured search-grounded packet */
  researchModel: string;
}

export interface GroundedGeminiResponseLike {
  text?: string | (() => string);
  functionCalls?: Array<{
    args?: Record<string, unknown>;
    name?: string;
  }>;
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
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
}

export interface GroundedGeminiClientLike {
  models: {
    generateContent(input: {
      model: string;
      contents: string;
      config: {
        maxOutputTokens?: number;
        temperature?: number;
        responseMimeType?: 'application/json';
        responseJsonSchema?: Record<string, unknown>;
        tools?: Array<Record<string, unknown>>;
        toolConfig?: {
          includeServerSideToolInvocations?: boolean;
          functionCallingConfig?: {
            mode?: FunctionCallingConfigMode;
          };
        };
      };
    }): Promise<GroundedGeminiResponseLike>;
  };
}

export interface DraftLegislationOptions {
  apiKey?: string;
  model?: string;
  /** Target jurisdiction (default: "United States") */
  targetJurisdiction?: string;
  /** Structured evidence bundle synthesized from the Optimitron parameter corpus */
  evidenceBundle?: LegislationEvidenceBundle;
  /** Optional Wishonia bill-family context used as a drafting constraint */
  wishoniaContext?: WishoniaLegislativePromptContext;
  /** Injected client for testing or custom transport */
  client?: GroundedGeminiClientLike;
}

const ResearchNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  sourceUrls: z.array(z.string().url()).min(1),
});

const ResearchMetricSchema = z.object({
  metric: z.string().min(1),
  target: z.string().min(1),
  rationale: z.string().min(1),
  sourceUrls: z.array(z.string().url()).min(1),
});

const ResearchObjectionSchema = z.object({
  objection: z.string().min(1),
  response: z.string().min(1),
  sourceUrls: z.array(z.string().url()).min(1),
});

const ParetoStatusSchema = z.enum([
  'strict_pareto',
  'compensated_pareto',
  'public_goods_exception',
]);

const ParetoAnalysisSchema = z.object({
  status: ParetoStatusSchema,
  summary: z.string().min(1),
  likelyLosers: z.array(z.string().min(1)).default([]),
  compensationMechanism: z.string().min(1),
  sourceUrls: z.array(z.string().url()).min(1),
});

const ResearchProvisionSchema = z.object({
  title: z.string().min(1),
  modeledOn: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1),
  sourceUrls: z.array(z.string().url()).min(1),
  marketMechanism: z.string().min(1),
  publicGoodsJustification: z.string().min(1),
  publicChoiceRationale: z.string().min(1),
  paretoStatus: ParetoStatusSchema,
  paretoRationale: z.string().min(1),
  compensationMechanism: z.string().min(1),
  residualRentHandling: z.string().min(1),
  captureRisks: z.array(z.string().min(1)).min(1),
  antiCaptureSafeguards: z.array(z.string().min(1)).min(2),
  corruptionRisks: z.array(z.string().min(1)).min(1),
  antiCorruptionSafeguards: z.array(z.string().min(1)).min(2),
  operativeClauses: z.array(z.string().min(1)).min(1),
  implementationTimeline: z.string().min(1),
  currentCost: z.string().min(1).optional(),
  newCost: z.string().min(1).optional(),
  netSavings: z.string().min(1).optional(),
  savingsDestination: z.string().min(1).optional(),
  expectedImpacts: z.array(ResearchMetricSchema).min(1),
  objections: z.array(ResearchObjectionSchema).default([]),
});

const LegislationResearchPacketSchema = z.object({
  billTitle: z.string().min(1),
  billSummary: z.string().min(1),
  purpose: z.string().min(1),
  findings: z.array(ResearchNoteSchema).min(3),
  keyProvisions: z.array(ResearchProvisionSchema).min(2),
  publicGoodsAndMarketFramework: z.array(ResearchNoteSchema).min(1),
  publicChoiceAndCapture: z.array(ResearchNoteSchema).min(1),
  paretoAndCompensation: z.array(ParetoAnalysisSchema).min(1),
  reallocationPlan: z.array(ResearchNoteSchema).min(1),
  fiscalImpact: z.array(ResearchNoteSchema).min(1),
  implementationTimeline: z.array(ResearchNoteSchema).min(1),
  evaluationAndSunset: z.array(ResearchMetricSchema).min(3),
  evidenceAppendix: z.array(ResearchNoteSchema).min(3),
  openQuestions: z.array(z.string().min(1)).default([]),
});

const ResearchNoteJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'body', 'sourceUrls'],
  properties: {
    title: { type: 'string' },
    body: { type: 'string' },
    sourceUrls: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
  },
};

const ResearchMetricJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['metric', 'target', 'rationale', 'sourceUrls'],
  properties: {
    metric: { type: 'string' },
    target: { type: 'string' },
    rationale: { type: 'string' },
    sourceUrls: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
  },
};

const ResearchObjectionJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['objection', 'response', 'sourceUrls'],
  properties: {
    objection: { type: 'string' },
    response: { type: 'string' },
    sourceUrls: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
  },
};

const ParetoAnalysisJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status',
    'summary',
    'likelyLosers',
    'compensationMechanism',
    'sourceUrls',
  ],
  properties: {
    status: {
      type: 'string',
      enum: ['strict_pareto', 'compensated_pareto', 'public_goods_exception'],
    },
    summary: { type: 'string' },
    likelyLosers: {
      type: 'array',
      items: { type: 'string' },
    },
    compensationMechanism: { type: 'string' },
    sourceUrls: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
  },
};

const ResearchProvisionJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'modeledOn',
    'summary',
    'sourceUrls',
    'marketMechanism',
    'publicGoodsJustification',
    'publicChoiceRationale',
    'paretoStatus',
    'paretoRationale',
    'compensationMechanism',
    'residualRentHandling',
    'captureRisks',
    'antiCaptureSafeguards',
    'corruptionRisks',
    'antiCorruptionSafeguards',
    'operativeClauses',
    'implementationTimeline',
    'expectedImpacts',
    'objections',
  ],
  properties: {
    title: { type: 'string' },
    modeledOn: {
      type: 'array',
      items: { type: 'string' },
    },
    summary: { type: 'string' },
    sourceUrls: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
    marketMechanism: { type: 'string' },
    publicGoodsJustification: { type: 'string' },
    publicChoiceRationale: { type: 'string' },
    paretoStatus: {
      type: 'string',
      enum: ['strict_pareto', 'compensated_pareto', 'public_goods_exception'],
    },
    paretoRationale: { type: 'string' },
    compensationMechanism: { type: 'string' },
    residualRentHandling: { type: 'string' },
    captureRisks: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
    antiCaptureSafeguards: {
      type: 'array',
      minItems: 2,
      items: { type: 'string' },
    },
    corruptionRisks: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
    antiCorruptionSafeguards: {
      type: 'array',
      minItems: 2,
      items: { type: 'string' },
    },
    operativeClauses: {
      type: 'array',
      minItems: 1,
      items: { type: 'string' },
    },
    implementationTimeline: { type: 'string' },
    currentCost: { type: 'string' },
    newCost: { type: 'string' },
    netSavings: { type: 'string' },
    savingsDestination: { type: 'string' },
    expectedImpacts: {
      type: 'array',
      minItems: 1,
      items: ResearchMetricJsonSchema,
    },
    objections: {
      type: 'array',
      items: ResearchObjectionJsonSchema,
    },
  },
};

const LEGISLATION_RESEARCH_PACKET_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'billTitle',
    'billSummary',
    'purpose',
    'findings',
    'keyProvisions',
    'publicGoodsAndMarketFramework',
    'publicChoiceAndCapture',
    'paretoAndCompensation',
    'reallocationPlan',
    'fiscalImpact',
    'implementationTimeline',
    'evaluationAndSunset',
    'evidenceAppendix',
    'openQuestions',
  ],
  properties: {
    billTitle: { type: 'string' },
    billSummary: { type: 'string' },
    purpose: { type: 'string' },
    findings: {
      type: 'array',
      minItems: 3,
      items: ResearchNoteJsonSchema,
    },
    keyProvisions: {
      type: 'array',
      minItems: 2,
      items: ResearchProvisionJsonSchema,
    },
    publicGoodsAndMarketFramework: {
      type: 'array',
      minItems: 1,
      items: ResearchNoteJsonSchema,
    },
    publicChoiceAndCapture: {
      type: 'array',
      minItems: 1,
      items: ResearchNoteJsonSchema,
    },
    paretoAndCompensation: {
      type: 'array',
      minItems: 1,
      items: ParetoAnalysisJsonSchema,
    },
    reallocationPlan: {
      type: 'array',
      minItems: 1,
      items: ResearchNoteJsonSchema,
    },
    fiscalImpact: {
      type: 'array',
      minItems: 1,
      items: ResearchNoteJsonSchema,
    },
    implementationTimeline: {
      type: 'array',
      minItems: 1,
      items: ResearchNoteJsonSchema,
    },
    evaluationAndSunset: {
      type: 'array',
      minItems: 3,
      items: ResearchMetricJsonSchema,
    },
    evidenceAppendix: {
      type: 'array',
      minItems: 3,
      items: ResearchNoteJsonSchema,
    },
    openQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

// ─── Prompt Construction ────────────────────────────────────────────

function renderWishoniaLegislativeContext(
  wishoniaContext?: WishoniaLegislativePromptContext,
): string {
  if (!wishoniaContext) {
    return '## WISHONIA LEGISLATIVE PACKAGE CONTEXT\n\nNo Wishonia package context was provided.';
  }

  const guardrails = wishoniaContext.scopeGuardrails.map(rule => `- ${rule}`).join('\n');
  const directives = wishoniaContext.draftingDirectives
    .map(rule => `- ${rule}`)
    .join('\n');
  const agencies = wishoniaContext.agencies
    .map((agency) => {
      const optimalMetrics = agency.optimalMetrics.slice(0, 2).join('; ');
      const savingsNote = agency.annualSavings
        ? ` Annual savings framing: ${agency.annualSavings}.`
        : '';

      return [
        `- ${agency.id} / ${agency.dName} (${agency.role})`,
        `  Replaces: ${agency.replacesAgencyName}`,
        `  Why relevant: ${agency.relevance}`,
        `  Citizen hook: ${agency.tagline}`,
        `  Optimizes for: ${optimalMetrics}`,
        `  Mechanism pattern: ${agency.codeHeader} — ${agency.codeExplanation}${savingsNote}`,
      ].join('\n');
    })
    .join('\n');

  return `## WISHONIA LEGISLATIVE PACKAGE CONTEXT

Package: ${wishoniaContext.packageTitle} (${wishoniaContext.packageId})
Summary: ${wishoniaContext.shortDescription}
Citizen benefit: ${wishoniaContext.citizenBenefit}
Default savings disposition: ${wishoniaContext.defaultSavingsDisposition}

Scope guardrails:
${guardrails}

Drafting directives:
${directives}

Relevant Wishonia agencies:
${agencies}`;
}

function buildResearchPrompt(
  evidence: EfficiencyEvidence,
  exemplars: PolicyExemplarInput[],
  targetJurisdiction: string,
  evidenceBundle?: LegislationEvidenceBundle,
  wishoniaContext?: WishoniaLegislativePromptContext,
): string {
  const countryList = evidence.topEfficient
    .map((c: { name: string; spendingPerCapita: number; outcome: number }) =>
      `${c.name}: $${c.spendingPerCapita}/cap, ${evidence.outcomeName} ${c.outcome}`
    )
    .join('\n    ');

  const exemplarList = exemplars.length > 0
    ? exemplars.map(e =>
        `- ${e.name} (${e.originCountry}, ${e.yearImplemented}): ${e.description}\n` +
        `  Adaptation notes: ${e.adaptationNotes}`
      ).join('\n')
    : 'No specific exemplars available — research the best-performing countries\' policies.';

  const structuredEvidence = evidenceBundle
    ? renderLegislationEvidenceBundle(evidenceBundle)
    : 'No structured internal evidence bundle was provided. Use search-grounded external evidence only.';

  const wishoniaContextBlock = renderWishoniaLegislativeContext(wishoniaContext);

  return `You are a nonpartisan policy analyst preparing a structured legislation research packet for ${targetJurisdiction}.

## EVIDENCE: ${evidence.category} Spending Efficiency

The ${targetJurisdiction} ranks **${evidence.rank} out of ${evidence.totalCountries}** OECD countries in ${evidence.category.toLowerCase()} spending efficiency.

- **${targetJurisdiction}**: $${evidence.spendingPerCapita}/capita -> ${evidence.outcomeName}: ${evidence.outcome}
- **Best comparator**: ${evidence.bestCountry.name} at $${evidence.bestCountry.spendingPerCapita}/capita -> ${evidence.outcomeName}: ${evidence.bestCountry.outcome}
- **Overspend ratio**: ${evidence.overspendRatio}x
- **Floor spending**: $${evidence.floorSpendingPerCapita}/capita

**Top-performing countries**:
    ${countryList}

## KNOWN POLICY EXEMPLARS

${exemplarList}

${wishoniaContextBlock}

${structuredEvidence}

## TASK

Return ONLY valid JSON matching the schema. Do not include markdown fences.

Build a structured legislation research packet for a bill that:
- achieves outcomes closer to ${evidence.bestCountry.name}
- replaces inefficient spending with evidence-backed institutions
- stays centered on ${evidence.category.toLowerCase()} rather than turning into a generic reallocation manifesto
- includes a short savings-disposition rule, evaluation, and sunset provisions
- uses unconventional but defensible policy ideas when the evidence supports them

Hard rules:
- Use Google Search grounding to support public-facing factual claims.
- Every item in findings, provisions, fiscalImpact, implementationTimeline, evaluationAndSunset, and evidenceAppendix must include sourceUrls with real URLs.
- If a claim cannot be supported, omit it instead of guessing.
- Do not output placeholders like [from prompt], [best country], TODO, or TBD.

Source quality rules:
- Cite primary sources: peer-reviewed papers, government databases (OECD, CBO, GAO, WHO, CDC), and official reports. Avoid secondary news articles, advocacy sites, and NGO pages unless they are the original publisher of the data.
- Every quantitative claim (percentages, dollar amounts, ratios, rankings) must be directly stated in the cited source. Do not extrapolate, round up, or combine numbers from different sources to produce a new statistic.
- If the exact number is uncertain, use qualifiers like "approximately", "at least", or cite a range rather than asserting false precision.
- Do not cite URLs that require login, are paywalled without abstract, or are internal project URLs (e.g. warondisease.org, manual.warondisease.org).
- Each provision's sourceUrls should contain only the 1-3 most relevant sources for that specific provision, not every source from the entire packet. Quality over quantity.
- Keep operativeClauses short, statutory-style, and implementation-specific.
- Keep the bill understandable to a normal citizen: plain English, short sentences, and minimal jargon.
- Keep the bill concise: one short summary paragraph, a small number of core provisions, and no sprawling side quests.
- The first provision must directly reform ${evidence.category.toLowerCase()} institutions.
- Use the internal evidence bundle for hypotheses and neglected opportunities, but only include them when you can defend them in the packet.
- If the evidence for a radical allocation target is incomplete, state the direction of change without pretending precision you cannot support.
- Prefer market pricing, competition, auctions, user fees, vouchers, open protocols, and automatic rules over discretionary bureaucracy wherever possible.
- Only justify tax funding for genuine public goods, natural-monopoly infrastructure, externality correction, or other clearly demonstrated market failures.
- Apply public choice theory explicitly: assume agencies, contractors, incumbents, and politicians respond to incentives and may seek rents, budget growth, or discretion.
- Do not claim literal immunity to capture or corruption. Instead, identify the likely failure modes and design hard safeguards that minimize, expose, cap, or automatically punish them.
- For each provision, specify whether it is strict_pareto, compensated_pareto, or a public_goods_exception.
- Do not label a provision strict_pareto unless you can explain why no identifiable group is made worse off.
- If some group is likely to lose, use compensationMechanism to make the trade explicit.
- If corruption or private rents cannot be eliminated, use residualRentHandling to make them transparent, rule-bound, openly competed, capped, and auditable in the style of incentive alignment bonds rather than hidden regulatory privilege.
- Treat Wishonia package context as institutional inspiration and scope guardrails, not as permission to change the subject of the bill.
- Default to Optimization Dividend as the destination for verified net savings after transition and implementation costs unless a narrow public-goods exception is necessary and explicitly justified.

The packet should emphasize:
- quantified efficiency gaps
- institutional mechanisms used by better-performing countries
- category-faithful core reforms before any downstream savings disposition
- short, legible citizen benefits tied to the bill's own category
- measurable causal chains tying reforms to median income and healthy life expectancy
- why the bill satisfies a public-goods test
- why the design is robust to capture, corruption, and concentrated-interest sabotage`;
}

function getGroundingMetadata(response: GroundedGeminiResponseLike) {
  return response.candidates?.[0]?.groundingMetadata;
}

function buildGroundedGeminiClient(apiKey: string): GroundedGeminiClientLike {
  return new GoogleGenAI({ apiKey }) as unknown as GroundedGeminiClientLike;
}

function shouldRetryProviderError(error: unknown): boolean {
  return error instanceof Error && /503|unavailable|high demand|overloaded/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

async function generateContentWithRetry(
  client: GroundedGeminiClientLike,
  input: Parameters<GroundedGeminiClientLike['models']['generateContent']>[0],
): Promise<GroundedGeminiResponseLike> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await client.models.generateContent(input);
    } catch (error) {
      lastError = error;

      if (!shouldRetryProviderError(error) || attempt === 3) {
        break;
      }

      await sleep(1500 * attempt);
    }
  }

  throw lastError;
}

function shouldRetryStructuredResearch(error: unknown, explicitModel: boolean): boolean {
  if (explicitModel || !(error instanceof Error)) {
    return false;
  }

  return /function|tool|ground|search|schema|parse/i.test(error.message);
}

function getResearchPacketArgs(
  response: GroundedGeminiResponseLike,
): Record<string, unknown> {
  const functionCall = response.functionCalls?.find(
    call => call.name === 'submit_legislation_research_packet' && call.args,
  );

  if (!functionCall?.args) {
    throw new Error(
      'Gemini did not return submit_legislation_research_packet function arguments',
    );
  }

  return functionCall.args;
}

async function generateLegislationResearchPacket(
  client: GroundedGeminiClientLike,
  model: string,
  prompt: string,
): Promise<{
  packet: LegislationResearchPacket;
  response: GroundedGeminiResponseLike;
}> {
  try {
    const response = await generateContentWithRetry(client, {
      model,
      contents: prompt,
      config: {
        tools: [
          { googleSearch: {} },
          {
            functionDeclarations: [{
              name: 'submit_legislation_research_packet',
              description: 'Return the full legislation research packet as structured data.',
              parametersJsonSchema: LEGISLATION_RESEARCH_PACKET_JSON_SCHEMA,
            }],
          },
        ],
        toolConfig: {
          includeServerSideToolInvocations: true,
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.VALIDATED,
          },
        },
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    return {
      packet: LegislationResearchPacketSchema.parse(
        getResearchPacketArgs(response),
      ),
      response,
    };
  } catch (functionCallError) {
    try {
      const response = await generateContentWithRetry(client, {
        model,
        contents: `${prompt}\n\nCall submit_legislation_research_packet with the full packet. Do not answer in prose.`,
        config: {
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [{
                name: 'submit_legislation_research_packet',
                description: 'Return the full legislation research packet as structured data.',
                parametersJsonSchema: LEGISLATION_RESEARCH_PACKET_JSON_SCHEMA,
              }],
            },
          ],
          toolConfig: {
            includeServerSideToolInvocations: true,
          },
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      return {
        packet: LegislationResearchPacketSchema.parse(
          getResearchPacketArgs(response),
        ),
        response,
      };
    } catch (secondaryFunctionCallError) {
      const response = await generateContentWithRetry(client, {
        model,
        contents: `${prompt}\n\nReturn valid JSON only. Do not emit prose outside the JSON object.`,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseJsonSchema: LEGISLATION_RESEARCH_PACKET_JSON_SCHEMA,
        },
      });

      try {
        return {
          packet: LegislationResearchPacketSchema.parse(
            parseJsonResponse(responseText(response)),
          ),
          response,
        };
      } catch (jsonError) {
        if (jsonError instanceof Error) {
          const context = [
            functionCallError instanceof Error
              ? `validated function-call attempt failed: ${functionCallError.message}`
              : null,
            secondaryFunctionCallError instanceof Error
              ? `default function-call attempt failed: ${secondaryFunctionCallError.message}`
              : null,
          ]
            .filter(Boolean)
            .join('; ');

          if (context.length > 0) {
            jsonError.message = `${jsonError.message}; ${context}`;
          }
        }

        throw jsonError;
      }
    }
  }
}

function toDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normalizeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    const cleanedUrl = url
      .trim()
      .replace(/##+/g, '#')
      .replace(/(?<!:)\/+$/g, '');

    if (seen.has(cleanedUrl)) {
      continue;
    }

    seen.add(cleanedUrl);
    normalized.push(cleanedUrl);
  }

  return normalized;
}

function collectPacketUrls(packet: LegislationResearchPacket): string[] {
  const urls: string[] = [];

  for (const note of [
    ...packet.findings,
    ...packet.publicGoodsAndMarketFramework,
    ...packet.publicChoiceAndCapture,
    ...packet.reallocationPlan,
    ...packet.fiscalImpact,
    ...packet.implementationTimeline,
    ...packet.evidenceAppendix,
  ]) {
    urls.push(...note.sourceUrls);
  }

  for (const metric of packet.evaluationAndSunset) {
    urls.push(...metric.sourceUrls);
  }

  for (const note of packet.paretoAndCompensation) {
    urls.push(...note.sourceUrls);
  }

  for (const provision of packet.keyProvisions) {
    urls.push(...provision.sourceUrls);
    for (const impact of provision.expectedImpacts) {
      urls.push(...impact.sourceUrls);
    }
    for (const objection of provision.objections) {
      urls.push(...objection.sourceUrls);
    }
  }

  return normalizeUrls(urls);
}

function buildSourceMap(packet: LegislationResearchPacket): {
  sources: GroundingSource[];
  sourceIndexByUrl: Map<string, number>;
} {
  const urls = collectPacketUrls(packet);
  const sourceIndexByUrl = new Map<string, number>();
  const sources = urls.map((url, index) => {
    sourceIndexByUrl.set(url, index);
    return {
      url,
      domain: toDomainLabel(url),
    };
  });

  return {
    sources,
    sourceIndexByUrl,
  };
}

function refsForUrls(urls: string[], sourceIndexByUrl: Map<string, number>): string {
  const refs = normalizeUrls(urls)
    .map(url => {
      const index = sourceIndexByUrl.get(url);
      if (index === undefined) {
        return null;
      }

      return `[${index + 1}](${url})`;
    })
    .filter((value): value is string => Boolean(value));

  return refs.length > 0 ? ` ${refs.join(' ')}` : '';
}

function noteToMarkdown(
  note: LegislationResearchNote,
  sourceIndexByUrl: Map<string, number>,
  citations: CitedClaim[],
): string {
  const refs = refsForUrls(note.sourceUrls, sourceIndexByUrl);
  const body = `${note.body}${refs}`;

  citations.push({
    text: note.body,
    sourceIndices: normalizeUrls(note.sourceUrls)
      .map(url => sourceIndexByUrl.get(url))
      .filter((value): value is number => value !== undefined),
    confidence: [],
  });

  return `- **${note.title}:** ${body}`;
}

function metricToMarkdown(
  metric: LegislationResearchMetric,
  sourceIndexByUrl: Map<string, number>,
  citations: CitedClaim[],
): string {
  const refs = refsForUrls(metric.sourceUrls, sourceIndexByUrl);
  const body = `${metric.target}. ${metric.rationale}${refs}`;

  citations.push({
    text: `${metric.metric}: ${metric.target}. ${metric.rationale}`,
    sourceIndices: normalizeUrls(metric.sourceUrls)
      .map(url => sourceIndexByUrl.get(url))
      .filter((value): value is number => value !== undefined),
    confidence: [],
  });

  return `- **${metric.metric}:** ${body}`;
}

function paretoStatusLabel(status: LegislationParetoStatus): string {
  switch (status) {
    case 'strict_pareto':
      return 'Strict Pareto';
    case 'compensated_pareto':
      return 'Compensated Pareto';
    case 'public_goods_exception':
      return 'Public-Goods Exception';
    default:
      return status;
  }
}

function paretoAnalysisToMarkdown(
  analysis: LegislationParetoAnalysis,
  sourceIndexByUrl: Map<string, number>,
  citations: CitedClaim[],
): string {
  const refs = refsForUrls(analysis.sourceUrls, sourceIndexByUrl);

  citations.push({
    text: `${analysis.summary} ${analysis.compensationMechanism}`,
    sourceIndices: normalizeUrls(analysis.sourceUrls)
      .map(url => sourceIndexByUrl.get(url))
      .filter((value): value is number => value !== undefined),
    confidence: [],
  });

  const losers = analysis.likelyLosers.length > 0
    ? ` Likely losers: ${analysis.likelyLosers.join(', ')}.`
    : '';

  return [
    `- **${paretoStatusLabel(analysis.status)}:** ${analysis.summary}${losers}${refs}`,
    `  **Compensation mechanism:** ${analysis.compensationMechanism}`,
  ].join('\n');
}

function provisionToMarkdown(
  provision: LegislationResearchProvision,
  sourceIndexByUrl: Map<string, number>,
  citations: CitedClaim[],
): string {
  const summaryRefs = refsForUrls(provision.sourceUrls, sourceIndexByUrl);
  const sourceIndices = normalizeUrls(provision.sourceUrls)
    .map(url => sourceIndexByUrl.get(url))
    .filter((value): value is number => value !== undefined);

  citations.push({
    text: provision.summary,
    sourceIndices,
    confidence: [],
  });

  const lines = [
    `### ${provision.title}`,
    '',
    `**Summary:** ${provision.summary}${summaryRefs}`,
  ];

  if (provision.modeledOn.length > 0) {
    lines.push(`**Modeled on:** ${provision.modeledOn.join(', ')}`);
  }

  lines.push('');
  lines.push(`**Market mechanism:** ${provision.marketMechanism}`);
  lines.push(`**Public-goods justification:** ${provision.publicGoodsJustification}`);
  lines.push(`**Public-choice rationale:** ${provision.publicChoiceRationale}`);
  lines.push(`**Pareto status:** ${paretoStatusLabel(provision.paretoStatus)}`);
  lines.push(`**Pareto rationale:** ${provision.paretoRationale}`);
  lines.push(`**Compensation mechanism:** ${provision.compensationMechanism}`);
  lines.push(`**Residual rent handling:** ${provision.residualRentHandling}`);

  if (provision.currentCost || provision.newCost || provision.netSavings) {
    lines.push('');
    lines.push('**Budget effects:**');
    if (provision.currentCost) {
      lines.push(`- Current cost: ${provision.currentCost}`);
    }
    if (provision.newCost) {
      lines.push(`- New cost: ${provision.newCost}`);
    }
    if (provision.netSavings) {
      lines.push(`- Net savings: ${provision.netSavings}`);
    }
    if (provision.savingsDestination) {
      lines.push(`- Savings destination: ${provision.savingsDestination}`);
    }
  }

  lines.push('');
  lines.push('**Capture risks:**');
  for (const risk of provision.captureRisks) {
    lines.push(`- ${risk}`);
  }

  lines.push('');
  lines.push('**Anti-capture safeguards:**');
  for (const safeguard of provision.antiCaptureSafeguards) {
    lines.push(`- ${safeguard}`);
  }

  lines.push('');
  lines.push('**Corruption risks:**');
  for (const risk of provision.corruptionRisks) {
    lines.push(`- ${risk}`);
  }

  lines.push('');
  lines.push('**Anti-corruption safeguards:**');
  for (const safeguard of provision.antiCorruptionSafeguards) {
    lines.push(`- ${safeguard}`);
  }

  lines.push('');
  lines.push('**Operative clauses:**');
  for (const clause of provision.operativeClauses) {
    lines.push(`- ${clause}`);
  }

  lines.push('');
  lines.push('**Expected impacts:**');
  for (const impact of provision.expectedImpacts) {
    lines.push(metricToMarkdown(impact, sourceIndexByUrl, citations));
  }

  lines.push('');
  lines.push(`**Implementation timeline:** ${provision.implementationTimeline}`);

  if (provision.objections.length > 0) {
    lines.push('');
    lines.push('**Objections and responses:**');
    for (const objection of provision.objections) {
      const refs = refsForUrls(objection.sourceUrls, sourceIndexByUrl);
      citations.push({
        text: `${objection.objection} ${objection.response}`,
        sourceIndices: normalizeUrls(objection.sourceUrls)
          .map(url => sourceIndexByUrl.get(url))
          .filter((value): value is number => value !== undefined),
        confidence: [],
      });
      lines.push(`- **Objection:** ${objection.objection}`);
      lines.push(`  **Response:** ${objection.response}${refs}`);
    }
  }

  return lines.join('\n');
}

export function renderLegislationResearchPacket(
  packet: LegislationResearchPacket,
): {
  markdown: string;
  sources: GroundingSource[];
  citations: CitedClaim[];
} {
  const { sources, sourceIndexByUrl } = buildSourceMap(packet);
  const citations: CitedClaim[] = [];

  const lines = [
    `> Proposed bill title: ${packet.billTitle}`,
    '',
    `## Summary`,
    '',
    packet.billSummary,
    '',
    `## Findings`,
    '',
    ...packet.findings.map(note => noteToMarkdown(note, sourceIndexByUrl, citations)),
    '',
    `## Purpose`,
    '',
    packet.purpose,
    '',
    `## Public-Goods and Market Framework`,
    '',
    ...packet.publicGoodsAndMarketFramework.map(
      note => noteToMarkdown(note, sourceIndexByUrl, citations),
    ),
    '',
    `## Public Choice / Capture Analysis`,
    '',
    ...packet.publicChoiceAndCapture.map(
      note => noteToMarkdown(note, sourceIndexByUrl, citations),
    ),
    '',
    `## Pareto / Compensation Analysis`,
    '',
    ...packet.paretoAndCompensation.map(
      analysis => paretoAnalysisToMarkdown(analysis, sourceIndexByUrl, citations),
    ),
    '',
    `## Key Provisions`,
    '',
    ...packet.keyProvisions.map(provision => provisionToMarkdown(provision, sourceIndexByUrl, citations)),
    '',
    `## Reallocation Plan`,
    '',
    ...packet.reallocationPlan.map(note => noteToMarkdown(note, sourceIndexByUrl, citations)),
    '',
    `## Fiscal Impact`,
    '',
    ...packet.fiscalImpact.map(note => noteToMarkdown(note, sourceIndexByUrl, citations)),
    '',
    `## Implementation Timeline`,
    '',
    ...packet.implementationTimeline.map(note => noteToMarkdown(note, sourceIndexByUrl, citations)),
    '',
    `## Evaluation & Sunset Provisions`,
    '',
    ...packet.evaluationAndSunset.map(metric => metricToMarkdown(metric, sourceIndexByUrl, citations)),
    '',
    `## Evidence Appendix`,
    '',
    ...packet.evidenceAppendix.map(note => noteToMarkdown(note, sourceIndexByUrl, citations)),
  ];

  if (packet.openQuestions.length > 0) {
    lines.push('');
    lines.push('## Open Questions');
    lines.push('');
    for (const question of packet.openQuestions) {
      lines.push(`- ${question}`);
    }
  }

  return {
    markdown: lines.join('\n'),
    sources,
    citations,
  };
}

// ─── Core Function ──────────────────────────────────────────────────

/**
 * Draft model legislation using a structured Google Search-grounded research packet.
 *
 * Gemini researches the specific policies used by efficient countries and
 * returns structured JSON. The final markdown is rendered in code.
 */
export async function draftLegislation(
  evidence: EfficiencyEvidence,
  exemplars: PolicyExemplarInput[],
  options: DraftLegislationOptions = {},
): Promise<LegislationDraft> {
  const apiKey = resolveGeminiApiKey(options.apiKey);
  const targetJurisdiction = options.targetJurisdiction ?? 'United States';
  const prompt = buildResearchPrompt(
    evidence,
    exemplars,
    targetJurisdiction,
    options.evidenceBundle,
    options.wishoniaContext,
  );
  const explicitModel = options.model !== undefined;
  const client = options.client ?? buildGroundedGeminiClient(apiKey);
  const researchModel = options.model ?? DEFAULT_LEGISLATION_RESEARCH_MODEL;
  let packetResult: {
    packet: LegislationResearchPacket;
    response: GroundedGeminiResponseLike;
  };

  try {
    packetResult = await generateLegislationResearchPacket(
      client,
      researchModel,
      prompt,
    );
  } catch (error) {
    if (!shouldRetryStructuredResearch(error, explicitModel)) {
      throw error;
    }

    packetResult = await generateLegislationResearchPacket(
      client,
      researchModel,
      prompt,
    );
  }

  const metadata = getGroundingMetadata(packetResult.response);
  const searchQueries = metadata?.webSearchQueries ?? [];
  const searchBrandingHtml = metadata?.searchEntryPoint?.renderedContent ?? '';
  const { markdown, sources, citations } = renderLegislationResearchPacket(
    packetResult.packet,
  );

  return {
    legislationText: markdown,
    summary: packetResult.packet.billSummary,
    billTitle: packetResult.packet.billTitle,
    sources,
    citations,
    searchQueries,
    prompt,
    category: evidence.category,
    searchBrandingHtml,
    researchPacket: packetResult.packet,
    researchModel,
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

/**
 * Generate a source footnotes section for the legislation.
 */
export function generateSourceFootnotes(draft: LegislationDraft): string {
  if (draft.sources.length === 0) return '';

  const lines = ['## Sources\n'];
  for (let i = 0; i < draft.sources.length; i++) {
    const s = draft.sources[i];
    if (!s) continue;
    lines.push(`${i + 1}. [${s.domain}](${s.url})`);
  }
  return lines.join('\n');
}
