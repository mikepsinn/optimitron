#!/usr/bin/env node
/**
 * Private-information leak scanner.
 *
 * Fails CI when a tracked file contains private-information patterns that
 * GitHub secret scanning does not catch: private Notion workspace links,
 * bank-account references, non-placeholder cloud account IDs.
 *
 * Structural patterns only — no sensitive literals live in this file, so the
 * denylist itself leaks nothing. High-signal, low-false-positive by design.
 * A prompt-injected agent can write anything to a branch; nothing reaches main
 * without passing this gate plus a human merge.
 *
 * Usage: node scripts/leak-scan.mjs            (scans tracked files)
 *        node scripts/leak-scan.mjs <file...>  (scans given files)
 * Allow a reviewed false positive with an inline `leak-scan-ok` comment on the
 * same line.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";

const RULES = [
  {
    id: "notion-private-link",
    // Private Notion workspace pages are 32-hex ids, usually reached via a
    // notion.so/<workspace>/<Title-slug>-<hex> share link or a *.notion.site
    // host — not just a bare hex segment right after notion.so/. The id is
    // written either compact (32 hex) or as a hyphenated UUID, whose longest
    // contiguous hex run is only 12, so both spellings need matching.
    re: /notion\.(?:so|site)\/\S*(?:[0-9a-f]{20,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
    msg: "Private Notion workspace link — keep Notion the single index; do not copy page links into the repo.",
  },
  {
    id: "bank-account-ref",
    re: /\b(checking|savings|account)\s+#?\d{4,}\b|\baccount[_\s]*(?:number|no\.?|#)\s*[:=]?\s*["']?\d{4,}\b/i,
    msg: "Bank/account number reference in a committed file.",
  },
  {
    id: "cloud-account-id-nonplaceholder",
    // 32-hex host id (Cloudflare R2 etc.) that is NOT the documented dummy.
    re: /\b(?!0123456789abcdef0123456789abcdef)[0-9a-f]{32}\b\.r2\.cloudflarestorage\.com/i,
    msg: "Real cloud account ID in an example/config — use a placeholder.",
  },
];

// Paths allowed to contain otherwise-flagged content. Extend deliberately.
const PATH_ALLOW = [/^scripts\/leak-scan\.mjs$/];

const NULL_CHAR = String.fromCharCode(0);

function tracked() {
  return execSync("git ls-files -z", { encoding: "utf8" })
    .split(NULL_CHAR)
    .filter(Boolean);
}

const argFiles = process.argv.slice(2);
const files = (argFiles.length ? argFiles : tracked()).filter(
  (f) =>
    existsSync(f) &&
    statSync(f).isFile() &&
    !PATH_ALLOW.some((re) => re.test(f)),
);

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (text.indexOf(NULL_CHAR) !== -1) continue; // skip binary
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("leak-scan-ok")) continue;
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        hits.push({ file, line: i + 1, id: rule.id, msg: rule.msg });
      }
    }
  }
}

if (hits.length) {
  console.error(`\nLeak scan found ${hits.length} issue(s):\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  [${h.id}] ${h.msg}`);
  }
  console.error(
    "\nRedact the private value, or add an inline `leak-scan-ok` comment if reviewed and safe.\n",
  );
  process.exit(1);
}
console.log(`Leak scan clean (${files.length} files).`);
