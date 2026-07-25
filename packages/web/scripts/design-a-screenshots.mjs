// Screenshot pass for /design-a (EOS landing Version A: the catalog).
//
//   node scripts/design-a-screenshots.mjs [baseUrl]
//
// Captures desktop 1440 and mobile 390, each as a full-page shot plus a
// first-screen viewport crop, and writes a review page. Scroll-driven reveals
// (the pivot, the two-number dashboard) are triggered by a scroll pass before
// the full-page capture so they are not frozen in their initial state.

import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] ?? "http://127.0.0.1:3008";
const ROUTE = "/design-a";
const OUT = path.join(__dirname, "../output/playwright/review/eos-design-a");

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
];

const SECTIONS = [
  { id: "the-bill", label: "Section 1 tail: The Bill" },
  { id: "the-pivot", label: "The pivot: courtroom out, 1962 in" },
  { id: "the-store", label: "Section 2: The Store" },
  { id: "the-optimitron", label: "Section 4: The Optimitron" },
  { id: "the-competing-bid", label: "Section 3: The Competing Bid" },
];

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const shots = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto(`${BASE}${ROUTE}`, {
      waitUntil: "networkidle",
      timeout: 90_000,
    });
    await page.waitForTimeout(900);

    // first screen, before any scrolling
    const firstScreen = `${vp.name}-first-screen.png`;
    await page.screenshot({ path: path.join(OUT, firstScreen) });
    shots.push({ vp: vp.name, label: "First screen (viewport)", file: firstScreen });

    await scrollThrough(page);

    // section-anchored viewport crops
    for (const section of SECTIONS) {
      await page.evaluate((id) => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      }, section.id);
      await page.waitForTimeout(1400);
      const file = `${vp.name}-${section.id}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      shots.push({ vp: vp.name, label: section.label, file });
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const full = `${vp.name}-full.png`;
    await page.screenshot({ path: path.join(OUT, full), fullPage: true });
    shots.push({ vp: vp.name, label: "Full page", file: full });

    if (errors.length) {
      console.log(`[${vp.name}] console/page errors:\n  ${errors.join("\n  ")}`);
    } else {
      console.log(`[${vp.name}] no console or page errors`);
    }

    await context.close();
  }

  await browser.close();

  const byVp = VIEWPORTS.map((vp) => ({
    vp,
    items: shots.filter((s) => s.vp === vp.name),
  }));

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EOS landing Version A: the catalog</title>
<style>
  body{margin:0;background:#14120f;color:#f2efe7;font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
  header{padding:1.5rem clamp(1rem,4vw,2.5rem);border-bottom:1px solid #3a3730}
  h1{margin:0 0 .35rem;font-size:1.3rem}
  p.meta{margin:0;color:#9a9384;font-size:.85rem}
  section{padding:1.5rem clamp(1rem,4vw,2.5rem);border-bottom:1px solid #3a3730}
  h2{margin:0 0 1rem;font-size:1rem;color:#e0a012;letter-spacing:.1em;text-transform:uppercase}
  .grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))}
  figure{margin:0}
  figcaption{font-size:.78rem;color:#9a9384;margin-bottom:.4rem}
  img{width:100%;height:auto;display:block;border:1px solid #3a3730;background:#000}
  a{color:#a6d7e3}
</style></head><body>
<header>
  <h1>EOS landing Version A: the catalog</h1>
  <p class="meta">Route <code>${ROUTE}</code> &middot; captured from ${BASE} &middot; ${new Date().toISOString()}</p>
</header>
${byVp
  .map(
    ({ vp, items }) => `<section>
  <h2>${vp.name} (${vp.width}&times;${vp.height})</h2>
  <div class="grid">
    ${items
      .map(
        (s) => `<figure>
      <figcaption>${s.label}</figcaption>
      <a href="${s.file}"><img src="${s.file}" alt="${s.label} at ${vp.name}"></a>
    </figure>`,
      )
      .join("\n    ")}
  </div>
</section>`,
  )
  .join("\n")}
</body></html>
`;

  await writeFile(path.join(OUT, "latest.html"), html, "utf8");

  // stable bookmark at the canonical review path
  const stable = html.replace(/(src|href)="(?!http)([^"]+\.png)"/g, '$1="eos-design-a/$2"');
  await writeFile(
    path.join(__dirname, "../output/playwright/review/latest.html"),
    stable,
    "utf8",
  );

  console.log(`\nWrote ${shots.length} screenshots to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
