// Renders template.html at each size in lib/social-images.json. /resources offers the PNGs for download and
// shows the WebP thumbnails.
//   node apps/acceleratedmedicine/design/social/render.mjs
// Playwright and sharp are installed with the Optimitron web app, so they load from there.
import { mkdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(here, "../../../optimitron/package.json"))
const { chromium } = require("@playwright/test")
const sharp = require("sharp")

const images = JSON.parse(readFileSync(join(here, "../../lib/social-images.json"), "utf8"))
const out = join(here, "../../public/assets/acceleratedmedicine/social")
mkdirSync(join(out, "thumbs"), { recursive: true })

const browser = await chromium.launch()
const template = pathToFileURL(join(here, "template.html")).href
for (const image of images) {
  const page = await browser.newPage({ viewport: { width: image.width, height: image.height } })
  await page.goto(`${template}?layout=${image.layout}`, { waitUntil: "networkidle" })
  const ready = await (await page.waitForFunction(() => window.__ready)).jsonValue()
  if (ready !== true) throw new Error(`${image.file}: ${ready}`)
  const png = await page.screenshot()
  await page.close()
  await sharp(png).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(out, `${image.file}.png`))
  // A preview crop shows only the part the platform displays on most screens (the YouTube banner's middle strip).
  const thumbnail = image.preview ? sharp(png).extract(image.preview) : sharp(png)
  await thumbnail.resize({ width: 720, height: 480, fit: "inside" }).webp({ quality: 82 })
    .toFile(join(out, "thumbs", `${image.file}.webp`))
  console.log(`${image.file}.png  ${image.use}`)
}
await browser.close()
