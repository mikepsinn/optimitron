/**
 * Optimize Wishonia sprites from source PNGs into the served sprite folder.
 *
 * Usage: npx tsx scripts/optimize-sprites.ts [source-dir]
 *
 * Default source: E:\code\disease-eradication-plan\transmit\public\assets\sprites\alien
 * Output: apps/optimitron/public/sprites/wishonia/{name}.png
 *
 * The widget loads sprites from the host app's `/sprites/wishonia/` path, so
 * the app's public folder holds the only copy. The largest rendered size is a
 * 140 CSS px character or a 360 px avatar, so 512 px covers 3x screens.
 */

import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const DEFAULT_SOURCE =
  "E:/code/disease-eradication-plan/transmit/public/assets/sprites/alien";

const OUTPUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../apps/optimitron/public/sprites/wishonia",
);

const MAX_DIMENSION = 512;

async function optimizeSprite(srcPath: string, destPath: string) {
  await sharp(srcPath)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: "lanczos3",
    })
    .png({ palette: true, quality: 100, effort: 10, compressionLevel: 9, dither: 1 })
    .toFile(destPath);
}

async function main() {
  const sourceDir = process.argv[2] || DEFAULT_SOURCE;

  if (!existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    console.error("Pass the path to the alien sprites directory as an argument.");
    process.exit(1);
  }

  const pngs = readdirSync(sourceDir).filter((f) => f.endsWith(".png"));
  console.log(`Found ${pngs.length} source PNGs in ${sourceDir}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const png of pngs) {
    const name = basename(png, ".png");
    await optimizeSprite(join(sourceDir, png), join(OUTPUT_DIR, `${name}.png`));
    process.stdout.write(".");
  }

  console.log(`\n\nDone! Optimized ${pngs.length} sprites into ${OUTPUT_DIR}/`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
