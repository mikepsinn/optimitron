#!/usr/bin/env tsx
/**
 * generate-brand-assets.ts
 *
 * Generates OG/twitter images using the shared image generator,
 * then resizes the chosen icon into all required variants.
 *
 * The icon source is public/icons/brainstorm-v4/4-inverted-globe-curve.png
 * (chosen manually). This script only regenerates the OG image and
 * processes icon variants — it does NOT regenerate the icon itself.
 *
 * Usage:
 *   pnpm --filter @optimitron/web run generate:assets
 *
 * Creates:
 *   public/favicon.ico, apple-touch-icon.png, og-image.jpg, twitter-image.jpg
 *   public/icons/icon-{16,32,72,192,512}.png, icon-maskable-512.png
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { resolve, join } from "path";
import "./load-env";
import { generateImage, buildPrompt, BRAND } from "./lib/image-generator";

const PUBLIC_DIR = resolve(__dirname, "../public");
const ICONS_DIR = join(PUBLIC_DIR, "icons");
const SRC_DIR = resolve(__dirname, "../src");

const BG_RGBA = BRAND.bgDarkRgba;

// ─── Icon source (manually chosen from brainstorm) ──────────────

const ICON_SOURCE = join(ICONS_DIR, "icon-512.png");

// ─── OG Image Prompt ────────────────────────────────────────────

const OG_PROMPT = buildPrompt(
  "Wide banner: retro control room with globe, dials, gauges, and growth charts. Text: 'OPTIMITRON' large at top, 'The Earth Optimization Machine' below. No other text.",
  { style: "Use a fun black and white retro scientific illustration style." },
);

// ─── Icon Processing ─────────────────────────────────────────────

const ICON_VARIANTS = [
  { name: "icon-16.png", size: 16, maskable: false },
  { name: "icon-32.png", size: 32, maskable: false },
  { name: "icon-72.png", size: 72, maskable: false },
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
];

async function processIconVariants(sourceBuffer: Buffer) {
  const sharp = (await import("sharp")).default;
  console.log("\nResizing icon variants...");

  for (const v of ICON_VARIANTS) {
    const outPath = join(ICONS_DIR, v.name);

    if (v.maskable) {
      const iconSize = Math.round(v.size * 0.6);
      const offset = Math.round((v.size - iconSize) / 2);

      const resized = await sharp(sourceBuffer)
        .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      await sharp({ create: { width: v.size, height: v.size, channels: 4 as const, background: BG_RGBA } })
        .png()
        .composite([{ input: resized, left: offset, top: offset }])
        .toFile(outPath);
    } else {
      await sharp(sourceBuffer)
        .resize(v.size, v.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
    }

    console.log(`  ${v.name} (${v.size}x${v.size})`);
  }
}

async function generateFavicon() {
  const sharp = (await import("sharp")).default;
  const pngToIco = (await import("png-to-ico")).default;
  console.log("\nGenerating favicon.ico...");

  const sizes = [16, 32, 48];
  const pngBuffers: Buffer[] = [];

  for (const size of sizes) {
    const pngPath = join(ICONS_DIR, `icon-${size}.png`);
    if (existsSync(pngPath)) {
      pngBuffers.push(readFileSync(pngPath));
    } else {
      const buf = await sharp(join(ICONS_DIR, "icon-72.png"))
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      pngBuffers.push(buf);
    }
  }

  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), await pngToIco(pngBuffers));
  console.log("  favicon.ico (16, 32, 48px)");
}

async function generateAppleTouchIcon(sourceBuffer: Buffer) {
  const sharp = (await import("sharp")).default;
  console.log("\nGenerating apple-touch-icon.png...");

  const total = 180;
  const inner = Math.round(total * 0.75);
  const offset = Math.round((total - inner) / 2);

  const resized = await sharp(sourceBuffer)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({ create: { width: total, height: total, channels: 4 as const, background: BG_RGBA } })
    .png()
    .composite([{ input: resized, left: offset, top: offset }])
    .toFile(join(PUBLIC_DIR, "apple-touch-icon.png"));

  console.log("  apple-touch-icon.png (180x180)");
}

async function processOgImage(sourceBuffer: Buffer) {
  const sharp = (await import("sharp")).default;
  console.log("\nProcessing OG image...");

  const ogPath = join(PUBLIC_DIR, "og-image.jpg");
  await sharp(sourceBuffer)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85 })
    .toFile(ogPath);
  console.log("  og-image.jpg (1200x630)");

  const twitterPath = join(PUBLIC_DIR, "twitter-image.jpg");
  await sharp(sourceBuffer)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85 })
    .toFile(twitterPath);
  console.log("  twitter-image.jpg (copy)");
}

// ─── Auto-patch layout.tsx + manifest.json ───────────────────────

function patchLayoutMetadata() {
  console.log("\nPatching layout.tsx...");
  const layoutPath = join(SRC_DIR, "app/layout.tsx");
  let content = readFileSync(layoutPath, "utf-8");
  let changed = false;

  if (!content.includes("icons:")) {
    content = content.replace(
      /manifest: "\/manifest\.json",/,
      `icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",`,
    );
    changed = true;
    console.log("  Added icons config");
  }

  if (!content.includes("og-image.jpg")) {
    content = content.replace(
      /type: "website",\s*\}/,
      `type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Optimitron — The Earth Optimization Machine" }],
  }`,
    );
    changed = true;
    console.log("  Added openGraph.images");
  }

  if (!content.includes("twitter-image.jpg")) {
    content = content.replace(
      /(twitter:\s*\{[\s\S]*?description:\s*\n?\s*"[^"]*",)\s*\}/,
      `$1\n    images: ["/twitter-image.jpg"],\n  }`,
    );
    changed = true;
    console.log("  Added twitter.images");
  }

  if (changed) writeFileSync(layoutPath, content);
  else console.log("  Already up to date");
}

function patchManifest() {
  console.log("\nPatching manifest.json...");
  const manifestPath = join(PUBLIC_DIR, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  if (!manifest.icons?.some((i: { purpose?: string }) => i.purpose === "maskable")) {
    manifest.icons.push({
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log("  Added maskable icon");
  } else {
    console.log("  Already up to date");
  }
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("============================================");
  console.log("  OPTIMITRON BRAND ASSET GENERATOR");
  console.log("============================================");

  if (!existsSync(ICONS_DIR)) mkdirSync(ICONS_DIR, { recursive: true });

  // Step 1: Read the chosen icon source
  if (!existsSync(ICON_SOURCE)) {
    throw new Error(`Icon source not found: ${ICON_SOURCE}\nRun brainstorm-icons scripts first.`);
  }
  const iconBuffer = readFileSync(ICON_SOURCE);
  console.log(`\nUsing icon: ${ICON_SOURCE} (${(iconBuffer.length / 1024).toFixed(0)}KB)`);

  // Step 2: Generate OG image (retro scientific illustration style)
  const ogBuffer = await generateImage(OG_PROMPT, {
    label: "og",
    aspectRatio: "16:9",
    rawOutputDir: ICONS_DIR,
  });

  // Step 3-6: Process into all variants
  await processIconVariants(iconBuffer);
  await generateFavicon();
  await generateAppleTouchIcon(iconBuffer);
  await processOgImage(ogBuffer);

  // Step 7: Patch metadata
  patchLayoutMetadata();
  patchManifest();

  // Summary
  console.log("\n============================================");
  console.log("  Done. Files created:");
  console.log("============================================\n");

  const files = [
    "public/favicon.ico",
    "public/apple-touch-icon.png",
    "public/og-image.jpg",
    "public/twitter-image.jpg",
    ...ICON_VARIANTS.map((v) => `public/icons/${v.name}`),
  ];
  for (const f of files) {
    const p = join(resolve(__dirname, ".."), f);
    if (existsSync(p)) {
      console.log(`  + ${f} (${(statSync(p).size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`  - ${f} (missing)`);
    }
  }
}

main().catch((err) => {
  console.error("\nFailed:", err);
  process.exit(1);
});
