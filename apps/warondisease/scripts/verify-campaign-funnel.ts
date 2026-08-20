/**
 * Ad-hoc verification + screenshot capture for the migrated campaign funnel
 * routes (/treaty, /vote, /vote/[code], /r/[code], /questions).
 *
 * Run from apps/warondisease with a dev server on :3010 and the local
 * docker-compose Postgres seeded:
 *   pnpm exec tsx scripts/verify-campaign-funnel.ts
 *
 * Writes screenshots + review HTML to
 * ../optimitron/output/playwright/review/ (never committed).
 */
import { chromium, devices, type Browser, type Page } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BASE = process.env.BASE_URL ?? "http://localhost:3010"
const OUT = path.resolve(
  __dirname,
  "../../optimitron/output/playwright/review",
)
const SHOTS = path.join(OUT, "warondisease-campaign-funnel")

const results: Array<{ name: string; ok: boolean; detail?: string }> = []
const shots: Array<{ label: string; file: string; viewport: string }> = []

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`)
}

async function shot(page: Page, label: string, viewport: string) {
  const file = `${label.replace(/[^a-z0-9-]+/gi, "-")}--${viewport}.png`
  await page.screenshot({ path: path.join(SHOTS, file), fullPage: true })
  shots.push({ label, file, viewport })
}

async function setRange(page: Page, value: number) {
  await page.locator("input[type=range]").first().evaluate((el, v) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!
    setter.call(input, String(v))
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new Event("change", { bubbles: true }))
  }, value)
}

async function login(page: Page, email: string) {
  const csrf = await page.request.get(`${BASE}/api/auth/csrf`)
  const { csrfToken } = (await csrf.json()) as { csrfToken: string }
  const res = await page.request.post(`${BASE}/api/auth/callback/credentials`, {
    form: { csrfToken, email, password: "anything", json: "true" },
  })
  if (!res.ok()) throw new Error(`login failed: ${res.status()}`)
  const session = await page.request.get(`${BASE}/api/auth/session`)
  const body = (await session.json()) as { user?: { id?: string } }
  if (!body.user?.id) throw new Error("no session after login")
  return body.user.id
}

async function voteYesThroughSlider(page: Page) {
  await setRange(page, 60)
  await page.getByRole("button", { name: "SUBMIT" }).click()
  await page.getByRole("button", { name: "YES", exact: true }).click()
}

async function run(browser: Browser) {
  // ---------- referral landings preserve attribution + utm params ----------
  {
    const ctx = await browser.newContext()
    const cases: Array<[string, string]> = [
      [
        "/vote/jane?sa=s1&utm_source=twitter&invite=tok",
        "/vote?ref=jane&sa=s1&invite=tok&utm_source=twitter",
      ],
      [
        "/r/jane?utm_medium=email&treatyFlow=v2",
        "/vote?ref=jane&treatyFlow=v2&utm_medium=email",
      ],
      [
        "/questions?ref=jane&utm_medium=email",
        "/vote?ref=jane&utm_medium=email",
      ],
    ]
    for (const [from, to] of cases) {
      const res = await ctx.request.get(`${BASE}${from}`, { maxRedirects: 0 })
      const location = res.headers()["location"] ?? ""
      const actual = new URL(location, BASE)
      const expected = new URL(to, BASE)
      // Sort by key then value: the default comparator stringifies each
      // [key, value] tuple, so a comma inside a key or value can make two
      // different pairs compare equal.
      const byKeyThenValue = (a: [string, string], b: [string, string]) =>
        a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])
      const actualParams = [...actual.searchParams.entries()].sort(byKeyThenValue)
      const expectedParams = [...expected.searchParams.entries()].sort(
        byKeyThenValue,
      )
      check(
        `${from} redirects with params preserved`,
        res.status() === 307 &&
          actual.origin === new URL(BASE).origin &&
          actual.pathname === expected.pathname &&
          JSON.stringify(actualParams) === JSON.stringify(expectedParams),
        `${res.status()} -> ${location}`,
      )
    }
    await ctx.close()
  }

  // ---------- logged-out /treaty (desktop + mobile) ----------
  for (const [viewport, ctxOpts] of [
    ["desktop", { viewport: { width: 1280, height: 900 } }],
    ["mobile", { ...devices["iPhone 13"] }],
  ] as const) {
    const ctx = await browser.newContext(ctxOpts)
    const page = await ctx.newPage()
    await page.goto(`${BASE}/treaty`, { waitUntil: "networkidle" })
    check(
      `treaty renders heading (${viewport})`,
      await page
        .getByText("Please quickly skim and sign to end war and disease.")
        .isVisible(),
    )
    check(
      `treaty renders signature box (${viewport})`,
      await page.getByPlaceholder("Your name").isVisible(),
    )
    await shot(page, "treaty-logged-out", viewport)
    await ctx.close()
  }

  // ---------- logged-out treaty signing ----------
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/treaty?ref=jane`, { waitUntil: "networkidle" })
    await page.getByPlaceholder("Your name").fill("Ada Q Lovelace")
    await page
      .getByRole("button", {
        name: "Add your first, middle, and last name (optional)",
      })
      .click()
    await page.getByPlaceholder("First name").fill("Ada")
    await page.getByPlaceholder("Middle name").fill("Q")
    await page.getByPlaceholder("Last name").fill("Lovelace")
    await shot(page, "treaty-signature-filled", "desktop")
    await page.getByRole("button", { name: "Sign", exact: true }).click()
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("pendingVote") ?? "null")?.answer ===
        "YES",
    )
    const pending = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pendingVote") ?? "null"),
    )
    check(
      "logged-out signing stages pending YES vote with names + ref",
      pending?.answer === "YES" &&
        pending?.displayName === "Ada Q Lovelace" &&
        pending?.firstName === "Ada" &&
        pending?.lastName === "Lovelace" &&
        pending?.referredBy === "jane" &&
        pending?.makePublic === true,
      JSON.stringify(pending),
    )
    await shot(page, "treaty-signed-logged-out", "desktop")
    await ctx.close()
  }

  // ---------- logged-out /vote (desktop + mobile) ----------
  for (const [viewport, ctxOpts] of [
    ["desktop", { viewport: { width: 1280, height: 900 } }],
    ["mobile", { ...devices["iPhone 13"] }],
  ] as const) {
    const ctx = await browser.newContext(ctxOpts)
    const page = await ctx.newPage()
    await page.goto(`${BASE}/vote?ref=jane`, { waitUntil: "networkidle" })
    check(
      `vote page renders slider (${viewport})`,
      await page.locator("input[type=range]").first().isVisible(),
    )
    await shot(page, "vote-logged-out", viewport)
    if (viewport === "desktop") {
      await voteYesThroughSlider(page)
      await page.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("pendingVote") ?? "null")?.answer ===
          "YES",
      )
      const pending = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("pendingVote") ?? "null"),
      )
      check(
        "logged-out voting stages pending YES vote with ref",
        pending?.answer === "YES" && pending?.referredBy === "jane",
        JSON.stringify(pending),
      )
      await shot(page, "vote-post-vote-logged-out", viewport)
    }
    await ctx.close()
  }

  // ---------- signed-in voting with referral attribution ----------
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    const page = await ctx.newPage()
    // Referrer account first, so the ref code resolves.
    const referrerId = await login(page, "test-referrer@example.com")
    const referrerSession = (await (
      await page.request.get(`${BASE}/api/auth/session`)
    ).json()) as { user?: { referralCode?: string; handle?: string } }
    const referrerCode =
      referrerSession.user?.referralCode ?? referrerSession.user?.handle
    await ctx.clearCookies()

    const voterId = await login(page, "test-voter@example.com")
    check("signed-in login works", Boolean(voterId), voterId)
    check(
      "referrer code resolved from session",
      Boolean(referrerCode),
      String(referrerCode),
    )
    await page.goto(`${BASE}/vote?ref=${referrerCode}`, {
      waitUntil: "networkidle",
    })
    const syncResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/votes/sync") && r.request().method() === "POST",
      { timeout: 60_000 },
    )
    await voteYesThroughSlider(page)
    const syncRes = await syncResponsePromise
    check("signed-in vote synced", syncRes.ok(), String(syncRes.status()))
    await shot(page, "vote-post-vote-signed-in", "desktop")

    const voteRow = await page.evaluate(async () => {
      const res = await fetch("/api/votes/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "YES" }),
      })
      return res.json()
    })
    check(
      "signed-in vote recorded (idempotent re-sync returns existing vote)",
      voteRow?.vote?.answer === "YES",
      JSON.stringify({
        answer: voteRow?.vote?.answer,
        referredByUserId: voteRow?.vote?.referredByUserId,
        expectedReferrer: referrerId,
      }),
    )
    check(
      "referral attribution persisted on the vote row",
      voteRow?.vote?.referredByUserId === referrerId,
      `referredByUserId=${voteRow?.vote?.referredByUserId} expected=${referrerId}`,
    )

    // Voted signed-in user gets redirected off /vote to /dashboard.
    const resp = await page.goto(`${BASE}/vote`, { waitUntil: "commit" })
    await page.waitForLoadState("domcontentloaded")
    check(
      "already-voted signed-in user is redirected to /dashboard",
      page.url().includes("/dashboard"),
      `landed on ${page.url()} (status ${resp?.status()})`,
    )
    await ctx.close()
  }

  // ---------- signed-in treaty signing writes Person names ----------
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    const page = await ctx.newPage()
    await login(page, "test-signer@example.com")
    // A signer who previously voted NO still sees the signature box; signing
    // must upgrade the recorded answer to YES.
    const noVote = await page.request.post(`${BASE}/api/votes/sync`, {
      data: { answer: "NO" },
    })
    check("pre-seeded NO vote for signer", noVote.ok(), String(noVote.status()))
    await page.goto(`${BASE}/treaty`, { waitUntil: "networkidle" })
    check(
      "NO voter still sees the signature box",
      await page.getByPlaceholder("Your name").isVisible(),
    )
    await page.getByPlaceholder("Your name").fill("Grace B Hopper")
    await page
      .getByRole("button", {
        name: "Add your first, middle, and last name (optional)",
      })
      .click()
    await page.getByPlaceholder("First name").fill("Grace")
    await page.getByPlaceholder("Middle name").fill("Brewster")
    await page.getByPlaceholder("Last name").fill("Hopper")
    const signSyncPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/votes/sync") && r.request().method() === "POST",
      { timeout: 60_000 },
    )
    await page.getByRole("button", { name: "Sign", exact: true }).click()
    const signSync = await signSyncPromise
    const signSyncBody = (await signSync.json()) as {
      vote?: { answer?: string }
    }
    check(
      "signing upgrades the existing NO vote to YES",
      signSync.ok() && signSyncBody.vote?.answer === "YES",
      `status=${signSync.status()} answer=${signSyncBody.vote?.answer}`,
    )
    await page
      .getByText("Signed. Thank you for ending war and disease.")
      .waitFor({ timeout: 60_000 })
    check("signed-in signing shows the signed state", true)
    await shot(page, "treaty-signed-signed-in", "desktop")

    // Revisiting /treaty shows the signed state from the server check.
    await page.goto(`${BASE}/treaty`, { waitUntil: "networkidle" })
    check(
      "returning signer sees signed state on fresh load",
      await page
        .getByText("Signed. Thank you for ending war and disease.")
        .isVisible(),
    )
    await ctx.close()
  }
}

async function main() {
  mkdirSync(SHOTS, { recursive: true })
  // The remote sandbox pre-installs Chromium at /opt/pw-browsers/chromium;
  // the app's pinned Playwright build may differ, so point at it explicitly.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  })
  try {
    await run(browser)
  } finally {
    await browser.close()
  }

  const rows = shots
    .map(
      (s) =>
        `<figure><figcaption>${s.label} — ${s.viewport}</figcaption><img src="warondisease-campaign-funnel/${s.file}" loading="lazy"></figure>`,
    )
    .join("\n")
  const checks = results
    .map(
      (r) =>
        `<li class="${r.ok ? "ok" : "fail"}">${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? ` <code>${r.detail.replace(/</g, "&lt;")}</code>` : ""}</li>`,
    )
    .join("\n")
  writeFileSync(
    path.join(OUT, "latest.html"),
    `<!doctype html><meta charset="utf-8"><title>War on Disease campaign funnel — after-only review</title>
<style>body{font-family:system-ui;margin:2rem;max-width:1400px}figure{margin:2rem 0;border:2px solid #000;padding:1rem}img{max-width:100%;border:1px solid #ccc}figcaption{font-weight:700;margin-bottom:.5rem}li.fail{color:#b00}</style>
<h1>War on Disease campaign funnel (issue #240) — after-only review</h1>
<p>Before captures unavailable: the visual-review baseline for current main is not yet published (capture protocol changed). These routes are new in apps/warondisease; the "before" surfaces live in apps/optimitron.</p>
<h2>Checks</h2><ul>${checks}</ul>
<h2>Screenshots</h2>${rows}`,
  )
  console.log(`\nreview: ${path.join(OUT, "latest.html")}`)
  const failed = results.filter((r) => !r.ok)
  if (failed.length) {
    console.error(`${failed.length} check(s) failed`)
    process.exit(1)
  }
}

void main()
