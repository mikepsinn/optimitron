#!/usr/bin/env tsx
/**
 * audit-colors.ts — Find all off-brand colors in the web package.
 *
 * Exits non-zero when violations are found, so it works as a precommit gate.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run audit:colors          # CI / precommit
 *   pnpm --filter @optimitron/web run audit:colors -- --fix  # generate COLOR_AUDIT.md
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, dirname, relative, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = resolve(__dirname, "..");
const SRC_ROOT = resolve(WEB_ROOT, "src");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SCAN_DIRS = ["components", "app"];

const EXCLUDE_PATTERNS = [
  /[\\/]emails[\\/]/, // email templates need inline styles
  /\.test\.(ts|tsx)$/, // test files
  /globals\.css$/, // token definitions
  /[\\/]node_modules[\\/]/,
  /[\\/]\.next[\\/]/,
];

interface Rule {
  id: string;
  label: string;
  pattern: RegExp;
  /** Return true to suppress a match (false positive filter). */
  filter?: (match: string, line: string) => boolean;
  suggestion: string;
}

const RULES: Rule[] = [
  {
    id: "opacity-modifier",
    label: "Opacity modifiers on black/white",
    pattern:
      /\b(?:text|bg|border|ring|shadow|divide|outline|decoration)-(?:black|white)\/\d+/g,
    suggestion: "Use semantic tokens: `text-muted-foreground`, `text-foreground`, `bg-muted`",
  },
  {
    id: "brutal-token-opacity",
    label: "Opacity on brutal tokens (creates pastels)",
    pattern:
      /\b(?:text|bg|border)-brutal-(?:pink|cyan|yellow|red|green)\/\d+/g,
    // Allow hover opacity (hover:bg-brutal-pink/80) — those are interactive states, not backgrounds
    filter: (m, line) => {
      // Allow hover: prefixed versions
      const idx = line.indexOf(m);
      if (idx > 0 && line.slice(Math.max(0, idx - 10), idx).includes("hover:")) return true;
      // Allow /80 and /90 (slight darken on hover is ok)
      if (/\/(?:80|90)\b/.test(m)) return true;
      return false;
    },
    suggestion: "Use solid brutal token (`bg-brutal-pink`) or semantic token (`bg-muted`). No pastel tints.",
  },
  {
    id: "hardcoded-bg-text-white",
    label: "Hardcoded bg-white / text-white",
    pattern: /\b(?:bg-white|text-white)\b/g,
    // Don't flag if it's an opacity variant (already caught above)
    filter: (_m, line) => /(?:bg-white|text-white)\/\d+/.test(line),
    suggestion:
      "Use `bg-background` / `text-background` or `text-primary-foreground`",
  },
  {
    id: "soft-shadow",
    label: "Soft shadows (rgba opacity < 1)",
    pattern: /rgba\s*\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.\d+/g,
    suggestion: "Use `rgba(0,0,0,1)` for brutal hard shadows",
  },
  {
    id: "tailwind-scale",
    label: "Tailwind color scale classes",
    pattern:
      /\b(?:text|bg|border|ring|shadow|divide|outline|decoration|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/g,
    suggestion:
      "Use brutal-* tokens (`brutal-pink`, `brutal-cyan`, `brutal-yellow`, `brutal-red`) or semantic tokens (`primary`, `muted`, `destructive`)",
  },
  {
    id: "hardcoded-hex",
    label: "Hardcoded hex colors",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    // Allow pure black/white hex
    filter: (m) => /^#(?:000000|000|ffffff|fff)$/i.test(m),
    suggestion: "Use CSS custom property / brutal token instead",
  },
  {
    id: "hardcoded-bg-text-black",
    label: "Hardcoded bg-black / text-black",
    pattern: /\b(?:bg-black|text-black)\b/g,
    // Don't flag if it's an opacity variant
    filter: (_m, line) => /(?:bg-black|text-black)\/\d+/.test(line),
    suggestion:
      "Use `bg-foreground` / `text-foreground` for dark-mode compatibility",
  },
  {
    id: "brutal-text-without-foreground",
    label: "text-brutal-* without -foreground (likely invisible on matching bg)",
    pattern: /\btext-brutal-(?:pink|cyan|yellow|red|green)\b(?!-foreground)/g,
    suggestion:
      "Use `text-brutal-*-foreground` variant or `text-foreground`. Raw brutal tokens as text color will be invisible on a matching brutal background.",
  },
];

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      const ext = extname(entry.name);
      if (ext === ".tsx" || ext === ".ts" || ext === ".jsx" || ext === ".js") {
        results.push(full);
      }
    }
  }
  return results;
}

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => p.test(filePath));
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

interface Violation {
  file: string; // relative to src/
  line: number;
  snippet: string; // the matched text
  fullLine: string; // trimmed source line (for context)
  ruleId: string;
}

function scan(): Violation[] {
  const violations: Violation[] = [];

  for (const subdir of SCAN_DIRS) {
    const scanDir = resolve(SRC_ROOT, subdir);
    let files: string[];
    try {
      files = collectFiles(scanDir);
    } catch {
      continue; // directory doesn't exist
    }

    for (const filePath of files) {
      if (shouldExclude(filePath)) continue;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i]!;

        for (const rule of RULES) {
          // Reset lastIndex for global regexes
          rule.pattern.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = rule.pattern.exec(lineText)) !== null) {
            if (rule.filter && rule.filter(match[0], lineText)) continue;

            violations.push({
              file: relative(SRC_ROOT, filePath).replace(/\\/g, "/"),
              line: i + 1,
              snippet: match[0],
              fullLine: lineText.trim().slice(0, 120),
              ruleId: rule.id,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function generateMarkdown(violations: Violation[]): string {
  const countsByRule = new Map<string, number>();
  for (const v of violations) {
    countsByRule.set(v.ruleId, (countsByRule.get(v.ruleId) ?? 0) + 1);
  }

  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    const arr = byFile.get(v.file) ?? [];
    arr.push(v);
    byFile.set(v.file, arr);
  }

  const lines: string[] = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push("# Color Audit — Off-Brand Colors TODO");
  lines.push("");
  lines.push(`Generated: ${date}`);
  lines.push(`Total violations: ${violations.length}`);
  lines.push("");
  lines.push("## Summary");
  for (const rule of RULES) {
    const count = countsByRule.get(rule.id) ?? 0;
    lines.push(`- [ ] **${count}** ${rule.label} → ${rule.suggestion}`);
  }

  lines.push("");
  lines.push("## Suggested Replacements");
  lines.push("");
  lines.push("| Off-brand pattern | Replacement |");
  lines.push("|---|---|");
  lines.push(
    "| `text-black/50`, `text-black/60` | `text-muted-foreground` |",
  );
  lines.push("| `text-black/80`, `text-black/90` | `text-foreground` |");
  lines.push("| `bg-white` | `bg-background` |");
  lines.push(
    "| `text-white` | `text-primary-foreground` or `text-background` |",
  );
  lines.push("| `bg-black` | `bg-foreground` |");
  lines.push("| `text-black` | `text-foreground` |");
  lines.push("| `rgba(0,0,0,0.3)` | `rgba(0,0,0,1)` (brutal shadow) |");
  lines.push(
    "| `bg-gray-*`, `text-gray-*` | `bg-muted` / `text-muted-foreground` |",
  );
  lines.push(
    "| `bg-emerald-*`, `bg-green-*` | `bg-brutal-cyan` or semantic token |",
  );
  lines.push(
    "| `bg-red-*`, `text-red-*` | `bg-brutal-red` / `text-destructive` |",
  );
  lines.push("| `bg-yellow-*`, `bg-amber-*` | `bg-brutal-yellow` |");
  lines.push("| `bg-pink-*`, `bg-rose-*` | `bg-brutal-pink` |");
  lines.push(
    "| `bg-blue-*`, `bg-cyan-*`, `bg-sky-*` | `bg-brutal-cyan` |",
  );
  lines.push("| Hardcoded hex (`#ef4444`, `#666`) | CSS variable / brutal token |");

  lines.push("");
  lines.push("## By File");

  // Sort files alphabetically
  const sortedFiles = [...byFile.keys()].sort();
  for (const file of sortedFiles) {
    const fileViolations = byFile.get(file)!;
    // Deduplicate by line+snippet
    const seen = new Set<string>();
    const unique = fileViolations.filter((v) => {
      const key = `${v.line}:${v.snippet}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    lines.push("");
    lines.push(`### ${file}`);
    for (const v of unique.sort((a, b) => a.line - b.line)) {
      const ruleLabel =
        RULES.find((r) => r.id === v.ruleId)?.label ?? v.ruleId;
      lines.push(
        `- [ ] Line ${v.line}: \`${v.snippet}\` — ${ruleLabel}`,
      );
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("_Generated by `packages/web/scripts/audit-colors.ts`_");
  lines.push("");

  return lines.join("\n");
}

function printSummary(violations: Violation[]): void {
  const countsByRule = new Map<string, number>();
  for (const v of violations) {
    countsByRule.set(v.ruleId, (countsByRule.get(v.ruleId) ?? 0) + 1);
  }

  console.error("\n🎨 Color Audit Results\n");
  for (const rule of RULES) {
    const count = countsByRule.get(rule.id) ?? 0;
    if (count > 0) {
      console.error(`  ✗ ${count} ${rule.label}`);
    } else {
      console.error(`  ✓ ${rule.label}`);
    }
  }
  console.error(`\n  Total: ${violations.length} violations\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const violations = scan();
const generateReport = process.argv.includes("--fix");

printSummary(violations);

if (generateReport) {
  const md = generateMarkdown(violations);
  const outPath = resolve(WEB_ROOT, "COLOR_AUDIT.md");
  writeFileSync(outPath, md, "utf-8");
  console.error(`Report written to: ${relative(process.cwd(), outPath)}`);
}

if (violations.length > 0) {
  if (!generateReport) {
    console.error(
      "Run with --fix to generate COLOR_AUDIT.md with full details.\n",
    );
  }
  process.exit(1);
}
