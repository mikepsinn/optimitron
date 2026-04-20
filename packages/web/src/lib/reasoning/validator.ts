/**
 * Pure deterministic validator for candidate VariantArm content.
 *
 * Shared between server (write path) and client (editor preview).
 * Invariant rules live here in code (T3 to add/tighten). Per-locale
 * banned-phrase lists come from `ReasoningLocaleConfig` rows — passed
 * in as data so the function stays pure.
 */

import {
  REQUIRED_PARAMS_PER_CLAIM,
  ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS,
} from "./call-script";
import {
  safeParseArmContent,
  HANDOFF_CHANNEL_MAX_LEN,
  type ArmContentBySlot,
} from "./arm-content";
import {
  extractParameterTokenNames,
  isKnownParameterName,
  stripParameterTokens,
} from "./parameter-tokens";
import type { VariantSlot } from "./types";

/* ================================================================
 * Banned phrases (code-level, cross-locale invariants)
 * ================================================================ */

/**
 * Phrases that are banned everywhere regardless of locale. Anti-cult
 * invariants — the chain lets the listener form the "rational" inference
 * themselves; it never asserts it.
 */
export const GLOBAL_BANNED_PHRASES: readonly RegExp[] = [
  /\bany rational person\b/i,
  /\b(the )?rational (action|choice|thing to do)\b/i,
  /\byou'?d be (crazy|stupid|a fool) not to\b/i,
  /\beveryone agrees\b/i,
  /\bliterally anyone\b/i,
  /\byou have no choice\b/i,
  /\bno real human would\b/i,
];

/**
 * URL / CTA patterns banned by CLAUDE.md's three-mechanism separation
 * rule: the reasoning surface is strictly a sign-funnel.
 */
export const BANNED_URL_PATTERNS: readonly RegExp[] = [
  /\/iab\b/,
  /buy[\s_-]*bonds?/i,
  /purchase[\s_-]*(iab|bond)/i,
  /\$wish[\s_-]*token/i,
  /buy[\s_-]*\$?wish/i,
];

/**
 * Email-drip / email-capture language — cult-funnel failure mode.
 */
export const BANNED_DRIP_PATTERNS: readonly RegExp[] = [
  /\bsubscribe to our (newsletter|email|updates)\b/i,
  /\bwe'?ll keep you posted\b/i,
  /\bjoin our mailing list\b/i,
  /\bdon'?t miss out\b/i,
];

/**
 * Slot-specific banned phrases for the Replication primary CTA —
 * must invite send-verbs, not demand.
 */
export const REPLICATION_PRIMARY_CTA_BANNED: readonly RegExp[] = [
  /\byou must\b/i,
  /\brequired\b/i,
  /\bnow or never\b/i,
];

/**
 * Slot-specific banned phrases for the Replication expansion CTA —
 * must not be guilt-framed.
 */
export const REPLICATION_EXPANSION_BANNED: readonly RegExp[] = [
  /\bshame on you\b/i,
  /\bhow can you not\b/i,
  /\byou failed\b/i,
  /\bif you really (cared|loved)\b/i,
];

/**
 * Send-verb whitelist the replication primary CTA must use.
 */
export const REPLICATION_SEND_VERB_WHITELIST: readonly RegExp[] = [
  /\bsend\b/i,
  /\bshare\b/i,
  /\bforward\b/i,
  /\bcopy[-\s]?and[-\s]?send\b/i,
];

/**
 * Handoff channels that enforce "no high-emotional-intensity" copy
 * (`professional`).
 */
export const PROFESSIONAL_BANNED_PHRASES: readonly RegExp[] = [
  /\bbegging\b/i,
  /\bplease for the love of\b/i,
  /\byou will regret it if\b/i,
  /\bi need you\b/i,
];

/* ================================================================
 * Validator input + result types
 * ================================================================ */

export type ValidatorLocaleConfig = {
  localeKey: string;
  /** Source-string patterns banned in this locale only. Must be valid regex. */
  bannedPhrases: readonly string[];
  /** Banned URL-pattern strings beyond the global set. */
  bannedUrlPatterns?: readonly string[];
};

export type ValidatorInput<S extends VariantSlot> = {
  slot: S;
  slotKey: string;
  localeKey: string;
  content: unknown;
  /** Optional locale-scoped banned-phrase list; merged with globals. */
  localeConfig?: ValidatorLocaleConfig;
  /** Optional blacklist patterns active at this moment (from BlacklistRule). */
  blacklistPatterns?: readonly string[];
  /** Whether this arm's lineage contains a fraud-retired ancestor. */
  fraudLineageFlagged?: boolean;
};

export type ValidatorResult = {
  pass: boolean;
  violations: string[];
};

/** Version string — bumped when rules change (T3). Surfaced in arm audit trail. */
export const VALIDATOR_VERSION = "v1.1.0-2026-04-19";

/* ================================================================
 * Validator entry point
 * ================================================================ */

export function validateArm<S extends VariantSlot>(
  input: ValidatorInput<S>,
): ValidatorResult {
  const violations: string[] = [];

  if (input.fraudLineageFlagged) {
    violations.push(
      "fraud-lineage-flagged: ancestor arm was retired for FRAUD_CORRELATED; human un-flag required before this candidate is eligible",
    );
  }

  const parsed = safeParseArmContent(input.slot, input.content);
  if (!parsed.success) {
    for (const issue of parsed.issues) {
      violations.push(`schema: ${issue}`);
    }
    return { pass: false, violations };
  }

  const allBannedPhrases = collectBannedPhrases(input);
  const allBannedUrls = collectBannedUrlPatterns(input);

  switch (input.slot) {
    case "HANDOFF":
      validateHandoff(
        parsed.data as ArmContentBySlot["HANDOFF"],
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "CHAIN_NODE":
      validateChainNode(
        parsed.data as ArmContentBySlot["CHAIN_NODE"],
        input.slotKey,
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "OBJECTION_NODE":
      validateObjectionNode(
        parsed.data as ArmContentBySlot["OBJECTION_NODE"],
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "INEVITABILITY":
      validateInevitability(
        parsed.data as ArmContentBySlot["INEVITABILITY"],
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "REPLICATION_CTA":
      validateReplicationCta(
        parsed.data as ArmContentBySlot["REPLICATION_CTA"],
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "DEEP_CHAIN_NODE":
      validateDeepChainNode(
        parsed.data as ArmContentBySlot["DEEP_CHAIN_NODE"],
        allBannedPhrases,
        allBannedUrls,
        violations,
      );
      break;
    case "TOPOLOGY":
      // Topology validation is structural — handled elsewhere (grammar check).
      break;
  }

  return {
    pass: violations.length === 0,
    violations,
  };
}

/* ================================================================
 * Helpers
 * ================================================================ */

function collectBannedPhrases(
  input: ValidatorInput<VariantSlot>,
): readonly RegExp[] {
  const patterns: RegExp[] = [...GLOBAL_BANNED_PHRASES, ...BANNED_DRIP_PATTERNS];
  if (input.localeConfig) {
    for (const raw of input.localeConfig.bannedPhrases) {
      const compiled = safeCompileRegex(raw);
      if (compiled) patterns.push(compiled);
    }
  }
  if (input.blacklistPatterns) {
    for (const raw of input.blacklistPatterns) {
      const compiled = safeCompileRegex(raw);
      if (compiled) patterns.push(compiled);
    }
  }
  return patterns;
}

function collectBannedUrlPatterns(
  input: ValidatorInput<VariantSlot>,
): readonly RegExp[] {
  const patterns: RegExp[] = [...BANNED_URL_PATTERNS];
  if (input.localeConfig?.bannedUrlPatterns) {
    for (const raw of input.localeConfig.bannedUrlPatterns) {
      const compiled = safeCompileRegex(raw);
      if (compiled) patterns.push(compiled);
    }
  }
  return patterns;
}

function safeCompileRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function scanForBanned(
  text: string,
  patterns: readonly RegExp[],
  violations: string[],
  locus: string,
): void {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      violations.push(`${locus}: matched banned pattern ${pattern.source}`);
    }
  }
}

function scanForBannedUrls(
  text: string,
  patterns: readonly RegExp[],
  violations: string[],
  locus: string,
): void {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      violations.push(`${locus}: matched banned URL/CTA pattern ${pattern.source}`);
    }
  }
}

/**
 * Numeric-claim detector: any bare number ≥ 2 OR any explicit digit-with-unit
 * (1.2x, 5%, $27.2B) in claim body must resolve through a `{PARAM_NAME}`
 * placeholder, not remain hardcoded prose. We strip valid parameter tokens
 * first, then look for leftover numeric-looking literals.
 *
 * Simple heuristic — tight enough to catch "99% of doctors" without
 * parameter resolution; loose enough to allow ordinal / list counts.
 */
const NUMERIC_CLAIM_RE = /(\$\d[\d,.]*\s*[kmbt]?|\d[\d,.]*\s*%|\b\d[\d,.]*\s*(?:x|×|times)\b|\b\d{2,}[\d,.]+\b)/i;

function scanForHardcodedStats(
  text: string,
  violations: string[],
  locus: string,
): void {
  const match = stripParameterTokens(text).match(NUMERIC_CLAIM_RE);
  if (match) {
    violations.push(
      `${locus}: contains hardcoded numeric claim "${match[0]}" outside a {PARAM_NAME} token`,
    );
  }
}

function scanForUnknownParameterNames(
  paramNames: readonly string[],
  violations: string[],
  locus: string,
): void {
  for (const paramName of paramNames) {
    if (!isKnownParameterName(paramName)) {
      violations.push(`${locus}: unknown Parameter "${paramName}"`);
    }
  }
}

/* ================================================================
 * Slot-specific validators
 * ================================================================ */

function validateHandoff(
  content: ArmContentBySlot["HANDOFF"],
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  const channelCeiling = HANDOFF_CHANNEL_MAX_LEN[content.channel];
  if (content.template.length > content.maxLen) {
    violations.push(
      `handoff.template: length ${content.template.length} exceeds maxLen ${content.maxLen}`,
    );
  }
  if (content.maxLen > channelCeiling) {
    violations.push(
      `handoff.maxLen: ${content.maxLen} exceeds channel ceiling ${channelCeiling} for ${content.channel}`,
    );
  }
  const placeholderMatches = content.template.match(/\{url\}/g) ?? [];
  if (placeholderMatches.length !== 1) {
    violations.push(
      `handoff.template: must contain {url} placeholder exactly once (found ${placeholderMatches.length})`,
    );
  }
  scanForBanned(content.template, bannedPhrases, violations, "handoff.template");
  scanForBannedUrls(content.template, bannedUrls, violations, "handoff.template");
  if (content.bucket === "professional") {
    scanForBanned(
      content.template,
      PROFESSIONAL_BANNED_PHRASES,
      violations,
      "handoff.template[professional]",
    );
  }
}

function validateChainNode(
  content: ArmContentBySlot["CHAIN_NODE"],
  slotKey: string,
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  if (content.body.length === 0) violations.push("chain_node.body: empty");
  if (content.body.length > 600) {
    violations.push(
      `chain_node.body: length ${content.body.length} exceeds 600 chars`,
    );
  }
  if (content.headline.length === 0) {
    violations.push("chain_node.headline: empty");
  }
  scanForBanned(content.body, bannedPhrases, violations, "chain_node.body");
  scanForBanned(content.headline, bannedPhrases, violations, "chain_node.headline");
  scanForBannedUrls(content.body, bannedUrls, violations, "chain_node.body");
  if (content.coldOpenerBody) {
    scanForBanned(
      content.coldOpenerBody,
      bannedPhrases,
      violations,
      "chain_node.coldOpenerBody",
    );
    scanForBannedUrls(
      content.coldOpenerBody,
      bannedUrls,
      violations,
      "chain_node.coldOpenerBody",
    );
  }

  // Required-parameter check.
  const nodeIdForSlot = deriveNodeIdFromSlotKey(slotKey, "CHAIN_NODE");
  const required = REQUIRED_PARAMS_PER_CLAIM[nodeIdForSlot ?? content.nodeId] ?? [];
  const tokenParamNames = extractParameterTokenNames(
    [content.headline, content.body, content.coldOpenerBody ?? ""].join(" "),
  );
  scanForUnknownParameterNames(tokenParamNames, violations, "chain_node.tokens");
  const paramNamesInSources = new Set<string>(
    content.sources
      .map((s) => s.paramName)
      .filter(isPresent),
  );
  scanForUnknownParameterNames(
    Array.from(paramNamesInSources),
    violations,
    "chain_node.sources",
  );
  for (const requiredName of required) {
    if (!paramNamesInSources.has(requiredName)) {
      violations.push(
        `chain_node[${content.nodeId}]: missing required Parameter reference "${requiredName}" in sources`,
      );
    }
  }

  // Numeric-claim attribution.
  scanForHardcodedStats(content.headline, violations, "chain_node.headline");
  scanForHardcodedStats(content.body, violations, "chain_node.body");
  if (content.coldOpenerBody) {
    scanForHardcodedStats(
      content.coldOpenerBody,
      violations,
      "chain_node.coldOpenerBody",
    );
  }
}

function validateObjectionNode(
  content: ArmContentBySlot["OBJECTION_NODE"],
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  if (content.steelman.length === 0) violations.push("objection.steelman: empty");
  if (content.rebuttal.length === 0) violations.push("objection.rebuttal: empty");
  scanForBanned(content.steelman, bannedPhrases, violations, "objection.steelman");
  scanForBanned(content.rebuttal, bannedPhrases, violations, "objection.rebuttal");
  scanForBannedUrls(content.rebuttal, bannedUrls, violations, "objection.rebuttal");
  scanForUnknownParameterNames(
    extractParameterTokenNames(`${content.steelman} ${content.rebuttal}`),
    violations,
    "objection.tokens",
  );
  scanForUnknownParameterNames(
    content.sources
      .map((s) => s.paramName)
      .filter(isPresent),
    violations,
    "objection.sources",
  );

  if (ADVERSARIAL_SOURCE_REQUIRED_OBJECTIONS.includes(content.nodeId)) {
    const hasAdversarial = content.sources.some((s) => s.adversarial === true);
    if (!hasAdversarial) {
      violations.push(
        `objection[${content.nodeId}]: requires ≥1 Source with adversarial:true (anti-cult: load-bearing claims must cite critics)`,
      );
    }
  }
}

function validateInevitability(
  content: ArmContentBySlot["INEVITABILITY"],
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  if (content.body.length === 0) violations.push("inevitability.body: empty");
  scanForBanned(content.body, bannedPhrases, violations, "inevitability.body");
  scanForBannedUrls(content.body, bannedUrls, violations, "inevitability.body");
  scanForUnknownParameterNames(
    extractParameterTokenNames(content.body),
    violations,
    "inevitability.tokens",
  );
}

function validateReplicationCta(
  content: ArmContentBySlot["REPLICATION_CTA"],
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  scanForBanned(content.primaryCta, bannedPhrases, violations, "replication.primaryCta");
  scanForBanned(content.secondaryCta, bannedPhrases, violations, "replication.secondaryCta");
  scanForBanned(content.urgencyCopy, bannedPhrases, violations, "replication.urgencyCopy");
  scanForBanned(content.expansionCopy, bannedPhrases, violations, "replication.expansionCopy");
  scanForBannedUrls(content.primaryCta, bannedUrls, violations, "replication.primaryCta");
  scanForUnknownParameterNames(
    extractParameterTokenNames(
      `${content.primaryCta} ${content.secondaryCta} ${content.urgencyCopy} ${content.expansionCopy}`,
    ),
    violations,
    "replication.tokens",
  );

  scanForBanned(
    content.primaryCta,
    REPLICATION_PRIMARY_CTA_BANNED,
    violations,
    "replication.primaryCta",
  );
  scanForBanned(
    content.expansionCopy,
    REPLICATION_EXPANSION_BANNED,
    violations,
    "replication.expansionCopy",
  );

  const matchesSendVerb = REPLICATION_SEND_VERB_WHITELIST.some((re) =>
    re.test(content.primaryCta),
  );
  if (!matchesSendVerb) {
    violations.push(
      "replication.primaryCta: must invoke a send-verb (send|share|forward|copy-and-send)",
    );
  }

  if (content.buckets.length === 0) {
    violations.push("replication.buckets: must list ≥1 relationship bucket");
  }
}

function validateDeepChainNode(
  content: ArmContentBySlot["DEEP_CHAIN_NODE"],
  bannedPhrases: readonly RegExp[],
  bannedUrls: readonly RegExp[],
  violations: string[],
): void {
  if (content.body.length === 0) violations.push("deep_chain_node.body: empty");
  scanForBanned(content.body, bannedPhrases, violations, "deep_chain_node.body");
  scanForBannedUrls(content.body, bannedUrls, violations, "deep_chain_node.body");
  scanForUnknownParameterNames(
    extractParameterTokenNames(
      `${content.headline} ${content.body} ${content.expandedRebuttal ?? ""}`,
    ),
    violations,
    "deep_chain_node.tokens",
  );
  scanForUnknownParameterNames(
    [
      ...content.adversarialCitations
        .map((s) => s.paramName)
        .filter(isPresent),
      ...content.sources
        .map((s) => s.paramName)
        .filter(isPresent),
    ],
    violations,
    "deep_chain_node.sources",
  );

  // Deep-chain nodes must include ≥1 adversarial citation for their
  // slot's corresponding objection (surfaces critical views prominently).
  const hasAdversarial = content.adversarialCitations.some(
    (s) => s.adversarial === true,
  );
  if (!hasAdversarial) {
    violations.push(
      `deep_chain_node[${content.nodeId}]: requires ≥1 adversarialCitation with adversarial:true`,
    );
  }
}

/**
 * slotKey format is `"chain_node.<nodeId>.body"` by convention; extract
 * the nodeId for required-parameter lookups.
 */
function deriveNodeIdFromSlotKey(
  slotKey: string,
  expectedPrefix: "CHAIN_NODE" | "OBJECTION_NODE" | "DEEP_CHAIN_NODE",
): string | null {
  const parts = slotKey.split(".");
  if (parts.length < 2) return null;
  return parts[1] ?? null;
}
