import type { WishocraticItemId } from "@/lib/wishocracy-data";
import { ALIGNMENT_LEGISLATIVE_CATEGORY_RULES } from "@/lib/alignment-legislative-config";

export interface LegislativeBillInput {
  billId: string;
  title: string;
  subjects: string[];
  policyArea: string | null;
  latestActionText?: string | null;
}

export type LegislativeMatchConfidence = "high" | "medium" | "low";
export type LegislativeBudgetDirection = "increase" | "decrease";

export interface LegislativeCategoryMatch {
  categoryId: WishocraticItemId;
  confidence: LegislativeMatchConfidence;
  matchedTerms: string[];
  score: number;
  weight: number;
}

interface CategoryRule {
  categoryId: WishocraticItemId;
  keywords: readonly string[];
  policyAreas?: readonly string[];
}
const CATEGORY_RULES: readonly CategoryRule[] = ALIGNMENT_LEGISLATIVE_CATEGORY_RULES;

const SUPPORTIVE_KEYWORDS = [
  "appropriation",
  "authorize",
  "construction",
  "establish",
  "expand",
  "fund",
  "grant",
  "modernization",
  "operation",
  "program",
  "provide",
  "reauthorize",
  "support",
] as const;

const RESTRICTIVE_KEYWORDS = [
  "abolish",
  "ban",
  "close",
  "cut",
  "defund",
  "eliminate",
  "moratorium",
  "phase out",
  "prohibit",
  "repeal",
  "rescind",
  "restrict",
  "sunset",
  "terminate",
] as const;

const YES_VOTE_KEYWORDS = ["aye", "yes", "yea", "yeas"] as const;
const NO_VOTE_KEYWORDS = ["nay", "nays", "no", "nos"] as const;
const NEUTRAL_VOTE_KEYWORDS = ["not voting", "present"] as const;

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, keywords: readonly string[]): Array<string> {
  return keywords.filter((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return false;
    }

    const pattern = new RegExp(`(?:^| )${escapeRegExp(normalizedKeyword).replace(/ /g, " +")}(?: |$)`);
    return pattern.test(text);
  });
}

function toConfidence(score: number): LegislativeMatchConfidence {
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function classifyLegislativeBill(
  bill: LegislativeBillInput,
): LegislativeCategoryMatch[] {
  const title = normalizeText(bill.title);
  const policyArea = normalizeText(bill.policyArea);
  const subjectText = normalizeText(bill.subjects.join(" "));
  const latestActionText = normalizeText(bill.latestActionText);
  const supportingText = [subjectText, latestActionText].filter(Boolean).join(" ");
  const matches = CATEGORY_RULES
    .map((rule) => {
      const matchedTerms = new Set<string>();
      const titleMatches = countMatches(title, rule.keywords);
      const textMatches = countMatches(supportingText, rule.keywords);
      const hasKeywordEvidence = titleMatches.length + textMatches.length > 0;
      const policyMatches = hasKeywordEvidence
        ? countMatches(policyArea, rule.policyAreas ?? [])
        : [];
      for (const term of [...titleMatches, ...textMatches, ...policyMatches]) {
        matchedTerms.add(term);
      }

      const score =
        titleMatches.length * 2 +
        textMatches.length +
        policyMatches.length * 2;
      if (score <= 0) {
        return null;
      }

      return {
        categoryId: rule.categoryId,
        confidence: toConfidence(score),
        matchedTerms: [...matchedTerms].sort(),
        score,
      };
    })
    .filter(
      (match): match is Omit<LegislativeCategoryMatch, "weight"> =>
        match != null,
    )
    .sort((left, right) => right.score - left.score);

  const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
  if (totalScore <= 0) {
    return [];
  }

  return matches.map((match) => ({
    ...match,
    weight: Number((match.score / totalScore).toFixed(3)),
  }));
}

export function inferLegislativeBudgetDirection(
  bill: LegislativeBillInput,
): LegislativeBudgetDirection {
  const text = normalizeText([bill.title, bill.latestActionText].filter(Boolean).join(" "));
  const isMilitarySaleRestriction =
    countMatches(text, ["foreign military sale", "defense articles and services", "arms sale"])
      .length > 0 &&
    countMatches(text, ["disapproval", "disapproving", "terminate", "terminating"]).length > 0;
  if (isMilitarySaleRestriction) {
    return "decrease";
  }

  const supportiveMatches = countMatches(text, SUPPORTIVE_KEYWORDS).length;
  const restrictiveMatches = countMatches(text, RESTRICTIVE_KEYWORDS).length;

  if (restrictiveMatches > supportiveMatches) {
    return "decrease";
  }

  return "increase";
}

export function deriveCategorySupportSignal(
  votePosition: string,
  direction: LegislativeBudgetDirection,
): number {
  const normalized = normalizeText(votePosition);
  if (NEUTRAL_VOTE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 0;
  }

  const yesVote = YES_VOTE_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const noVote = NO_VOTE_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (!yesVote && !noVote) {
    return 0;
  }

  const billSupport = yesVote ? 1 : -1;
  return direction === "increase" ? billSupport : -billSupport;
}

export function confidenceToSignalWeight(
  confidence: LegislativeMatchConfidence,
): number {
  if (confidence === "high") return 1;
  if (confidence === "medium") return 0.8;
  return 0.6;
}
