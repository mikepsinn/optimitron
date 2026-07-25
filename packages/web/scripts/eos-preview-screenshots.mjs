// Ad-hoc screenshot capture for /eos-preview (all 11 sections). Desktop
// 1440px and mobile 390px. Run from packages/web against the canonical dev
// server on port 3001 (override with BASE_URL). Output under
// output/playwright/review/eos-landing/. Screenshots are treated as
// sensitive and never committed.
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

const SECTIONS = [
  { id: "#the-bill", slug: "s01-bill", label: "Section 1 — The Bill" },
  { id: ".eos-pivot", slug: "pivot", label: "The pivot (register shift)" },
  { id: "#the-store", slug: "s02-store", label: "Section 2 — The Store" },
  { id: "#comparison", slug: "s03-matrix", label: "Section 3 — Comparison Matrix" },
  { id: "#products", slug: "s04-products", label: "Section 4 — Featured Products" },
  { id: "#suite", slug: "s05-suite", label: "Section 5 — Government Replacement Suite" },
  { id: "#thermostat", slug: "s06-thermostat", label: "Section 6 — Thermostat" },
  { id: "#select-earth", slug: "s07-select-earth", label: "Section 7 — Please Select an Earth" },
  { id: "#optimized-day", slug: "s08-day", label: "Section 8 — A Day in the Optimized Life" },
  { id: "#reviews", slug: "s09-reviews", label: "Section 9 — Reviews" },
  { id: "#your-move", slug: "s10-your-move", label: "Section 10 — Your Move" },
  { id: "#closer", slug: "s11-footer", label: "Section 11 — Footer" },
];

const shots = [];

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.name === "desktop" ? 1.5 : 2,
      reducedMotion: "reduce", // freeze reveal + counters for stable captures
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1000);

    // Full page
    const full = `${vp.name}-full.png`;
    await page.screenshot({ path: path.join(OUT, full), fullPage: true });
    shots.push({ vp: vp.name, kind: "Full page", file: full });

    for (const s of SECTIONS) {
      const el = await page.$(s.id);
      if (!el) {
        shots.push({ vp: vp.name, kind: s.label, file: null, missing: true });
        continue;
      }
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const f = `${vp.name}-${s.slug}.png`;
      await el.screenshot({ path: path.join(OUT, f) });
      shots.push({ vp: vp.name, kind: s.label, file: f });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(shots, null, 2));
console.log(`\nCaptured ${shots.filter((s) => s.file).length} screenshots to ${OUT}`);
