import type { BudgetCategoryId } from "@/lib/wishocracy-data";

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
  categoryId: BudgetCategoryId;
  confidence: LegislativeMatchConfidence;
  matchedTerms: string[];
  score: number;
  weight: number;
}

interface CategoryRule {
  categoryId: BudgetCategoryId;
  keywords: readonly string[];
  policyAreas?: readonly string[];
}

const CATEGORY_RULES: readonly CategoryRule[] = [
  {
    categoryId: "PRAGMATIC_CLINICAL_TRIALS",
    keywords: [
      "clinical trial",
      "medical research",
      "biomedical research",
      "national institutes of health",
      "nih",
      "comparative effectiveness",
      "arpa h",
      "arpa-h",
      "cancer research",
      "research administration and funding",
    ],
    policyAreas: ["health", "science", "technology"],
  },
  {
    categoryId: "ADDICTION_TREATMENT",
    keywords: [
      "addiction treatment",
      "substance abuse treatment",
      "substance use disorder",
      "opioid treatment",
      "recovery",
      "harm reduction",
      "naloxone",
      "behavioral health",
      "behavioral health services",
      "overdose prevention",
    ],
    policyAreas: ["health", "drugs", "families"],
  },
  {
    categoryId: "EARLY_CHILDHOOD_EDUCATION",
    keywords: [
      "early childhood",
      "child care",
      "childcare",
      "child care and development block grant",
      "prekindergarten",
      "pre kindergarten",
      "pre-kindergarten",
      "preschool",
      "head start",
      "school readiness",
      "early learning",
      "day care",
    ],
    policyAreas: ["education", "families", "children"],
  },
  {
    categoryId: "DRUG_WAR_ENFORCEMENT",
    keywords: [
      "drug enforcement",
      "dea",
      "controlled substance",
      "drug trafficking",
      "drug trafficking and controlled substances",
      "interdiction",
      "drug control",
      "drug control policy",
    ],
    policyAreas: ["crime and law enforcement", "drugs"],
  },
  {
    categoryId: "ICE_IMMIGRATION_ENFORCEMENT",
    keywords: [
      "immigration detention",
      "deportation",
      "removal proceedings",
      "border patrol",
      "border security",
      "unlawful immigration",
      "immigration enforcement",
      "detention center",
      "detention of persons",
      "sanctuary city",
      "deportable alien",
      "removable alien",
      "alien gang",
    ],
    policyAreas: ["immigration", "crime and law enforcement"],
  },
  {
    categoryId: "FARM_SUBSIDIES_AGRIBUSINESS",
    keywords: [
      "farm subsidy",
      "farm support",
      "commodity support",
      "commodity programs",
      "crop insurance",
      "agricultural subsidy",
      "farm bill",
      "farm credit",
      "agribusiness",
    ],
    policyAreas: ["agriculture and food"],
  },
  {
    categoryId: "FOSSIL_FUEL_SUBSIDIES",
    keywords: [
      "oil and gas",
      "fossil fuel",
      "drilling",
      "pipeline",
      "coal",
      "petroleum",
      "gas export",
      "lng export",
      "oil leasing",
      "gas leasing",
      "offshore leasing",
      "offshore oil",
    ],
    policyAreas: ["energy", "environmental protection"],
  },
  {
    categoryId: "NUCLEAR_WEAPONS_MODERNIZATION",
    keywords: [
      "nuclear weapon",
      "nuclear modernization",
      "warhead",
      "icbm",
      "strategic forces",
      "strategic deterrent",
      "nuclear triad",
      "missile silo",
      "ballistic missile",
      "national nuclear security administration",
    ],
    policyAreas: ["armed forces and national security"],
  },
  {
    categoryId: "PRISON_CONSTRUCTION",
    keywords: [
      "prison construction",
      "bureau of prisons",
      "correctional facility",
      "correctional facilities",
      "detention facility",
      "detention facilities",
      "jail construction",
      "carceral",
    ],
    policyAreas: ["crime and law enforcement"],
  },
  {
    categoryId: "MILITARY_OPERATIONS",
    keywords: [
      "defense appropriation",
      "defense appropriations",
      "armed forces",
      "armed services",
      "pentagon",
      "military operation",
      "military procurement",
      "foreign military sale",
      "defense articles and services",
      "arms sale",
      "military facilities",
      "weapons system",
      "weapons development",
      "navy",
      "army",
      "air force",
      "missile defense",
    ],
    policyAreas: ["armed forces and national security"],
  },
];

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
