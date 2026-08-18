#!/usr/bin/env tsx
/**
 * fix-colors.ts — Auto-fix safe color replacements across the web package.
 *
 * Only performs replacements that are unambiguous and context-independent.
 * Leaves ambiguous cases (text-white, Tailwind scales, hex colors) for manual review.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run fix:colors          # dry-run (shows changes)
 *   pnpm --filter @optimitron/web run fix:colors -- --write  # apply changes
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, relative, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = resolve(__dirname, "..");
const SRC_ROOT = resolve(WEB_ROOT, "src");

const SCAN_DIRS = ["components", "app"];
const WRITE_MODE = process.argv.includes("--write");

const EXCLUDE_PATTERNS = [
  /[\\/]emails[\\/]/,
  /\.test\.(ts|tsx)$/,
  /globals\.css$/,
  /[\\/]node_modules[\\/]/,
  /[\\/]\.next[\\/]/,
];

// ---------------------------------------------------------------------------
// Replacement rules — ONLY safe, unambiguous replacements
// ---------------------------------------------------------------------------

interface Replacement {
  label: string;
  pattern: RegExp;
  replacement: string;
}

const REPLACEMENTS: Replacement[] = [
  // --- Opacity modifiers on black → semantic tokens ---
  {
    label: "text-black/40..60 → text-muted-foreground",
    pattern: /\btext-black\/(?:40|50|60)\b/g,
    replacement: "text-muted-foreground",
  },
  {
    label: "text-black/70..90 → text-foreground",
    pattern: /\btext-black\/(?:70|80|90)\b/g,
    replacement: "text-foreground",
  },
  {
    label: "text-black/10..30 → text-muted-foreground",
    pattern: /\btext-black\/(?:10|20|30)\b/g,
    replacement: "text-muted-foreground",
  },
  // --- Opacity modifiers on white → semantic tokens ---
  {
    label: "text-white/40..60 → text-muted-foreground",
    pattern: /\btext-white\/(?:40|50|60)\b/g,
    replacement: "text-muted-foreground",
  },
  {
    label: "text-white/70..90 → text-background",
    pattern: /\btext-white\/(?:70|80|90)\b/g,
    replacement: "text-background",
  },
  // --- bg-black/X opacity modifiers ---
  {
    label: "bg-black/5..30 → bg-muted",
    pattern: /\bbg-black\/(?:5|10|15|20|25|30)\b/g,
    replacement: "bg-muted",
  },
  // --- bg-white/X opacity modifiers ---
  {
    label: "bg-white/X → bg-background",
    pattern: /\bbg-white\/\d+\b/g,
    replacement: "bg-background",
  },
  // --- border-black/X opacity modifiers ---
  {
    label: "border-black/X → border-primary",
    pattern: /\bborder-black\/\d+\b/g,
    replacement: "border-primary",
  },
  // --- border-white/X opacity modifiers ---
  {
    label: "border-white/X → border-border",
    pattern: /\bborder-white\/\d+\b/g,
    replacement: "border-border",
  },
  // --- Standalone hardcoded colors → semantic ---
  {
    label: "bg-white → bg-background",
    pattern: /\bbg-white\b(?!\/)/g,
    replacement: "bg-background",
  },
  {
    label: "text-black (standalone) → text-foreground",
    pattern: /\btext-black\b(?!\/)/g,
    replacement: "text-foreground",
  },
  {
    label: "bg-black (standalone) → bg-foreground",
    pattern: /\bbg-black\b(?!\/)/g,
    replacement: "bg-foreground",
  },
  {
    label: "border-black (standalone) → border-primary",
    pattern: /\bborder-black\b(?!\/)/g,
    replacement: "border-primary",
  },
  // --- Soft shadows → hard shadows ---
  {
    label: "rgba(0,0,0,0.X) → rgba(0,0,0,1) in shadows",
    pattern: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.\d+\s*\)/g,
    replacement: "rgba(0,0,0,1)",
  },
  // --- font-medium → font-bold ---
  {
    label: "font-medium → font-bold",
    pattern: /\bfont-medium\b/g,
    replacement: "font-bold",
  },
  // --- Context-aware text-white replacements ---
  {
    label: "bg-foreground text-white → bg-foreground text-background",
    pattern: /\bbg-foreground\s+text-white\b/g,
    replacement: "bg-foreground text-background",
  },
  {
    label: "bg-brutal-pink text-white → bg-brutal-pink text-brutal-pink-foreground",
    pattern: /\bbg-brutal-pink\s+text-white\b/g,
    replacement: "bg-brutal-pink text-brutal-pink-foreground",
  },
  {
    label: "bg-brutal-red text-white → bg-brutal-red text-brutal-red-foreground",
    pattern: /\bbg-brutal-red\s+text-white\b/g,
    replacement: "bg-brutal-red text-brutal-red-foreground",
  },
  {
    label: "hover:text-white → hover:text-background",
    pattern: /\bhover:text-white\b/g,
    replacement: "hover:text-background",
  },
  {
    label: "hover:bg-black/80 → hover:bg-foreground/80",
    pattern: /\bhover:bg-black\/80\b/g,
    replacement: "hover:bg-foreground/80",
  },
  // --- Fix hover direction: push-in → lift-out ---
  {
    label: "hover push-in → lift-out (shadow shrink to grow)",
    pattern: /hover:translate-x-\[2px\]\s+hover:translate-y-\[2px\]\s+hover:shadow-\[(?:1|2)px_(?:1|2)px_0px_0px_rgba\(0,0,0,1\)\]/g,
    replacement: "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
  },
  // --- Normalize shadow sizes: 3px/6px → 4px/8px ---
  {
    label: "shadow 3px → 4px",
    pattern: /shadow-\[3px_3px_0px_0px_rgba\(0,0,0,1\)\]/g,
    replacement: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
  },
  {
    label: "shadow 6px → 8px",
    pattern: /shadow-\[6px_6px_0px_0px_rgba\(0,0,0,1\)\]/g,
    replacement: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  },
  // --- Normalize border widths: border-2 border-primary → border-4 border-primary (on interactive elements) ---
  {
    label: "border-2 border-primary → border-4 border-primary",
    pattern: /\bborder-2\s+border-primary\b/g,
    replacement: "border-4 border-primary",
  },
  // --- Tailwind scale colors → brutal tokens ---
  {
    label: "bg-green-500/600/700 → bg-brutal-cyan",
    pattern: /\bbg-green-(?:500|600|700)\b/g,
    replacement: "bg-brutal-cyan",
  },
  {
    label: "hover:bg-green-700 → hover:bg-brutal-cyan/80",
    pattern: /\bhover:bg-green-(?:600|700)\b/g,
    replacement: "hover:bg-brutal-cyan/80",
  },
  {
    label: "bg-red-500 → bg-brutal-red",
    pattern: /\bbg-red-(?:500|600|700)\b/g,
    replacement: "bg-brutal-red",
  },
  // --- Brutal token opacity → solid (strip pastel tints) ---
  // bg-brutal-*/10..70 → bg-brutal-* (solid). Skips hover: prefixed (those are interactive).
  {
    label: "bg-brutal-pink/N → bg-brutal-pink (strip pastel)",
    pattern: /(?<!hover:)\bbg-brutal-pink\/(?:10|20|30|40|50|60|70)\b/g,
    replacement: "bg-brutal-pink",
  },
  {
    label: "bg-brutal-cyan/N → bg-brutal-cyan (strip pastel)",
    pattern: /(?<!hover:)\bbg-brutal-cyan\/(?:10|20|30|40|50|60|70)\b/g,
    replacement: "bg-brutal-cyan",
  },
  {
    label: "bg-brutal-yellow/N → bg-brutal-yellow (strip pastel)",
    pattern: /(?<!hover:)\bbg-brutal-yellow\/(?:10|20|30|40|50|60|70)\b/g,
    replacement: "bg-brutal-yellow",
  },
  {
    label: "bg-brutal-red/N → bg-brutal-red (strip pastel)",
    pattern: /(?<!hover:)\bbg-brutal-red\/(?:10|20|30|40|50|60|70)\b/g,
    replacement: "bg-brutal-red",
  },
  {
    label: "bg-brutal-green/N → bg-brutal-green (strip pastel)",
    pattern: /(?<!hover:)\bbg-brutal-green\/(?:10|20|30|40|50|60|70)\b/g,
    replacement: "bg-brutal-green",
  },
  // text-brutal-*/opacity → solid
  {
    label: "text-brutal-*/N → text-brutal-* (strip opacity)",
    pattern: /(?<!hover:)\btext-brutal-(pink|cyan|yellow|red|green)\/\d+\b/g,
    replacement: "text-brutal-$1",
  },
  // border-brutal-*/opacity → solid
  {
    label: "border-brutal-*/N → border-brutal-* (strip opacity)",
    pattern: /(?<!hover:)\bborder-brutal-(pink|cyan|yellow|red|green)\/\d+\b/g,
    replacement: "border-brutal-$1",
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
      if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) {
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
// Main
// ---------------------------------------------------------------------------

interface FileChange {
  file: string;
  changes: Array<{ line: number; rule: string; before: string; after: string }>;
}

const allChanges: FileChange[] = [];
let totalChanges = 0;

for (const subdir of SCAN_DIRS) {
  const scanDir = resolve(SRC_ROOT, subdir);
  let files: string[];
  try {
    files = collectFiles(scanDir);
  } catch {
    continue;
  }

  for (const filePath of files) {
    if (shouldExclude(filePath)) continue;

    const original = readFileSync(filePath, "utf-8");
    const lines = original.split("\n");
    const fileChanges: FileChange["changes"] = [];

    let modified = original;

    for (const rule of REPLACEMENTS) {
      // Track changes per line
      rule.pattern.lastIndex = 0;
      const newContent = modified.replace(rule.pattern, (match, offset) => {
        // Find line number
        const beforeMatch = modified.slice(0, offset);
        const lineNum = beforeMatch.split("\n").length;
        const lineText = modified.split("\n")[lineNum - 1] ?? "";

        fileChanges.push({
          line: lineNum,
          rule: rule.label,
          before: match,
          after: rule.replacement,
        });

        return rule.replacement;
      });
      modified = newContent;
    }

    if (fileChanges.length > 0) {
      const relPath = relative(SRC_ROOT, filePath).replace(/\\/g, "/");
      allChanges.push({ file: relPath, changes: fileChanges });
      totalChanges += fileChanges.length;

      if (WRITE_MODE) {
        writeFileSync(filePath, modified, "utf-8");
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (totalChanges === 0) {
  console.log("No safe color fixes needed.");
  process.exit(0);
}

console.log(`\n${WRITE_MODE ? "Applied" : "Would apply"} ${totalChanges} fixes across ${allChanges.length} files:\n`);

// Summary by rule
const ruleCounts = new Map<string, number>();
for (const fc of allChanges) {
  for (const c of fc.changes) {
    ruleCounts.set(c.rule, (ruleCounts.get(c.rule) ?? 0) + 1);
  }
}
for (const [rule, count] of [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count.toString().padStart(4)}  ${rule}`);
}

console.log("");

// Per-file detail (first 20 files)
const filesToShow = allChanges.slice(0, 20);
for (const fc of filesToShow) {
  console.log(`  ${fc.file} (${fc.changes.length} changes)`);
  for (const c of fc.changes.slice(0, 5)) {
    console.log(`    L${c.line}: ${c.before} → ${c.after}`);
  }
  if (fc.changes.length > 5) {
    console.log(`    ... and ${fc.changes.length - 5} more`);
  }
}
if (allChanges.length > 20) {
  console.log(`  ... and ${allChanges.length - 20} more files`);
}

if (!WRITE_MODE) {
  console.log("\nDry run. Pass --write to apply changes.");
}
