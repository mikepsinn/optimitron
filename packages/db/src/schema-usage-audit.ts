import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SchemaItemKind = "model" | "enum";

type UsageBucket =
  | "schema"
  | "migrations"
  | "generated"
  | "zod"
  | "runtime-prisma"
  | "runtime-libraries"
  | "api-routes"
  | "pages"
  | "components"
  | "scripts"
  | "tests"
  | "docs"
  | "other";

type Classification =
  | "core"
  | "runtime-live"
  | "tests-only"
  | "schema-only"
  | "generated-only"
  | "suspicious";

const READ_FILE_CONCURRENCY = 64;

interface SchemaItem {
  kind: SchemaItemKind;
  name: string;
  line: number;
}

interface FileMatch {
  path: string;
  matches: number;
}

interface BucketStat {
  files: number;
  matches: number;
}

interface ModelAuditEntry {
  name: string;
  schemaLine: number;
  classification: Classification;
  buckets: Record<UsageBucket, BucketStat>;
  keyFiles: FileMatch[];
  notes: string[];
  directPrismaFiles: number;
  directPrismaMatches: number;
}

interface EnumAuditEntry {
  name: string;
  schemaLine: number;
  referenceFiles: number;
  references: number;
}

interface NamingConcern {
  models: string[];
  severity: "high" | "medium" | "low";
  summary: string;
}

interface MissingModelCandidate {
  name: string;
  classification: "missing-first-class-model-candidate";
  summary: string;
  evidenceFiles: number;
  evidenceMatches: number;
  evidence: FileMatch[];
}

export interface SchemaUsageAuditReport {
  schemaPath: string;
  modelCount: number;
  enumCount: number;
  models: ModelAuditEntry[];
  enums: EnumAuditEntry[];
  namingConcerns: NamingConcern[];
  missingModelCandidates: MissingModelCandidate[];
}

interface AuditOptions {
  repoRoot?: string;
}

interface MissingConceptRule {
  name: string;
  absentModels: string[];
  summary: string;
  thresholdFiles: number;
  thresholdPatterns: number;
  patterns: Array<{ label: string; regex: RegExp }>;
}

interface AuditedFile {
  relativePath: string;
  bucket: UsageBucket;
  text: string;
}

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const DEFAULT_REPO_ROOT = path.resolve(CURRENT_DIR, "..", "..", "..");
const DEFAULT_MARKDOWN_OUTPUT = path.join(
  DEFAULT_REPO_ROOT,
  "docs",
  "SCHEMA_USAGE_AUDIT.md",
);
const DEFAULT_JSON_OUTPUT = path.join(
  DEFAULT_REPO_ROOT,
  "docs",
  "generated",
  "schema-usage-audit.json",
);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".prisma",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
  ".css",
  ".txt",
]);

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "output",
]);

const EXCLUDED_RELATIVE_DIRECTORIES = new Set(["reports", "screenshots"]);

const EXCLUDED_RELATIVE_PATHS = new Set([
  "docs/SCHEMA_USAGE_AUDIT.md",
  "docs/generated/schema-usage-audit.json",
  "packages/db/src/schema-usage-audit.ts",
  "packages/db/src/__tests__/schema-usage-audit.test.ts",
  "packages/db/src/__tests__/__snapshots__/schema-usage-audit.test.ts.snap",
]);

const BUCKET_ORDER: UsageBucket[] = [
  "runtime-prisma",
  "api-routes",
  "pages",
  "components",
  "runtime-libraries",
  "scripts",
  "tests",
  "docs",
  "schema",
  "migrations",
  "generated",
  "zod",
  "other",
];

const CORE_MODELS = new Set([
  "User",
  "Person",
  "Organization",
  "OrganizationMember",
  "Task",
  "TaskClaim",
  "SourceArtifact",
  "TaskSourceArtifact",
  "TaskEdge",
  "TaskImpactEstimateSet",
  "TaskImpactFrameEstimate",
  "TaskImpactMetric",
  "TaskImpactSourceArtifact",
]);

const DIRECT_PRISMA_BUCKETS = new Set<UsageBucket>([
  "runtime-libraries",
  "api-routes",
  "pages",
  "components",
  "scripts",
]);

const MODEL_NOTES: Record<string, string[]> = {
  CitizenBillVote: [
    "External bill stance record. Bill metadata currently comes from the Congress fetchers rather than a first-class Prisma bill table.",
  ],
  ReferendumVote: [
    "Internal platform vote tied to a real Referendum row, referral attribution, and VOTE token / reward flows.",
  ],
  UserPreference: [
    "Single-row push reminder schedule settings. The current name collides conceptually with NotificationPreference.",
  ],
  NotificationPreference: [
    "Per-type, per-channel delivery toggle. The current name collides conceptually with UserPreference.",
  ],
  WebPushSubscription: [
    "Kept intentionally specific: this stores browser Web Push protocol material, not a generic contact point abstraction.",
  ],
  WishocraticEncryptedAllocation: [
    "Coexists with normalized WishocraticAllocation rows today; comments should be read as historical intent rather than exclusive authority.",
  ],
};

const MISSING_CONCEPT_RULES: MissingConceptRule[] = [
  {
    name: "CitizenBill",
    absentModels: ["CitizenBill", "Bill"],
    summary:
      "Legislative bill metadata is heavily used through external fetchers, classification flows, UI cards, and saved CitizenBillVote rows, but there is no first-class Prisma bill model yet.",
    thresholdFiles: 8,
    thresholdPatterns: 3,
    patterns: [
      { label: "External bill fetchers", regex: /\bfetchBills(?:ByType)?\b/g },
      { label: "Runtime bill DTO", regex: /\bClassifiedBill\b/g },
      {
        label: "Bill UI surface",
        regex: /\b(?:BillCard|BillVoteCard|BillListCard)\b/g,
      },
      { label: "Civic bills API", regex: /\bcivic\/bills\b/g },
      { label: "Stored bill identifiers", regex: /\bbillId\b/g },
    ],
  },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function lowerCamelCase(modelName: string): string {
  if (!modelName) {
    return modelName;
  }
  return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
}

function createEmptyBucketStats(): Record<UsageBucket, BucketStat> {
  return {
    schema: { files: 0, matches: 0 },
    migrations: { files: 0, matches: 0 },
    generated: { files: 0, matches: 0 },
    zod: { files: 0, matches: 0 },
    "runtime-prisma": { files: 0, matches: 0 },
    "runtime-libraries": { files: 0, matches: 0 },
    "api-routes": { files: 0, matches: 0 },
    pages: { files: 0, matches: 0 },
    components: { files: 0, matches: 0 },
    scripts: { files: 0, matches: 0 },
    tests: { files: 0, matches: 0 },
    docs: { files: 0, matches: 0 },
    other: { files: 0, matches: 0 },
  };
}

function bucketForRelativePath(relativePath: string): UsageBucket {
  if (relativePath === "packages/db/prisma/schema.prisma") {
    return "schema";
  }
  if (relativePath.startsWith("packages/db/prisma/migrations/")) {
    return "migrations";
  }
  if (relativePath.startsWith("packages/db/src/generated/")) {
    return "generated";
  }
  if (relativePath.startsWith("packages/db/src/zod/")) {
    return "zod";
  }
  if (
    relativePath.includes("/__tests__/") ||
    relativePath.endsWith(".test.ts") ||
    relativePath.endsWith(".test.tsx") ||
    relativePath.endsWith(".spec.ts") ||
    relativePath.endsWith(".spec.tsx")
  ) {
    return "tests";
  }
  if (relativePath.startsWith("apps/optimitron/src/app/api/")) {
    return "api-routes";
  }
  if (
    relativePath.startsWith("apps/optimitron/src/app/") &&
    /\/page\.(ts|tsx)$/.test(relativePath)
  ) {
    return "pages";
  }
  if (relativePath.startsWith("apps/optimitron/src/components/")) {
    return "components";
  }
  if (
    relativePath.startsWith("apps/optimitron/scripts/") ||
    relativePath.startsWith("packages/db/prisma/seed") ||
    relativePath.endsWith(".sh") ||
    relativePath.endsWith(".ps1")
  ) {
    return "scripts";
  }
  if (
    relativePath.startsWith("apps/optimitron/src/lib/") ||
    relativePath.startsWith("packages/data/src/") ||
    relativePath.startsWith("packages/opg/src/") ||
    relativePath.startsWith("packages/obg/src/") ||
    relativePath.startsWith("packages/optimizer/src/") ||
    relativePath.startsWith("packages/extension/src/") ||
    relativePath.startsWith("packages/db/src/")
  ) {
    return "runtime-libraries";
  }
  if (
    relativePath.startsWith("docs/") ||
    relativePath === "README.md" ||
    relativePath.endsWith("/README.md") ||
    relativePath === "AGENTS.md"
  ) {
    return "docs";
  }
  return "other";
}

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function shouldSkipDirectory(name: string): boolean {
  return (
    EXCLUDED_DIRECTORIES.has(name) ||
    (name.startsWith(".") && name !== ".github")
  );
}

async function collectTextFiles(root: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);
      const relativePath = toPosixPath(path.relative(root, absolutePath));

      if (
        entry.isDirectory() &&
        (shouldSkipDirectory(entry.name) ||
          EXCLUDED_RELATIVE_DIRECTORIES.has(relativePath))
      ) {
        continue;
      }
      if (!entry.isDirectory() && entry.name.startsWith(".")) {
        continue;
      }
      if (EXCLUDED_RELATIVE_PATHS.has(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name);
      if (!TEXT_EXTENSIONS.has(extension) && entry.name !== "AGENTS.md") {
        continue;
      }

      result.push(absolutePath);
    }
  }

  await walk(root);
  return result;
}

async function loadAuditedFiles(root: string): Promise<AuditedFile[]> {
  const files = await collectTextFiles(root);
  const loadedFiles: AuditedFile[] = [];

  for (let index = 0; index < files.length; index += READ_FILE_CONCURRENCY) {
    const batch = files.slice(index, index + READ_FILE_CONCURRENCY);
    loadedFiles.push(
      ...(await Promise.all(
        batch.map(async (filePath) => {
          const relativePath = toPosixPath(path.relative(root, filePath));
          return {
            relativePath,
            bucket: bucketForRelativePath(relativePath),
            text: await fs.readFile(filePath, "utf8"),
          } satisfies AuditedFile;
        }),
      )),
    );
  }

  return loadedFiles.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
}

async function readSchemaItems(schemaPath: string): Promise<SchemaItem[]> {
  const schemaText = await fs.readFile(schemaPath, "utf8");
  const items: SchemaItem[] = [];
  const lines = schemaText.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const match = /^(model|enum)\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/.exec(line);
    if (!match) {
      continue;
    }

    const kind = match[1];
    const name = match[2];
    if (!kind || !name) {
      continue;
    }

    items.push({
      kind: kind as SchemaItemKind,
      name,
      line: index + 1,
    });
  }

  return items;
}

function classifyModel(
  entry: Omit<ModelAuditEntry, "classification">,
): Classification {
  if (CORE_MODELS.has(entry.name)) {
    return "core";
  }

  const runtimeFiles =
    entry.buckets["runtime-prisma"].files +
    entry.buckets["runtime-libraries"].files +
    entry.buckets["api-routes"].files +
    entry.buckets.pages.files +
    entry.buckets.components.files +
    entry.buckets.scripts.files;

  if (runtimeFiles > 0) {
    return "runtime-live";
  }

  if (entry.buckets.tests.files > 0) {
    return "tests-only";
  }

  const generatedLikeFiles =
    entry.buckets.generated.files + entry.buckets.zod.files;
  const nonBaselineFiles =
    entry.buckets.docs.files +
    entry.buckets.other.files +
    entry.buckets["runtime-prisma"].files +
    entry.buckets["runtime-libraries"].files +
    entry.buckets["api-routes"].files +
    entry.buckets.pages.files +
    entry.buckets.components.files +
    entry.buckets.scripts.files;

  if (generatedLikeFiles > 0 && nonBaselineFiles === 0) {
    return "generated-only";
  }

  if (nonBaselineFiles === 0) {
    return "schema-only";
  }

  return "suspicious";
}

function buildNamingConcerns(models: readonly SchemaItem[]): NamingConcern[] {
  const modelNames = new Set(
    models.filter((item) => item.kind === "model").map((item) => item.name),
  );
  const concerns: NamingConcern[] = [];

  if (
    modelNames.has("UserPreference") &&
    modelNames.has("NotificationPreference")
  ) {
    concerns.push({
      models: ["UserPreference", "NotificationPreference"],
      severity: "high",
      summary:
        "UserPreference stores single-row push reminder schedule settings, while NotificationPreference stores per-type/channel toggles. The overlapping names are likely to confuse future developers.",
    });
  }

  return concerns;
}

function buildMissingModelCandidates(
  models: readonly SchemaItem[],
  files: readonly AuditedFile[],
): MissingModelCandidate[] {
  const modelNames = new Set(
    models.filter((item) => item.kind === "model").map((item) => item.name),
  );
  const results: MissingModelCandidate[] = [];

  for (const rule of MISSING_CONCEPT_RULES) {
    if (rule.absentModels.some((modelName) => modelNames.has(modelName))) {
      continue;
    }

    const filesByPath = new Map<string, number>();
    const matchedPatternLabels = new Set<string>();

    for (const file of files) {
      const { relativePath, bucket, text } = file;
      if (
        ![
          "runtime-libraries",
          "api-routes",
          "pages",
          "components",
          "scripts",
        ].includes(bucket)
      ) {
        continue;
      }
      let fileMatches = 0;

      for (const pattern of rule.patterns) {
        const matches = countMatches(text, pattern.regex);
        if (matches > 0) {
          matchedPatternLabels.add(pattern.label);
          fileMatches += matches;
        }
      }

      if (fileMatches > 0) {
        filesByPath.set(relativePath, fileMatches);
      }
    }

    if (
      filesByPath.size < rule.thresholdFiles ||
      matchedPatternLabels.size < rule.thresholdPatterns
    ) {
      continue;
    }

    const evidence = [...filesByPath.entries()]
      .map(([file, matches]) => ({ path: file, matches }))
      .sort((left, right) => {
        if (right.matches !== left.matches) {
          return right.matches - left.matches;
        }
        return left.path.localeCompare(right.path);
      });

    results.push({
      name: rule.name,
      classification: "missing-first-class-model-candidate",
      summary: rule.summary,
      evidenceFiles: evidence.length,
      evidenceMatches: evidence.reduce((sum, file) => sum + file.matches, 0),
      evidence: evidence.slice(0, 8),
    });
  }

  return results;
}

function topFiles(filesByBucket: Map<UsageBucket, FileMatch[]>): FileMatch[] {
  const combined = new Map<string, { matches: number; bucketRank: number }>();

  for (const bucket of BUCKET_ORDER) {
    const matches = filesByBucket.get(bucket) ?? [];
    for (const match of matches) {
      const bucketRank = BUCKET_ORDER.indexOf(bucket);
      const current = combined.get(match.path);
      if (!current) {
        combined.set(match.path, { matches: match.matches, bucketRank });
        continue;
      }

      combined.set(match.path, {
        matches: current.matches + match.matches,
        bucketRank: Math.min(current.bucketRank, bucketRank),
      });
    }
  }

  return [...combined.entries()]
    .map(([filePath, value]) => ({
      path: filePath,
      matches: value.matches,
      bucketRank: value.bucketRank,
    }))
    .sort((left, right) => {
      const bucketOrder = left.bucketRank - right.bucketRank;
      if (bucketOrder !== 0) {
        return bucketOrder;
      }
      if (right.matches !== left.matches) {
        return right.matches - left.matches;
      }
      return left.path.localeCompare(right.path);
    })
    .slice(0, 8)
    .map(({ bucketRank: _bucketRank, ...file }) => file);
}

function relativeLinkFromDocs(relativePath: string, line?: number): string {
  const docRelativePath = path.posix.join("..", relativePath);
  const label = line ? `${relativePath}#L${line}` : relativePath;
  const href = line ? `${docRelativePath}#L${line}` : docRelativePath;
  return `[${label}](${href})`;
}

function formatBucketStat(stat: BucketStat): string {
  return `${stat.files} files / ${stat.matches} matches`;
}

export async function generateSchemaUsageAudit(
  options: AuditOptions = {},
): Promise<SchemaUsageAuditReport> {
  const repoRoot = options.repoRoot
    ? path.resolve(options.repoRoot)
    : DEFAULT_REPO_ROOT;
  const schemaPath = path.join(
    repoRoot,
    "packages",
    "db",
    "prisma",
    "schema.prisma",
  );
  const schemaItems = await readSchemaItems(schemaPath);
  const models = schemaItems.filter((item) => item.kind === "model");
  const enums = schemaItems.filter((item) => item.kind === "enum");
  const files = await loadAuditedFiles(repoRoot);

  const modelEntries: ModelAuditEntry[] = [];

  for (const model of models) {
    const buckets = createEmptyBucketStats();
    const filesByBucket = new Map<UsageBucket, FileMatch[]>();
    const modelRegex = new RegExp(`\\b${escapeRegExp(model.name)}\\b`, "g");
    const delegateRegex = new RegExp(
      `\\b(?:prisma|tx|trx|transaction|db)\\.${escapeRegExp(lowerCamelCase(model.name))}\\b`,
      "g",
    );

    let directPrismaFiles = 0;
    let directPrismaMatches = 0;

    for (const file of files) {
      const { text, relativePath, bucket } = file;
      const symbolMatches = countMatches(text, modelRegex);
      const prismaMatches = DIRECT_PRISMA_BUCKETS.has(bucket)
        ? countMatches(text, delegateRegex)
        : 0;
      const bucketMatches = symbolMatches + prismaMatches;

      if (bucketMatches === 0) {
        continue;
      }

      buckets[bucket].files += 1;
      buckets[bucket].matches += bucketMatches;

      const bucketEntries = filesByBucket.get(bucket) ?? [];
      bucketEntries.push({ path: relativePath, matches: bucketMatches });
      filesByBucket.set(bucket, bucketEntries);

      if (prismaMatches > 0) {
        buckets["runtime-prisma"].files += 1;
        buckets["runtime-prisma"].matches += prismaMatches;
        directPrismaFiles += 1;
        directPrismaMatches += prismaMatches;

        const runtimePrismaEntries = filesByBucket.get("runtime-prisma") ?? [];
        runtimePrismaEntries.push({
          path: relativePath,
          matches: prismaMatches,
        });
        filesByBucket.set("runtime-prisma", runtimePrismaEntries);
      }
    }

    const dedupedFilesByBucket = new Map<UsageBucket, FileMatch[]>();
    for (const [bucket, bucketFiles] of filesByBucket.entries()) {
      const merged = new Map<string, number>();
      for (const entry of bucketFiles) {
        merged.set(entry.path, (merged.get(entry.path) ?? 0) + entry.matches);
      }
      dedupedFilesByBucket.set(
        bucket,
        [...merged.entries()]
          .map(([file, matches]) => ({ path: file, matches }))
          .sort((left, right) => {
            if (right.matches !== left.matches) {
              return right.matches - left.matches;
            }
            return left.path.localeCompare(right.path);
          }),
      );
    }

    const entryWithoutClassification = {
      name: model.name,
      schemaLine: model.line,
      buckets,
      keyFiles: topFiles(dedupedFilesByBucket),
      notes: [...(MODEL_NOTES[model.name] ?? [])],
      directPrismaFiles,
      directPrismaMatches,
    };

    const classification = classifyModel(entryWithoutClassification);

    if (classification !== "core" && classification !== "runtime-live") {
      entryWithoutClassification.notes.push(
        "No direct runtime evidence found beyond schema/generated/test support. Review whether this model is intentionally dormant or carrying unnecessary complexity.",
      );
    }

    modelEntries.push({
      ...entryWithoutClassification,
      classification,
    });
  }

  const enumEntries: EnumAuditEntry[] = [];
  for (const enumItem of enums) {
    const enumRegex = new RegExp(`\\b${escapeRegExp(enumItem.name)}\\b`, "g");
    let referenceFiles = 0;
    let references = 0;

    for (const file of files) {
      const matches = countMatches(file.text, enumRegex);
      if (matches === 0) {
        continue;
      }
      referenceFiles += 1;
      references += matches;
    }

    enumEntries.push({
      name: enumItem.name,
      schemaLine: enumItem.line,
      referenceFiles,
      references,
    });
  }

  const namingConcerns = buildNamingConcerns(schemaItems);
  const missingModelCandidates = buildMissingModelCandidates(
    schemaItems,
    files,
  );

  return {
    schemaPath: toPosixPath(path.relative(repoRoot, schemaPath)),
    modelCount: modelEntries.length,
    enumCount: enumEntries.length,
    models: modelEntries.sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    enums: enumEntries.sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    namingConcerns,
    missingModelCandidates,
  };
}

export function renderSchemaUsageAuditMarkdown(
  report: SchemaUsageAuditReport,
): string {
  const classificationCounts = report.models.reduce<
    Record<Classification, number>
  >(
    (counts, model) => {
      counts[model.classification] += 1;
      return counts;
    },
    {
      core: 0,
      "runtime-live": 0,
      "tests-only": 0,
      "schema-only": 0,
      "generated-only": 0,
      suspicious: 0,
    },
  );

  const summaryLines = [
    "# Schema Usage Audit",
    "",
    `- Schema: ${relativeLinkFromDocs(report.schemaPath)}`,
    `- Models scanned: ${report.modelCount}`,
    `- Enums scanned: ${report.enumCount}`,
    `- Classification summary: core ${classificationCounts.core}, runtime-live ${classificationCounts["runtime-live"]}, tests-only ${classificationCounts["tests-only"]}, schema-only ${classificationCounts["schema-only"]}, generated-only ${classificationCounts["generated-only"]}, suspicious ${classificationCounts.suspicious}`,
    "",
    "## Vote Model Clarification",
    "",
    "- `CitizenBillVote` records a user's stance on an external legislative bill plus an optional CBA snapshot and share identifier.",
    "- `Referendum` and `ReferendumVote` represent internal Optimitron platform questions with lifecycle, referral attribution, and VOTE token flows.",
    "- There is no first-class `CitizenBill` table today because bill metadata is fetched from external Congress pipelines rather than persisted as a canonical local entity.",
    "",
    "## Naming Collisions and Ambiguity",
    "",
  ];

  if (report.namingConcerns.length === 0) {
    summaryLines.push("- None detected.");
  } else {
    for (const concern of report.namingConcerns) {
      summaryLines.push(
        `- **${concern.severity.toUpperCase()}**: \`${concern.models.join(" / ")}\` — ${concern.summary}`,
      );
    }
  }

  summaryLines.push("", "## Missing First-Class Model Candidates", "");

  if (report.missingModelCandidates.length === 0) {
    summaryLines.push("- None detected.");
  } else {
    for (const candidate of report.missingModelCandidates) {
      summaryLines.push(`### ${candidate.name}`, "");
      summaryLines.push(
        `- Classification: \`${candidate.classification}\``,
        `- Summary: ${candidate.summary}`,
        `- Evidence: ${candidate.evidenceFiles} files / ${candidate.evidenceMatches} matches`,
        "- Key files:",
      );
      for (const evidence of candidate.evidence) {
        summaryLines.push(
          `  - ${relativeLinkFromDocs(evidence.path)} (${evidence.matches} matches)`,
        );
      }
      summaryLines.push("");
    }
  }

  summaryLines.push("## Model Inventory", "");
  summaryLines.push(
    "| Model | Classification | Runtime Prisma | Runtime Surface | Tests | Generated/Zod | Docs |",
  );
  summaryLines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: |");

  for (const model of report.models) {
    const runtimeSurfaceFiles =
      model.buckets["api-routes"].files +
      model.buckets.pages.files +
      model.buckets.components.files +
      model.buckets["runtime-libraries"].files +
      model.buckets.scripts.files;
    const generatedAndZodFiles =
      model.buckets.generated.files + model.buckets.zod.files;
    summaryLines.push(
      `| ${model.name} | \`${model.classification}\` | ${model.directPrismaFiles} | ${runtimeSurfaceFiles} | ${model.buckets.tests.files} | ${generatedAndZodFiles} | ${model.buckets.docs.files} |`,
    );
  }

  for (const model of report.models) {
    summaryLines.push("", `### ${model.name}`, "");
    summaryLines.push(
      `- Schema: ${relativeLinkFromDocs(report.schemaPath, model.schemaLine)}`,
      `- Classification: \`${model.classification}\``,
      `- Direct Prisma usage: ${model.directPrismaFiles} files / ${model.directPrismaMatches} matches`,
      "- Usage counts by bucket:",
    );

    for (const bucket of BUCKET_ORDER) {
      const stat = model.buckets[bucket];
      if (stat.files === 0) {
        continue;
      }
      summaryLines.push(`  - \`${bucket}\`: ${formatBucketStat(stat)}`);
    }

    summaryLines.push("- Key files:");
    if (model.keyFiles.length === 0) {
      summaryLines.push("  - none");
    } else {
      for (const file of model.keyFiles) {
        summaryLines.push(
          `  - ${relativeLinkFromDocs(file.path)} (${file.matches} matches)`,
        );
      }
    }

    summaryLines.push("- Notes:");
    if (model.notes.length === 0) {
      summaryLines.push("  - none");
    } else {
      for (const note of model.notes) {
        summaryLines.push(`  - ${note}`);
      }
    }
  }

  summaryLines.push("", "## Enum Inventory", "");
  summaryLines.push("| Enum | Schema | Reference Files | Total References |");
  summaryLines.push("| --- | --- | ---: | ---: |");
  for (const enumEntry of report.enums) {
    summaryLines.push(
      `| ${enumEntry.name} | ${relativeLinkFromDocs(report.schemaPath, enumEntry.schemaLine)} | ${enumEntry.referenceFiles} | ${enumEntry.references} |`,
    );
  }

  summaryLines.push("");
  return summaryLines.join("\n");
}

export async function writeSchemaUsageAudit(
  report: SchemaUsageAuditReport,
): Promise<void> {
  const markdown = renderSchemaUsageAuditMarkdown(report);
  const json = JSON.stringify(report, null, 2);

  await fs.mkdir(path.dirname(DEFAULT_MARKDOWN_OUTPUT), { recursive: true });
  await fs.mkdir(path.dirname(DEFAULT_JSON_OUTPUT), { recursive: true });
  await fs.writeFile(DEFAULT_MARKDOWN_OUTPUT, `${markdown}`, "utf8");
  await fs.writeFile(DEFAULT_JSON_OUTPUT, `${json}\n`, "utf8");
}

export async function main(): Promise<void> {
  const report = await generateSchemaUsageAudit();
  await writeSchemaUsageAudit(report);
  process.stdout.write(
    `Wrote schema usage audit to ${toPosixPath(path.relative(DEFAULT_REPO_ROOT, DEFAULT_MARKDOWN_OUTPUT))}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  void main().catch((error) => {
    console.error("Failed to generate schema usage audit:", error);
    process.exitCode = 1;
  });
}
