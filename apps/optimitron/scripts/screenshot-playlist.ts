/**
 * Take screenshots of every slide in a demo playlist.
 *
 * Usage:
 *   npx tsx scripts/screenshot-playlist.ts [playlistId] [baseUrl]
 *
 * Default: protocol-labs, http://localhost:3001
 *
 * Outputs: docs/demo-scripts/screenshots/{slideId}.png
 */

import { PLAYLISTS } from "../src/lib/demo-script";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  const isMobile = args.includes("--mobile");
  const positionalArgs = args.filter((a) => !a.startsWith("--"));
  const playlistId = positionalArgs[0] ?? "protocol-labs";
  const baseUrl = positionalArgs[1] ?? "http://localhost:3001";

  const playlist = PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) {
    console.error(`Playlist "${playlistId}" not found.`);
    process.exit(1);
  }

  // @playwright/test re-exports chromium from playwright-core
  const pw = await import("@playwright/test");
  const { chromium } = pw;

  const suffix = isMobile ? path.join("screenshots", "mobile") : "screenshots";
  const outDir = path.resolve(__dirname, "../../..", "docs", "demo-scripts", suffix);
  fs.mkdirSync(outDir, { recursive: true });

  const viewport = isMobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 };

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport,
    isMobile,
    hasTouch: isMobile,
  });

  console.log(`Mode: ${isMobile ? "mobile (390x844)" : "desktop (1920x1080)"}`);

  // Set dark mode
  await page.emulateMedia({ colorScheme: "dark" });

  for (const [i, seg] of playlist.segments.entries()) {
    const id = seg.id;
    const url = `${baseUrl}/demo?playlist=${playlistId}#${id}`;
    console.log(`[${i + 1}/${playlist.segments.length}] ${id}...`);

    // Fresh navigation each time — the demo player only reads hash on mount
    await page.goto("about:blank");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    // Wait for animations to settle (some slides have phases up to 5s + animation time)
    await page.waitForTimeout(10000);

    const outPath = path.join(outDir, `${id}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  → ${outPath}`);
  }

  await browser.close();
  console.log(`\n✅ ${playlist.segments.length} screenshots saved to ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
