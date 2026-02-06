/**
 * Generate simple PNG icons for the extension using Canvas API.
 * Run: node scripts/generate-icons.mjs
 * 
 * For now, creates placeholder SVG-based icons.
 * Replace with real icons later.
 */

import { writeFileSync, mkdirSync } from "fs";

// Simple SVG heart+shield icon
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c5cfc"/>
      <stop offset="100%" style="stop-color:#5c3cd6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.5}" fill="white">🛡️</text>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });

// Since we can't easily generate PNG from SVG in Node without dependencies,
// we'll create SVG files and reference them. Chrome supports SVG icons in dev mode.
// For production, replace with real PNGs.
for (const size of [16, 48, 128]) {
  writeFileSync(`public/icons/icon${size}.svg`, createSVG(size));
  console.log(`Created icon${size}.svg`);
}

// Also create minimal 1x1 PNGs as placeholders so manifest doesn't error
// (Chrome requires actual PNG files)
// This is the smallest valid PNG: 1x1 purple pixel
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, // 8-bit RGB
  0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
  0x08, 0xd7, 0x63, 0xd8, 0xd0, 0xf8, 0x0f, 0x00, // compressed data (purple-ish pixel)
  0x01, 0x01, 0x00, 0x80, 0x18, 0xd8, 0x5e, 0x2c, // 
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
  0xae, 0x42, 0x60, 0x82
]);

for (const size of [16, 48, 128]) {
  writeFileSync(`public/icons/icon${size}.png`, PNG_HEADER);
  console.log(`Created icon${size}.png (placeholder)`);
}

console.log("\\nDone! Replace PNGs with proper icons for production.");
