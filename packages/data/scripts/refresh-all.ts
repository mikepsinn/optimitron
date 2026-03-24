/**
 * Master data refresh script — fetches from all available APIs
 * and writes updated JSON files to src/datasets/generated/.
 *
 * Usage: pnpm --filter @optimitron/data run data:refresh
 *
 * Individual generators can also be run separately:
 *   pnpm --filter @optimitron/data run data:refresh:health
 *   pnpm --filter @optimitron/data run data:refresh:economic
 *   pnpm --filter @optimitron/data run data:refresh:median-income
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scripts = [
  { name: "Health Outcomes (WHO)", file: "generate-health-outcomes.ts" },
  { name: "Economic Indicators (World Bank)", file: "generate-economic-indicators.ts" },
  { name: "Median Income (Eurostat + PIP)", file: "generate-median-income-series.ts" },
  { name: "Agency Performance (Gemini)", file: "generate-agency-data.ts" },
  { name: "Politician Scorecards (Congress.gov)", file: "generate-politician-scorecards.ts" },
];

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Optimitron Data Refresh Pipeline         ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const startTime = Date.now();
  let succeeded = 0;
  let failed = 0;

  for (const script of scripts) {
    console.log(`\n── ${script.name} ──\n`);
    const scriptPath = join(__dirname, script.file);

    try {
      execSync(`npx tsx "${scriptPath}"`, {
        cwd: join(__dirname, ".."),
        stdio: "inherit",
        timeout: 120_000, // 2 minute timeout per script
      });
      succeeded++;
    } catch (err) {
      console.error(`\n  [FAILED] ${script.name}\n`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n══════════════════════════════════════════");
  console.log(`Done in ${elapsed}s — ${succeeded} succeeded, ${failed} failed`);
  console.log("Generated files in: src/datasets/generated/");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
