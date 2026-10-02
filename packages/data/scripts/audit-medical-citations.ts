/**
 * Inventory every citation in the medical treatment snapshot by URL kind, per
 * condition and treatment, and list treatments with no resolvable primary
 * source. Read-only: the snapshot is never modified.
 *
 * Usage:
 *   pnpm --filter @optimitron/data run audit:medical-citations
 *   pnpm --filter @optimitron/data run audit:medical-citations -- --probe 20
 *   pnpm --filter @optimitron/data run audit:medical-citations -- --dir <medical-data dir> --out <dir>
 *
 * --probe N sends one GET (redirects not followed) to N redirect citations,
 * spread evenly across the snapshot, and records the HTTP status. Requests are
 * spaced 500 ms apart. Results are cached in <out>/probe-cache.json and reused;
 * pass --refresh to request them again.
 *
 * Output (default packages/data/output/medical-citation-audit/, gitignored):
 *   inventory.json  totals, per-condition rollup, per-treatment audit, probe results
 *   treatments.csv  one row per condition/treatment
 *   citations.csv   one row per citation
 *   summary.md      readable summary with the unresolved-treatment list
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ConditionTreatmentsFile } from "../src/datasets/medical.js";
import {
  CITATION_URL_KINDS,
  auditConditionFile,
  citationPrimarySourceId,
  classifyCitationUrl,
  type CitationUrlKind,
  type OutcomeProvenance,
  type TreatmentCitationAudit,
} from "../src/datasets/medical-citation-audit.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
}

const dataDir = resolve(argValue("--dir") ?? join(packageRoot, "src/datasets/medical-data"));
const outDir = resolve(argValue("--out") ?? join(packageRoot, "output/medical-citation-audit"));
const probeCount = Number(argValue("--probe") ?? 0);
if (!Number.isInteger(probeCount) || probeCount < 0) {
  throw new Error("--probe must be a non-negative integer");
}

interface CitationRow {
  conditionSlug: string;
  treatmentName: string;
  index: number;
  kind: CitationUrlKind;
  sourceId: string | null;
  title: string;
  type: string;
  url: string;
}

const treatmentsDir = join(dataDir, "treatments");
const conditionFiles = readdirSync(treatmentsDir)
  .filter((name) => name.endsWith(".json") && name !== "index.json")
  .sort();

const audits: TreatmentCitationAudit[] = [];
const citationRows: CitationRow[] = [];
for (const fileName of conditionFiles) {
  const slug = basename(fileName, ".json");
  const file = JSON.parse(readFileSync(join(treatmentsDir, fileName), "utf8")) as ConditionTreatmentsFile;
  if (!Array.isArray(file.treatments)) {
    console.warn(`Skipped ${fileName}: no treatments array`);
    continue;
  }
  audits.push(...auditConditionFile(slug, file));
  for (const treatment of file.treatments) {
    (treatment.citations ?? []).forEach((citation, index) => {
      citationRows.push({
        conditionSlug: slug,
        treatmentName: treatment.name,
        index,
        kind: classifyCitationUrl(citation.url).kind,
        sourceId: citationPrimarySourceId(citation),
        title: citation.title ?? "",
        type: citation.type ?? "",
        url: citation.url,
      });
    });
  }
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[key(item)] = (counts[key(item)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function sumOutcomes(rows: TreatmentCitationAudit[]): Record<OutcomeProvenance, number> {
  const total: Record<OutcomeProvenance, number> = { "ai-estimated": 0, trial: 0, "name-only": 0, "unlabeled-values": 0 };
  for (const row of rows) {
    for (const key of Object.keys(total) as OutcomeProvenance[]) total[key] += row.outcomes[key];
  }
  return total;
}

const unresolved = audits.filter((audit) => !audit.hasResolvablePrimarySource);
const citationKinds = Object.fromEntries(
  CITATION_URL_KINDS.map((kind) => [kind, citationRows.filter((row) => row.kind === kind).length]),
) as Record<CitationUrlKind, number>;

const byCondition = [...new Set(audits.map((audit) => audit.conditionSlug))].map((slug) => {
  const rows = audits.filter((audit) => audit.conditionSlug === slug);
  return {
    conditionSlug: slug,
    conditionName: rows[0]?.conditionName ?? slug,
    treatments: rows.length,
    treatmentsWithoutResolvableSource: rows.filter((row) => !row.hasResolvablePrimarySource).length,
    citations: rows.reduce((sum, row) => sum + row.citationCount, 0),
    redirectCitations: rows.reduce((sum, row) => sum + row.citationKinds["vertex-grounding-redirect"], 0),
    outcomes: sumOutcomes(rows),
  };
});

interface ProbeResult {
  url: string;
  status: number | null;
  location: string | null;
  error: string | null;
}

const PROBE_INTERVAL_MS = 500;
const probeCachePath = join(outDir, "probe-cache.json");

function readProbeCache(): Map<string, ProbeResult> {
  if (process.argv.includes("--refresh") || !existsSync(probeCachePath)) return new Map();
  const cached = JSON.parse(readFileSync(probeCachePath, "utf8")) as ProbeResult[];
  return new Map(cached.map((result) => [result.url, result]));
}

async function probeRedirects(count: number): Promise<ProbeResult[]> {
  const redirects = citationRows.filter((row) => row.kind === "vertex-grounding-redirect");
  if (count === 0 || redirects.length === 0) return [];
  const step = Math.max(1, Math.floor(redirects.length / count));
  const sample = redirects.filter((_, index) => index % step === 0).slice(0, count);
  const cache = readProbeCache();
  const results: ProbeResult[] = [];
  let requested = 0;
  for (const row of sample) {
    const cached = cache.get(row.url);
    if (cached) {
      results.push(cached);
      continue;
    }
    if (requested > 0) await new Promise((done) => setTimeout(done, PROBE_INTERVAL_MS));
    requested += 1;
    try {
      const response = await fetch(row.url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
      results.push({ url: row.url, status: response.status, location: response.headers.get("location"), error: null });
    } catch (error) {
      results.push({ url: row.url, status: null, location: null, error: error instanceof Error ? error.message : String(error) });
    }
    cache.set(row.url, results[results.length - 1]!);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(probeCachePath, JSON.stringify([...cache.values()], null, 2) + "\n");
  return results;
}

const probe = await probeRedirects(probeCount);

const totals = {
  conditionFiles: byCondition.length,
  treatments: audits.length,
  citations: citationRows.length,
  citationKinds,
  treatmentsWithResolvablePrimarySource: audits.length - unresolved.length,
  treatmentsWithoutResolvablePrimarySource: unresolved.length,
  outcomes: sumOutcomes(audits),
  sideEffectRows: audits.reduce((sum, audit) => sum + audit.sideEffectRows, 0),
  numericValuesWithoutPerValueSource: audits.reduce((sum, audit) => sum + audit.numericValues, 0),
  redirectTitleDomains: countBy(audits.flatMap((audit) => audit.redirectTitles), (title) => title),
  nonRedirectNonSearchUrls: citationRows
    .filter((row) => row.kind !== "vertex-grounding-redirect" && row.kind !== "clinicaltrials-search")
    .map((row) => ({ conditionSlug: row.conditionSlug, treatmentName: row.treatmentName, kind: row.kind, url: row.url })),
  probeStatuses: countBy(probe, (result) => (result.status === null ? `error` : String(result.status))),
};

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "inventory.json"),
  JSON.stringify({ dataDir, totals, byCondition, treatments: audits, probe }, null, 2) + "\n",
);
writeFileSync(
  join(outDir, "treatments.csv"),
  toCsv(
    [
      "conditionSlug",
      "treatmentName",
      "hasResolvablePrimarySource",
      "primarySourceIds",
      "citationCount",
      ...CITATION_URL_KINDS,
      "outcomesAiEstimated",
      "outcomesTrial",
      "outcomesNameOnly",
      "outcomesUnlabeledValues",
      "sideEffectRows",
      "numericValues",
      "redirectTitles",
    ],
    audits.map((audit) => [
      audit.conditionSlug,
      audit.treatmentName,
      audit.hasResolvablePrimarySource,
      audit.primarySourceIds.join(" "),
      audit.citationCount,
      ...CITATION_URL_KINDS.map((kind) => audit.citationKinds[kind]),
      audit.outcomes["ai-estimated"],
      audit.outcomes.trial,
      audit.outcomes["name-only"],
      audit.outcomes["unlabeled-values"],
      audit.sideEffectRows,
      audit.numericValues,
      audit.redirectTitles.join(" "),
    ]),
  ),
);
writeFileSync(
  join(outDir, "citations.csv"),
  toCsv(
    ["conditionSlug", "treatmentName", "index", "kind", "sourceId", "title", "type", "url"],
    citationRows.map((row) => [row.conditionSlug, row.treatmentName, row.index, row.kind, row.sourceId, row.title, row.type, row.url]),
  ),
);

const summary = [
  "# Medical citation inventory",
  "",
  `Source: \`${dataDir}\``,
  "",
  "| Measure | Count |",
  "| --- | ---: |",
  `| Condition files | ${totals.conditionFiles} |`,
  `| Treatments | ${totals.treatments} |`,
  `| Citations | ${totals.citations} |`,
  ...CITATION_URL_KINDS.filter((kind) => citationKinds[kind] > 0).map((kind) => `| Citations: ${kind} | ${citationKinds[kind]} |`),
  `| Treatments with a resolvable primary source | ${totals.treatmentsWithResolvablePrimarySource} |`,
  `| Treatments without a resolvable primary source | ${totals.treatmentsWithoutResolvablePrimarySource} |`,
  ...(Object.entries(totals.outcomes) as [string, number][]).map(([key, value]) => `| Outcome rows: ${key} | ${value} |`),
  `| Side-effect rows (no source field) | ${totals.sideEffectRows} |`,
  `| Numeric values without a per-value source | ${totals.numericValuesWithoutPerValueSource} |`,
  ...(probe.length > 0
    ? Object.entries(totals.probeStatuses).map(([status, count]) => `| Redirect probe HTTP ${status} | ${count} of ${probe.length} |`)
    : []),
  "",
  "## Other URLs",
  "",
  ...(totals.nonRedirectNonSearchUrls.length > 0
    ? totals.nonRedirectNonSearchUrls.map((row) => `- ${row.conditionSlug} / ${row.treatmentName}: ${row.kind} ${row.url}`)
    : ["None."]),
  "",
  "## Treatments without a resolvable primary source, by condition",
  "",
  "| Condition | Unresolved / treatments | Redirect citations | AI-estimated outcomes | Trial outcomes | Name-only outcomes |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...byCondition.map(
    (row) =>
      `| ${row.conditionSlug} | ${row.treatmentsWithoutResolvableSource} / ${row.treatments} | ${row.redirectCitations} | ${row.outcomes["ai-estimated"]} | ${row.outcomes.trial} | ${row.outcomes["name-only"]} |`,
  ),
  "",
  "The per-treatment list is in `treatments.csv` (`hasResolvablePrimarySource=false`).",
  "",
].join("\n");
writeFileSync(join(outDir, "summary.md"), summary);

console.log(`Treatments: ${totals.treatments} in ${totals.conditionFiles} condition files`);
console.log(`Citations: ${totals.citations}`);
for (const kind of CITATION_URL_KINDS) {
  if (citationKinds[kind] > 0) console.log(`  ${kind}: ${citationKinds[kind]}`);
}
console.log(`Treatments with a resolvable primary source: ${totals.treatmentsWithResolvablePrimarySource}`);
console.log(`Treatments without a resolvable primary source: ${totals.treatmentsWithoutResolvablePrimarySource}`);
console.log(`Outcome rows: ${JSON.stringify(totals.outcomes)}`);
console.log(`Side-effect rows: ${totals.sideEffectRows}`);
console.log(`Numeric values without a per-value source: ${totals.numericValuesWithoutPerValueSource}`);
if (probe.length > 0) console.log(`Redirect probe statuses: ${JSON.stringify(totals.probeStatuses)}`);
console.log(`Wrote ${outDir}`);
