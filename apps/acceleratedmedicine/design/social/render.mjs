// Renders template.html at each social media size and saves the PNGs in images/. The site does not serve
// them: post them by hand, or publish them from public/ if a page should offer them.
//   node apps/acceleratedmedicine/design/social/render.mjs [output folder]
// Playwright is installed with the Optimitron web app, so it loads from there.
import { mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(here, "../../../optimitron/package.json"))
const { chromium } = require("@playwright/test")

const out = resolve(process.argv[2] ?? join(here, "images"))

// Current recommended sizes for each platform.
export const SIZES = [
  { file: "link-preview-1200x630", width: 1200, height: 630, layout: "landscape", use: "Link previews: Facebook, LinkedIn, X, Slack, iMessage (also the site's Open Graph image)" },
  { file: "x-post-1600x900", width: 1600, height: 900, layout: "wide", use: "X and Bluesky image posts (16:9)" },
  { file: "square-1080x1080", width: 1080, height: 1080, layout: "square", use: "Instagram, Facebook, LinkedIn and Threads posts (1:1)" },
  { file: "portrait-1080x1350", width: 1080, height: 1350, layout: "stacked", use: "Instagram and Facebook feed posts (4:5)" },
  { file: "pinterest-1000x1500", width: 1000, height: 1500, layout: "stacked", use: "Pinterest pins (2:3)" },
  { file: "story-1080x1920", width: 1080, height: 1920, layout: "story", use: "Instagram and Facebook Stories, Reels, TikTok, YouTube Shorts (9:16)" },
  { file: "x-header-1500x500", width: 1500, height: 500, layout: "banner", use: "X profile header (3:1)" },
  { file: "facebook-cover-1640x624", width: 1640, height: 624, layout: "banner", use: "Facebook page cover" },
  { file: "linkedin-cover-1128x191", width: 1128, height: 191, layout: "strip", use: "LinkedIn company page cover" },
  { file: "youtube-banner-2560x1440", width: 2560, height: 1440, layout: "youtube", use: "YouTube channel banner (content in the middle 1546 x 423)" },
]

mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const template = pathToFileURL(join(here, "template.html")).href
for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } })
  await page.goto(`${template}?layout=${size.layout}`, { waitUntil: "networkidle" })
  await page.waitForFunction(() => window.__ready === true)
  await page.screenshot({ path: join(out, `${size.file}.png`) })
  await page.close()
  console.log(`${size.file}.png  ${size.use}`)
}
await browser.close()
