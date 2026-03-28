/**
 * Optimize Wishonia sprites from source PNGs → WebP + resized.
 *
 * Usage: npx tsx scripts/optimize-sprites.ts [source-dir]
 *
 * Default source: E:\code\disease-eradication-plan\transmit\public\assets\sprites\alien
 * Output: sprites/ directory (tier0/, tier1/, tier2/)
 */

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "fs";
import { join, basename } from "path";

const DEFAULT_SOURCE =
  "E:/code/disease-eradication-plan/transmit/public/assets/sprites/alien";

const TIER_0 = new Set([
  "neutral-smile",
  "neutral-closed",
  "neutral-open",
  "neutral-oh",
  "neutral-ee",
  "neutral-small",
  "blink-smile",
  "body-idle",
]);

const TIER_1 = new Set([
  "happy-smile",
  "happy-open",
  "happy-oh",
  "happy-ee",
  "happy-closed",
  "happy-small",
  "excited-open",
  "excited-ee",
  "excited-oh",
  "excited-closed",
  "thinking-oh",
  "thinking-closed",
  "thinking-small",
  "body-presenting",
  "body-listening",
  "body-thinking",
]);

const MAX_DIMENSION = 512;
const WEBP_QUALITY = 80;

async function optimizeSprite(
  srcPath: string,
  destPath: string,
  format: "webp" | "png",
) {
  const pipeline = sharp(srcPath).resize(MAX_DIMENSION, MAX_DIMENSION, {
    fit: "inside",
    withoutEnlargement: true,
  });

  if (format === "webp") {
    await pipeline.webp({ quality: WEBP_QUALITY }).toFile(destPath);
  } else {
    await pipeline.png({ quality: WEBP_QUALITY }).toFile(destPath);
  }
}

async function main() {
  const sourceDir = process.argv[2] || DEFAULT_SOURCE;
  const outputDir = join(process.cwd(), "sprites");

  if (!existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    console.error("Pass the path to the alien sprites directory as an argument.");
    process.exit(1);
  }

  const pngs = readdirSync(sourceDir).filter((f) => f.endsWith(".png"));
  console.log(`Found ${pngs.length} source PNGs in ${sourceDir}`);

  for (const tier of ["tier0", "tier1", "tier2"]) {
    mkdirSync(join(outputDir, tier), { recursive: true });
  }

  let tier0Count = 0;
  let tier1Count = 0;
  let tier2Count = 0;

  for (const png of pngs) {
    const name = basename(png, ".png");
    let tier: string;

    if (TIER_0.has(name)) {
      tier = "tier0";
      tier0Count++;
    } else if (TIER_1.has(name)) {
      tier = "tier1";
      tier1Count++;
    } else {
      tier = "tier2";
      tier2Count++;
    }

    const srcPath = join(sourceDir, png);
    const destWebP = join(outputDir, tier, `${name}.webp`);
    const destPNG = join(outputDir, tier, `${name}.png`);

    await optimizeSprite(srcPath, destWebP, "webp");
    await optimizeSprite(srcPath, destPNG, "png");

    process.stdout.write(".");
  }

  console.log(
    `\n\nDone! Optimized ${pngs.length} sprites:`,
    `\n  Tier 0 (critical): ${tier0Count}`,
    `\n  Tier 1 (presentation): ${tier1Count}`,
    `\n  Tier 2 (full library): ${tier2Count}`,
    `\n  Output: ${outputDir}/`,
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
