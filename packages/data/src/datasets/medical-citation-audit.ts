/**
 * Citation provenance audit for the medical treatment snapshot.
 *
 * Classifies every citation URL and every outcome row so reports can say which
 * treatments have no resolvable primary source (DOI, PubMed, PMC, a
 * ClinicalTrials.gov study record, or a regulatory label). Pure functions only;
 * file IO lives in `scripts/audit-medical-citations.ts`.
 */
import type {
  ConditionTreatmentsFile,
  OutcomeMeasure,
  TreatmentCitation,
  TreatmentForCondition,
} from "./medical";

export type CitationUrlKind =
  | "vertex-grounding-redirect"
  | "clinicaltrials-search"
  | "clinicaltrials-study"
  | "doi"
  | "pubmed"
  | "pmc"
  | "regulatory-label"
  | "search-engine"
  | "other-web"
  | "invalid";

export const CITATION_URL_KINDS: readonly CitationUrlKind[] = [
  "vertex-grounding-redirect",
  "clinicaltrials-search",
  "clinicaltrials-study",
  "doi",
  "pubmed",
  "pmc",
  "regulatory-label",
  "search-engine",
  "other-web",
  "invalid",
];

/** Kinds a reader can open later and that identify one document or study. */
export const RESOLVABLE_PRIMARY_KINDS: ReadonlySet<CitationUrlKind> = new Set([
  "clinicaltrials-study",
  "doi",
  "pubmed",
  "pmc",
  "regulatory-label",
]);

const DOI_PATTERN = /(10\.\d{4,9}\/[^\s?#]+)/;
const PMC_PATTERN = /(PMC\d+)/i;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export interface ClassifiedCitationUrl {
  kind: CitationUrlKind;
  /** Stable identifier such as `doi:10.1056/...`, `pmid:36449413`, `nct:NCT03887455`. */
  sourceId: string | null;
}

export function classifyCitationUrl(rawUrl: string): ClassifiedCitationUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { kind: "invalid", sourceId: null };
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = safeDecode(url.pathname);

  if (host === "vertexaisearch.cloud.google.com" && path.startsWith("/grounding-api-redirect/")) {
    return { kind: "vertex-grounding-redirect", sourceId: null };
  }
  if (host === "clinicaltrials.gov" || host === "classic.clinicaltrials.gov") {
    const nct = /^\/(?:study|ct2\/show)\/(NCT\d{8})/i.exec(path)?.[1];
    return nct
      ? { kind: "clinicaltrials-study", sourceId: `nct:${nct.toUpperCase()}` }
      : { kind: "clinicaltrials-search", sourceId: null };
  }
  if (host === "doi.org" || host === "dx.doi.org" || /\/doi\/(?:abs\/|full\/|pdf\/|epdf\/)?10\./.test(path)) {
    const doi = DOI_PATTERN.exec(path)?.[1];
    if (doi) return { kind: "doi", sourceId: `doi:${doi.toLowerCase()}` };
  }
  const pubmedPath =
    host === "pubmed.ncbi.nlm.nih.gov" ? /^\/(\d+)\/?$/ : host === "ncbi.nlm.nih.gov" ? /^\/pubmed\/(\d+)/ : null;
  const pmid = pubmedPath?.exec(path)?.[1];
  if (pmid) return { kind: "pubmed", sourceId: `pmid:${pmid}` };
  const isPmcHost =
    host === "pmc.ncbi.nlm.nih.gov" ||
    (host === "ncbi.nlm.nih.gov" && path.startsWith("/pmc/")) ||
    host === "europepmc.org";
  const pmc = isPmcHost ? PMC_PATTERN.exec(path)?.[1] : undefined;
  if (pmc) return { kind: "pmc", sourceId: `pmc:${pmc.toUpperCase()}` };
  if (host === "accessdata.fda.gov" || host === "dailymed.nlm.nih.gov") {
    return { kind: "regulatory-label", sourceId: `label:${host}${path}${url.search}` };
  }
  if (host === "ema.europa.eu" && path.includes("/medicines/")) {
    return { kind: "regulatory-label", sourceId: `label:${host}${path}` };
  }
  if (/^(?:google|bing|duckduckgo)\.[a-z.]+$/.test(host) && path.startsWith("/search")) {
    return { kind: "search-engine", sourceId: null };
  }
  return { kind: "other-web", sourceId: null };
}

/** A citation is a primary source when its URL or its `pubmedId` identifies one document or study. */
export function citationSourceId(citation: TreatmentCitation): ClassifiedCitationUrl {
  const classified = classifyCitationUrl(citation.url);
  if (classified.sourceId || !citation.pubmedId) return classified;
  return { kind: "pubmed", sourceId: `pmid:${citation.pubmedId}` };
}

export type OutcomeProvenance = "ai-estimated" | "trial" | "name-only" | "unlabeled-values";

export function outcomeProvenance(outcome: OutcomeMeasure): OutcomeProvenance {
  if (outcome.dataSource === "ai-estimated" || outcome.dataSource === "trial") {
    return outcome.dataSource;
  }
  const hasValues =
    outcome.baseline !== undefined ||
    outcome.absoluteChange !== undefined ||
    outcome.percentageChange !== undefined;
  return hasValues ? "unlabeled-values" : "name-only";
}

export interface TreatmentCitationAudit {
  conditionSlug: string;
  conditionName: string;
  treatmentName: string;
  citationCount: number;
  citationKinds: Record<CitationUrlKind, number>;
  primarySourceIds: string[];
  hasResolvablePrimarySource: boolean;
  /** Titles of redirect citations. The generator stored only the target domain (e.g. `nih.gov`). */
  redirectTitles: string[];
  outcomes: Record<OutcomeProvenance, number>;
  sideEffectRows: number;
  /** Numeric leaf values in the record, none of which carry a per-value source in the current schema. */
  numericValues: number;
}

function emptyKindCounts(): Record<CitationUrlKind, number> {
  return Object.fromEntries(CITATION_URL_KINDS.map((kind) => [kind, 0])) as Record<CitationUrlKind, number>;
}

function countNumericLeaves(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? 1 : 0;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countNumericLeaves(item), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce<number>((sum, item) => sum + countNumericLeaves(item), 0);
  }
  return 0;
}

export function auditTreatment(
  conditionSlug: string,
  conditionName: string,
  treatment: TreatmentForCondition,
): TreatmentCitationAudit {
  const citationKinds = emptyKindCounts();
  const primarySourceIds = new Set<string>();
  const redirectTitles: string[] = [];
  for (const citation of treatment.citations ?? []) {
    const classified = citationSourceId(citation);
    citationKinds[classified.kind] += 1;
    if (RESOLVABLE_PRIMARY_KINDS.has(classified.kind) && classified.sourceId) {
      primarySourceIds.add(classified.sourceId);
    }
    if (classified.kind === "vertex-grounding-redirect" && citation.title) {
      redirectTitles.push(citation.title);
    }
  }

  const outcomes: Record<OutcomeProvenance, number> = {
    "ai-estimated": 0,
    trial: 0,
    "name-only": 0,
    "unlabeled-values": 0,
  };
  for (const outcome of [...(treatment.primaryOutcomes ?? []), ...(treatment.secondaryOutcomes ?? [])]) {
    outcomes[outcomeProvenance(outcome)] += 1;
  }

  return {
    conditionSlug,
    conditionName,
    treatmentName: treatment.name,
    citationCount: treatment.citations?.length ?? 0,
    citationKinds,
    primarySourceIds: [...primarySourceIds].sort(),
    hasResolvablePrimarySource: primarySourceIds.size > 0,
    redirectTitles,
    outcomes,
    sideEffectRows: treatment.sideEffects.length,
    numericValues: countNumericLeaves({ ...treatment, citations: undefined }),
  };
}

export function auditConditionFile(
  conditionSlug: string,
  file: ConditionTreatmentsFile,
): TreatmentCitationAudit[] {
  return file.treatments.map((treatment) => auditTreatment(conditionSlug, file.conditionName, treatment));
}
