/**
 * Compress the already-downloaded leader photos in-place. Reads every file
 * in apps/optimitron/public/images/leaders/, resizes to 512×512 JPEG, writes
 * back as {countryCode}.jpg. Deletes the original if the extension changed.
 *
 * Run: tsx apps/optimitron/scripts/compress-leader-photos.ts
 *
 * Idempotent — running twice just re-compresses the already-compressed jpgs,
 * which is fine.
 */

import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, parse, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, "..", "public", "images", "leaders");
const MANIFEST_PATH = join(INPUT_DIR, "manifest.json");

async function main() {
  if (!existsSync(INPUT_DIR)) {
    console.error(`❌ ${INPUT_DIR} does not exist. Run download-leader-photos.ts first.`);
    process.exit(1);
  }

  const files = readdirSync(INPUT_DIR).filter(
    (name) => name !== "manifest.json" && !name.startsWith("."),
  );

  console.log(`🗜  Compressing ${files.length} leader photos...`);

  const sharp = (await import("sharp")).default;
  const manifest: Record<string, string> = {};
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  for (const file of files) {
    const { name, ext } = parse(file);
    const sourcePath = join(INPUT_DIR, file);
    const beforeBytes = statSync(sourcePath).size;
    totalBefore += beforeBytes;

    try {
      const sourceBuffer = readFileSync(sourcePath);
      const compressed = await sharp(sourceBuffer)
        .resize(512, 512, { fit: "cover", position: "top" })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();

      const targetPath = join(INPUT_DIR, `${name}.jpg`);
      writeFileSync(targetPath, compressed);
      totalAfter += compressed.length;
      manifest[name] = `/images/leaders/${name}.jpg`;

      // If the source had a different extension, remove it so only the .jpg remains
      if (ext.toLowerCase() !== ".jpg") {
        unlinkSync(sourcePath);
      }

      processed += 1;
      const reduction = ((1 - compressed.length / beforeBytes) * 100).toFixed(0);
      console.log(
        `  ✓ ${name.toUpperCase()} ${formatKb(beforeBytes)} → ${formatKb(compressed.length)} (−${reduction}%)`,
      );
    } catch (err) {
      console.log(
        `  ✗ ${name.toUpperCase()} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Rewrite manifest
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(
    `\n📊 ${processed} compressed · ${formatMb(totalBefore)} → ${formatMb(totalAfter)} (−${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`,
  );
  console.log(`📝 Wrote ${Object.keys(manifest).length} entries to ${MANIFEST_PATH}`);
}

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
