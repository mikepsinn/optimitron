import { createHash } from "crypto";
import {
  citations,
  formatValue,
  parameters,
  type Citation,
  type Parameter,
} from "@optimitron/data/parameters";
import type {
  ParameterExport,
  ParameterExportCitation,
  ParameterExportEntry,
} from "./parameter-export-to-policy-model";

const TREATY_PARAMETER_SOURCE_FILE =
  "packages/data/src/parameters/parameters-calculations-citations.ts";

function toIsoYear(citation: Citation): string | null {
  const year = citation.issued?.["date-parts"]?.[0]?.[0];
  return typeof year === "number" ? year.toString() : null;
}

function toCitationAuthor(citation: Citation): string | null {
  if (!Array.isArray(citation.author) || citation.author.length === 0) {
    return null;
  }

  const firstAuthor = citation.author[0];
  if (!firstAuthor) {
    return null;
  }

  if (typeof firstAuthor.literal === "string" && firstAuthor.literal.trim().length > 0) {
    return firstAuthor.literal.trim();
  }

  const family = firstAuthor.family?.trim();
  const given = firstAuthor.given?.trim();
  if (family && given) {
    return `${family}, ${given}`;
  }

  return family ?? given ?? null;
}

function toParameterExportCitation(citation: Citation): ParameterExportCitation {
  const url = citation.URL ?? null;

  return {
    author: toCitationAuthor(citation),
    id: citation.id,
    note: citation.note ?? null,
    quote: null,
    source: citation["container-title"] ?? citation.publisher ?? null,
    title: citation.title ?? null,
    type: citation.type ?? null,
    url,
    urls: url ? [url] : [],
    year: toIsoYear(citation),
  };
}

function toParameterExportEntry(parameterName: string, parameter: Parameter): ParameterExportEntry {
  return {
    chapterUrl: parameter.manualPageUrl ?? null,
    confidence: parameter.confidence ?? null,
    confidenceInterval: parameter.confidenceInterval ?? null,
    conservative: parameter.conservative ?? null,
    description: parameter.description ?? null,
    displayName: parameter.displayName ?? parameterName,
    formatted: formatValue(parameter),
    formula: parameter.formula ?? null,
    latex: parameter.latex ?? null,
    sourceRef: parameter.sourceRef ?? null,
    sourceType: parameter.sourceType ?? null,
    sourceUrl:
      parameter.sourceUrl ??
      (parameter.sourceRef ? (citations[parameter.sourceRef]?.URL ?? null) : null),
    stdError: parameter.stdError ?? null,
    unit: parameter.unit ?? null,
    value: parameter.value,
  };
}

function normalizeForStableHash(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForStableHash(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeForStableHash(entry)]),
    );
  }

  return value;
}

function buildStableHash(value: unknown) {
  return `sha256:${createHash("sha256").update(
    JSON.stringify(normalizeForStableHash(value)),
  ).digest("hex")}`;
}

let cachedTreatyParameterExport: ParameterExport | null = null;
let cachedTreatyParameterSetHash: string | null = null;

export function buildTreatyParameterExport(): ParameterExport {
  if (cachedTreatyParameterExport) {
    return structuredClone(cachedTreatyParameterExport);
  }

  cachedTreatyParameterExport = {
    citations: Object.fromEntries(
      Object.entries(citations).map(([key, citation]) => [key, toParameterExportCitation(citation)]),
    ),
    parameters: Object.fromEntries(
      Object.entries(parameters).map(([parameterName, parameter]) => [
        parameterName,
        toParameterExportEntry(parameterName, parameter),
      ]),
    ),
    shareableSnippets: {},
    sourceFile: TREATY_PARAMETER_SOURCE_FILE,
  };

  return structuredClone(cachedTreatyParameterExport);
}

export function getTreatyParameterSetHash() {
  if (!cachedTreatyParameterSetHash) {
    cachedTreatyParameterSetHash = buildStableHash(buildTreatyParameterExport());
  }

  return cachedTreatyParameterSetHash;
}
