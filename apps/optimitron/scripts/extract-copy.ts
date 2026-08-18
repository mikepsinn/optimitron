#!/usr/bin/env tsx
/**
 * extract-copy.ts — Extract all human-readable copy from TSX files.
 *
 * Scans pages and components, pulls out text content (titles, subtitles,
 * descriptions, button labels, JSX text nodes), and outputs a markdown
 * checklist grouped by file for copy review.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run extract:copy              # stdout
 *   pnpm --filter @optimitron/web run extract:copy > COPY_REVIEW.md
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { resolve, dirname, relative, extname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = resolve(__dirname, "..");
const SRC_ROOT = resolve(WEB_ROOT, "src");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SCAN_DIRS = ["app", "components"];

const EXCLUDE_PATTERNS = [
  /[\\/]emails[\\/]/,
  /\.test\.(ts|tsx)$/,
  /globals\.css$/,
  /[\\/]ui[\\/]/, // primitives — no user-facing copy
  /[\\/]animations[\\/]/, // animation wrappers
  /[\\/]providers[\\/]/, // context providers
  /[\\/]api[\\/]/, // API routes — not user-facing
  /[\\/]og[\\/]/, // OG image generators
  /[\\/]chat[\\/]/, // chat cards — data display, not narrated copy
  /[\\/]sharing[\\/]/, // share buttons — functional, not copy
  /[\\/]navigation[\\/]/, // nav links — structural
  /[\\/]notifications[\\/]/, // notification prompts — functional
  /ThemeProvider/,
  /Providers\.tsx/,
  /ClientLayout\.tsx/,
  /layout\.tsx/, // layouts are structural
  /loading\.tsx/,
  /error\.tsx/,
  /not-found\.tsx/,
];

// Props that typically contain user-facing copy
const COPY_PROPS = [
  "title",
  "subtitle",
  "description",
  "heading",
  "subheading",
  "label",
  "placeholder",
  "cta",
  "buttonText",
  "alt",
];

// Minimum length for a text string to be interesting
// Short labels ("Sign In", "Read paper") aren't voice-review-worthy
const MIN_TEXT_LENGTH = 25;

// Skip strings that are clearly code/technical
const SKIP_PATTERNS = [
  /^(https?:\/\/|mailto:)/,
  /^(className|href|src|key|id|type|rel|target)$/,
  /^[a-z][a-zA-Z]*$/, // single camelCase word (likely a variable)
  /^\d+(\.\d+)?$/, // pure numbers
  /^(true|false|null|undefined)$/,
  /^(div|span|section|button|a|p|h[1-6]|ul|li|img|svg|path)$/,
  /^(sm:|md:|lg:|xl:|2xl:)/, // Tailwind breakpoint
  /^(bg-|text-|border-|shadow-|font-|px-|py-|p-|m-|mt-|mb-|flex|grid|space-)/, // Tailwind classes
  /^#[0-9a-fA-F]+$/, // hex colors
  /^rgba?\(/,
  /^\{/, // template expressions
  /^import /,
  /^export /,
  /^const /,
  /^function /,
  /^return /,
  /^[A-Z][a-zA-Z]+\.(tsx|ts|js|jsx)$/, // file names
];

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full));
    } else if (/\.tsx$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Copy extraction
// ---------------------------------------------------------------------------

interface CopyEntry {
  line: number;
  text: string;
  context: string; // e.g. "prop:title", "jsx-text", "template-literal"
}

// Patterns that indicate the string is code, not copy
const CODE_INDICATORS = [
  /className=/,
  /\breturn\s*\(/,
  /\bconst\s+/,
  /\bfunction\s+/,
  /\bawait\s+/,
  /\bimport\s+/,
  /\bexport\s+/,
  /=>\s*\{/,
  /\bif\s*\(/,
  /\bswitch\s*\(/,
  /<div\s/,
  /<span\s/,
  /<section\s/,
  /<motion\./,
  /\{\.\.\./, // spread operator
  /\?\.\w/, // optional chaining
  /\w+\(\{/, // function call with object arg
  /\.map\(/,
  /\.filter\(/,
  /\.reduce\(/,
  /\.forEach\(/,
  /\.toFixed\(/,
  /\.toLocaleString\(/,
  /useState|useRef|useEffect|useInView/,
  /border-primary|bg-background|text-foreground/, // Tailwind in string
  /shadow-\[/,
  /px-\d|py-\d|p-\d/,
];

function shouldSkip(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_TEXT_LENGTH) return true;
  if (SKIP_PATTERNS.some((p) => p.test(trimmed))) return true;
  // Skip if it contains code patterns
  if (CODE_INDICATORS.some((p) => p.test(trimmed))) return true;
  // Skip if it's mostly special characters (CSS, code)
  const alphaRatio =
    (trimmed.match(/[a-zA-Z]/g)?.length ?? 0) / trimmed.length;
  if (alphaRatio < 0.4) return true;
  // Skip very short nav-style labels (e.g. "← Back", "Read paper →")
  if (trimmed.length < 20 && /^[←→↑↓]/.test(trimmed)) return true;
  return false;
}

function extractCopy(filePath: string): CopyEntry[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const entries: CopyEntry[] = [];
  const seen = new Set<string>();

  const addEntry = (line: number, text: string, context: string) => {
    const clean = text
      .replace(/\s+/g, " ")
      .replace(/&apos;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&rarr;/g, "→")
      .replace(/&times;/g, "×")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (shouldSkip(clean)) return;
    // Deduplicate within same file
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ line, text: clean, context });
  };

  // 1. Extract prop values: title="...", subtitle="...", description="...", etc.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const prop of COPY_PROPS) {
      // Match prop="string literal"
      const propRegex = new RegExp(`${prop}=["']([^"']+)["']`, "g");
      let match;
      while ((match = propRegex.exec(line)) !== null) {
        addEntry(i + 1, match[1]!, `prop:${prop}`);
      }
      // Match prop={`template literal`}
      const templateRegex = new RegExp(
        `${prop}=\\{[\`]([^\`]+)[\`]\\}`,
        "g",
      );
      while ((match = templateRegex.exec(line)) !== null) {
        addEntry(i + 1, match[1]!, `prop:${prop}`);
      }
    }
  }

  // 2. Extract JSX text content — text between > and <
  //    This catches: <p>Some text here</p>, <h2>Title</h2>, etc.
  //    We join multiline JSX text blocks.
  const jsxTextRegex = />([^<>{]+)</g;
  let jsxMatch;
  while ((jsxMatch = jsxTextRegex.exec(content)) !== null) {
    const text = jsxMatch[1]!;
    // Find line number
    const upToMatch = content.slice(0, jsxMatch.index);
    const lineNum = (upToMatch.match(/\n/g)?.length ?? 0) + 1;
    addEntry(lineNum, text, "jsx-text");
  }

  // 3. Extract string literals in objects/arrays that look like copy
  //    e.g. { title: "...", description: "..." }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    for (const prop of [
      "title",
      "description",
      "subtitle",
      "label",
      "cta",
      "why",
      "desc",
      "myth",
      "reality",
      "text",
      "heading",
      "subheading",
      "pathA",
      "pathB",
      "metric",
      "ratio",
    ]) {
      // Match key: "value" or key: 'value'
      const objRegex = new RegExp(
        `(?:^|[\\s,{])${prop}:\\s*["']([^"']+)["']`,
        "g",
      );
      let match;
      while ((match = objRegex.exec(line)) !== null) {
        addEntry(i + 1, match[1]!, `obj:${prop}`);
      }
      // Match key:\n  "multiline value"
      const nextLine = lines[i + 1]?.trim();
      if (line.trim().endsWith(`${prop}:`) && nextLine?.startsWith('"')) {
        // Collect until closing quote
        let collected = "";
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          collected += " " + lines[j]!.trim();
          if (
            lines[j]!.trim().endsWith('",') ||
            lines[j]!.trim().endsWith('"')
          ) {
            break;
          }
        }
        const cleaned = collected.replace(/^[\s"]+|[",\s]+$/g, "");
        addEntry(i + 1, cleaned, `obj:${prop}`);
      }
    }
  }

  // 4. Extract template literal strings that are multiline and long
  //    (often used for descriptions in component code)
  //    Only keep ones that look like natural language, not JSX/code.
  const templateRegex = /[`]([^`]{30,})[`]/g;
  let tmplMatch;
  while ((tmplMatch = templateRegex.exec(content)) !== null) {
    const text = tmplMatch[1]!;
    const upToMatch = content.slice(0, tmplMatch.index);
    const lineNum = (upToMatch.match(/\n/g)?.length ?? 0) + 1;
    // Skip if it contains JSX tags or code patterns
    if (/<\w+[\s>]/.test(text)) continue;
    if (/className|useState|useRef|\.map\(|=>/.test(text)) continue;
    // Must have a decent ratio of natural language
    const words = text.split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w));
    if (words.length < 5) continue;
    addEntry(lineNum, text, "template-literal");
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Markdown output
// ---------------------------------------------------------------------------

function formatMarkdown(
  fileEntries: Map<string, CopyEntry[]>,
): string {
  const lines: string[] = [];

  lines.push("# Copy Review Checklist");
  lines.push("");
  lines.push(
    "> Extracted from all pages and components. Review each item for Wishonia voice compliance.",
  );
  lines.push(
    "> Wishonia = Philomena Cunk meets a disappointed systems engineer. Deadpan, data-first, British-ish.",
  );
  lines.push("");
  lines.push("## Voice Rules Quick Reference");
  lines.push("- **Deadpan delivery** — horrifying facts stated as mildly interesting observations");
  lines.push("- **Data-first** — lead with numbers, costs, percentages");
  lines.push("- **British dryness** — understatement, not outrage");
  lines.push("- **Short sentences** — punchy. Declarative. Then a devastating follow-up.");
  lines.push("- **No startup slop** — no \"empower\", \"leverage\", \"unlock\", \"journey\", \"reimagine\"");
  lines.push("- **No motivational poster energy** — if it could be on a LinkedIn post, rewrite it");
  lines.push("");

  let totalItems = 0;

  // Sort files: pages first, then components
  const sortedFiles = [...fileEntries.entries()].sort(([a], [b]) => {
    const aIsPage = a.includes("app/") || a.includes("app\\");
    const bIsPage = b.includes("app/") || b.includes("app\\");
    if (aIsPage && !bIsPage) return -1;
    if (!aIsPage && bIsPage) return 1;
    return a.localeCompare(b);
  });

  for (const [file, entries] of sortedFiles) {
    if (entries.length === 0) continue;

    const relPath = relative(SRC_ROOT, file).replace(/\\/g, "/");
    lines.push(`### \`${relPath}\``);
    lines.push("");

    for (const entry of entries) {
      const truncated =
        entry.text.length > 200
          ? entry.text.slice(0, 200) + "..."
          : entry.text;

      lines.push(
        `- [ ] **L${entry.line}** (${entry.context}): ${truncated}`,
      );
      totalItems++;
    }
    lines.push("");
  }

  // Summary at top
  const summary = [
    `**${totalItems} copy items** across **${fileEntries.size} files**. Good luck.`,
    "",
  ];
  lines.splice(4, 0, ...summary);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const allFiles: string[] = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = resolve(SRC_ROOT, dir);
    try {
      allFiles.push(...walkDir(fullDir));
    } catch {
      console.error(`Warning: Could not scan ${fullDir}`);
    }
  }

  // Filter excluded
  const files = allFiles.filter(
    (f) => !EXCLUDE_PATTERNS.some((p) => p.test(f)),
  );

  const fileEntries = new Map<string, CopyEntry[]>();

  for (const file of files) {
    const entries = extractCopy(file);
    if (entries.length > 0) {
      fileEntries.set(file, entries);
    }
  }

  const markdown = formatMarkdown(fileEntries);

  // Write to file
  const outPath = resolve(WEB_ROOT, "COPY_REVIEW.md");
  writeFileSync(outPath, markdown, "utf-8");
  console.log(`Wrote ${outPath}`);
  console.log(
    `Found ${[...fileEntries.values()].reduce((n, e) => n + e.length, 0)} copy items across ${fileEntries.size} files.`,
  );
}

main();
