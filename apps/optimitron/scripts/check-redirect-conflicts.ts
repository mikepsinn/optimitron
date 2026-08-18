/**
 * Checks that no page.tsx exists at a path that has a redirect defined.
 *
 * If a page exists at a redirect source, Next.js silently serves the page
 * instead of the redirect — so the redirect breaks without warning.
 *
 * Run: npx tsx scripts/check-redirect-conflicts.ts
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { REDIRECTS } = require("../src/lib/redirects") as {
  REDIRECTS: Array<{
    destination: string;
    has?: Array<{ type: "host"; value: string }>;
    permanent: boolean;
    source: string;
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = resolve(__dirname, "../src/app");

// Only check static sources (no :param segments)
const staticSources = REDIRECTS
  .map((r) => r.source)
  .filter((s) => !s.includes(":"));

let conflicts = 0;

for (const source of staticSources) {
  const pagePath = resolve(appDir, source.slice(1), "page.tsx");
  if (existsSync(pagePath)) {
    console.error(`CONFLICT: page.tsx exists at redirect source ${source}`);
    console.error(`  → ${pagePath}`);
    conflicts++;
  }
}

if (conflicts > 0) {
  console.error(
    `\n${conflicts} redirect conflict(s) found. Remove the page.tsx files or the redirect.`,
  );
  process.exit(1);
} else {
  console.log(`✓ No redirect conflicts (checked ${staticSources.length} sources)`);
}
