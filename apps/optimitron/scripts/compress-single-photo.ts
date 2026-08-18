/**
 * One-off: read a source image, resize + compress to 512×512 mozjpeg q80,
 * write to public/images/leaders/{cc}.jpg. Used for patching individual
 * stale leader entries without re-running the full download script.
 *
 * Usage: tsx scripts/compress-single-photo.ts <sourcePath> <countryCode>
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const [sourcePath, countryCode] = process.argv.slice(2);
  if (!sourcePath || !countryCode) {
    console.error(
      "Usage: tsx scripts/compress-single-photo.ts <sourcePath> <countryCode>",
    );
    process.exit(1);
  }

  const targetDir = join(__dirname, "..", "public", "images", "leaders");
  const targetPath = join(targetDir, `${countryCode.toLowerCase()}.jpg`);

  const source = readFileSync(sourcePath);
  const sharp = (await import("sharp")).default;
  const compressed = await sharp(source)
    .resize(512, 512, { fit: "cover", position: "top" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  writeFileSync(targetPath, compressed);
  console.log(
    `✓ ${countryCode.toUpperCase()}: ${Math.round(source.length / 1024)}KB → ${Math.round(compressed.length / 1024)}KB → ${targetPath}`,
  );
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
