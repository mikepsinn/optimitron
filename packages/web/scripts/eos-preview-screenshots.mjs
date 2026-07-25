// Ad-hoc screenshot capture for /eos-preview (Section 1 The Bill + Section 3
// Comparison Matrix). Desktop 1440px and mobile 390px. Run from packages/web
// against the canonical dev server on port 3001 (override with BASE_URL).
// Output under output/playwright/review/eos-landing/. Screenshots are treated
// as sensitive and never committed.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../output/playwright/review/eos-landing");
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3001";
const URL = `${BASE}/eos-preview`;

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const shots = [];

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      reducedMotion: "reduce", // freeze reveal + counter for stable captures
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    // let fonts settle
    await page.waitForTimeout(800);

    // Full page
    const full = `${vp.name}-full.png`;
    await page.screenshot({ path: path.join(OUT, full), fullPage: true });
    shots.push({ vp: vp.name, kind: "Full page", file: full });

    // Section 1 — The Bill
    const bill = await page.$("#the-bill");
    if (bill) {
      const f = `${vp.name}-section1-bill.png`;
      await bill.screenshot({ path: path.join(OUT, f) });
      shots.push({ vp: vp.name, kind: "Section 1 — The Bill", file: f });
    }

    // The pivot bridge
    const pivot = await page.$(".eos-pivot");
    if (pivot) {
      const f = `${vp.name}-pivot.png`;
      await pivot.screenshot({ path: path.join(OUT, f) });
      shots.push({ vp: vp.name, kind: "The pivot (register shift)", file: f });
    }

    // Section 3 — Comparison Matrix
    const matrix = await page.$("#comparison");
    if (matrix) {
      await matrix.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const f = `${vp.name}-section3-matrix.png`;
      await matrix.screenshot({ path: path.join(OUT, f) });
      shots.push({ vp: vp.name, kind: "Section 3 — Comparison Matrix", file: f });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(shots, null, 2));
console.log(`\nCaptured ${shots.length} screenshots to ${OUT}`);
