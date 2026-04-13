/**
 * Download all 193 world leader photos from Wikimedia Commons into
 * packages/web/public/images/leaders/{countryCode}.{ext}.
 *
 * Wikimedia's `Special:FilePath` URLs are redirects to the CDN, which Satori
 * (behind next/og ImageResponse) can't follow reliably. Hosting the images
 * locally makes OG rendering bulletproof and task detail pages faster.
 *
 * Run: tsx packages/web/scripts/download-leader-photos.ts
 *
 * Idempotent — skips files that already exist. Pass --force to re-download.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WORLD_LEADERS } from "@optimitron/data/datasets/world-leaders";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, "..", "public", "images", "leaders");
const CONCURRENCY = 2;
const BATCH_DELAY_MS = 500;
const FORCE = process.argv.includes("--force");

interface DownloadResult {
  countryCode: string;
  leaderName: string;
  localPath: string | null;
  status: "downloaded" | "skipped" | "failed" | "missing";
  error?: string;
}

function extensionForContentType(contentType: string | null): string {
  if (!contentType) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return "jpg";
}

function extensionFromUrl(url: string): string | null {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif|svg)(?:$|\?)/i);
  if (!match) return null;
  const ext = match[1]!.toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

async function downloadOne(leader: {
  countryCode: string;
  leaderName: string;
  leaderImageUrl: string | null;
}): Promise<DownloadResult> {
  const countryCode = leader.countryCode.toLowerCase();
  const leaderName = leader.leaderName;

  if (!leader.leaderImageUrl) {
    return { countryCode, leaderName, localPath: null, status: "missing" };
  }

  // Best guess at extension from URL; may be overridden by content-type
  const urlExt = extensionFromUrl(leader.leaderImageUrl) ?? "jpg";
  const existingPath = join(OUTPUT_DIR, `${countryCode}.${urlExt}`);

  if (!FORCE && existsSync(existingPath)) {
    return {
      countryCode,
      leaderName,
      localPath: `/images/leaders/${countryCode}.${urlExt}`,
      status: "skipped",
    };
  }

  try {
    const response = await fetch(leader.leaderImageUrl, {
      redirect: "follow",
      headers: {
        // Wikimedia requires a descriptive User-Agent or it returns 403
        "User-Agent":
          "OptimitronLeaderPhotoBot/1.0 (+https://optimitron.earth; photos cached for accountability OG cards)",
      },
    });

    if (!response.ok) {
      return {
        countryCode,
        leaderName,
        localPath: null,
        status: "failed",
        error: `HTTP ${response.status}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    // Resize + compress with sharp. OG cards render the photo at 260×260, so
    // 512×512 is plenty of headroom. JPEG mozjpeg quality 80 lands around
    // 25–40KB per image vs ~500KB–1MB for the raw Wikimedia originals.
    const sharp = (await import("sharp")).default;
    const compressed = await sharp(buffer)
      .resize(512, 512, { fit: "cover", position: "top" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    const finalPath = join(OUTPUT_DIR, `${countryCode}.jpg`);
    writeFileSync(finalPath, compressed);

    return {
      countryCode,
      leaderName,
      localPath: `/images/leaders/${countryCode}.jpg`,
      status: "downloaded",
    };
  } catch (err) {
    return {
      countryCode,
      leaderName,
      localPath: null,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created ${OUTPUT_DIR}`);
  }

  console.log(`🌍 Downloading ${WORLD_LEADERS.length} leader photos...`);
  const results: DownloadResult[] = [];

  // Simple concurrency limiter — process N at a time with a pause between
  // batches to stay under Wikimedia's rate limit.
  for (let i = 0; i < WORLD_LEADERS.length; i += CONCURRENCY) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
    const batch = WORLD_LEADERS.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(downloadOne));
    results.push(...batchResults);
    for (const r of batchResults) {
      const icon =
        r.status === "downloaded"
          ? "✓"
          : r.status === "skipped"
            ? "·"
            : r.status === "missing"
              ? "—"
              : "✗";
      const suffix =
        r.status === "failed" ? ` (${r.error})` : r.localPath ? ` → ${r.localPath}` : "";
      console.log(`  ${icon} ${r.countryCode.toUpperCase()} ${r.leaderName}${suffix}`);
    }
  }

  const downloaded = results.filter((r) => r.status === "downloaded").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const missing = results.filter((r) => r.status === "missing").length;

  console.log(
    `\n📊 ${downloaded} downloaded · ${skipped} skipped · ${failed} failed · ${missing} missing`,
  );

  // Write a manifest mapping countryCode → local path so the seeder can look
  // up the real path (extension varies). Consumed by seedTreatyTasks().
  const manifest: Record<string, string> = {};
  for (const r of results) {
    if (r.localPath) {
      manifest[r.countryCode] = r.localPath;
    }
  }
  const manifestPath = join(OUTPUT_DIR, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📝 Wrote ${Object.keys(manifest).length} entries to ${manifestPath}`);

  if (failed > 0) {
    console.log(
      `\n⚠️  ${failed} downloads failed. Re-run with --force to retry everything, or re-run without --force to retry only the missing ones.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
