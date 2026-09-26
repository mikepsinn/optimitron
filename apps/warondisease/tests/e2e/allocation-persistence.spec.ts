import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { readFile, rm } from "node:fs/promises"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const treatySlug = "one-percent-treaty"
const coreStages = [
  "treaty_allocation_submitted",
  "treaty_answer_selected",
  "treaty_verification_requested",
  "treaty_response_saved",
  "treaty_referred_participant",
] as const
type CoreStage = typeof coreStages[number]
interface AnalyticsEvent {
  name: string
  params: Record<string, unknown> | undefined
}

async function captureAnalytics(page: Page) {
  const events: AnalyticsEvent[] = []
  await page.exposeFunction("__captureAnalyticsEvent", (event: AnalyticsEvent) => { events.push(event) })
  // Keep measurement local. The app's event helpers and real API calls still run.
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort())
  await page.route("https://*.google-analytics.com/**", (route) => route.abort())
  await page.addInitScript(() => {
    const browser = window as typeof window & {
      dataLayer: unknown[]
      gtag: (...args: unknown[]) => void
      __captureAnalyticsEvent: (event: { name: string; params: unknown }) => Promise<void>
    }
    const dataLayer: unknown[] = []
    dataLayer.push = (...entries: unknown[]) => {
      for (const entry of entries) {
        if (!entry || typeof entry !== "object" || !("length" in entry)) continue
        const [command, name, params] = Array.from(entry as ArrayLike<unknown>)
        if (command === "event" && typeof name === "string") {
          void browser.__captureAnalyticsEvent({ name, params })
        }
      }
      return Array.prototype.push.apply(dataLayer, entries)
    }
    browser.dataLayer = dataLayer
    // A configured GA bootstrap may replace gtag, but it uses this same dataLayer.
    browser.gtag = (...args: unknown[]) => { dataLayer.push(args) }
  })
  return events
}

async function expectStages(events: AnalyticsEvent[], stages: readonly CoreStage[]) {
  await expect.poll(() => events.filter((event) =>
    coreStages.includes(event.name as CoreStage),
  ).map((event) => event.name)).toEqual(stages)
  for (const event of events.filter((event) => event.name.startsWith("treaty_"))) {
    expect(event.params, `${event.name} must not disclose choices or identifying data`).toEqual({
      survey_id: treatySlug,
    })
  }
  expect(events.filter((event) => ["vote_submitted", "sign_up"].includes(event.name)),
    "An answer click or verification email request is not a completed signup or saved vote").toEqual([])
}

async function expectCompletionCounts(events: AnalyticsEvent[], referred: boolean) {
  await expect.poll(() => events.filter((event) => event.name === "treaty_response_saved").length).toBe(1)
  expect(events.filter((event) => event.name === "treaty_referred_participant")).toHaveLength(referred ? 1 : 0)
  for (const event of events.filter((event) => event.name.startsWith("treaty_"))) {
    expect(event.params).toEqual({ survey_id: treatySlug })
  }
}

test.beforeAll(async () => {
  // The suite also works on an empty migrated database, without a production seed.
  await pool.query(`INSERT INTO "Referendum"
    (id, slug, title, question, kind, status, "updatedAt")
    VALUES ($1, $2, 'Treaty allocation test', 'Treaty test ballot?', 'TREATY', 'ACTIVE', NOW())
    ON CONFLICT (slug) DO UPDATE SET status = 'ACTIVE', "deletedAt" = NULL`,
  [randomUUID(), treatySlug])
})

test.afterAll(async () => {
  await pool.end()
  await rm(process.env.AUTH_E2E_OUTBOX!, { force: true })
})

async function savedState(email: string) {
  const [users, votes, allocations] = await Promise.all([
    pool.query('SELECT id, "personId", "emailVerified" FROM "User" WHERE email = $1', [email]),
    pool.query(`SELECT v.id, v.answer, v."personId", v."referredByUserId" FROM "ReferendumVote" v
      JOIN "User" u ON u.id = v."userId"
      JOIN "Referendum" r ON r.id = v."referendumId"
      WHERE u.email = $1 AND r.slug = $2 AND v."deletedAt" IS NULL`, [email, treatySlug]),
    pool.query(`SELECT a.id, a."itemAId", a."itemBId", a."allocationA", a."allocationB"
      FROM "WishocraticAllocation" a JOIN "User" u ON u.id = a."userId"
      WHERE u.email = $1 AND a."deletedAt" IS NULL`, [email]),
  ])
  return { users: users.rows, votes: votes.rows, allocations: allocations.rows }
}

async function expectSaved(email: string, answer: "YES" | "NO", militaryPercent: number, referredByUserId: string | null = null) {
  const state = await savedState(email)
  expect(state.users).toHaveLength(1)
  expect(state.users[0].emailVerified).toBeTruthy()
  expect(state.votes).toEqual([{
    id: expect.any(String), answer, personId: state.users[0].personId, referredByUserId,
  }])
  expect(state.allocations, "The real vote API must persist exactly one correctly oriented allocation").toEqual([{
    id: expect.any(String),
    itemAId: "MILITARY_OPERATIONS",
    itemBId: "PRAGMATIC_CLINICAL_TRIALS",
    allocationA: militaryPercent,
    allocationB: 100 - militaryPercent,
  }])
  return state
}

async function pendingVote(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("pendingVote") || "null"))
}

async function expectCompactQuestion(page: Page) {
  const survey = page.locator("#vote")
  const details = survey.locator("details").filter({ has: page.locator("summary", { hasText: "Why 1%?" }) })
  const question = survey.getByText(/^Should all nations allocate just/u)
  const explanation = details.getByText(/^Governments spend/u)
  const yes = survey.getByRole("button", { name: "YES", exact: true })
  const no = survey.getByRole("button", { name: "NO", exact: true })
  await expect(question).toBeVisible()
  await expect(yes).toBeVisible()
  await expect(no).toBeVisible()
  await expect(details).toHaveJSProperty("open", false)
  await expect(explanation).toBeHidden()
  expect(await details.evaluate((element) => {
    const buttons = [...element.closest("#vote")!.querySelectorAll("button")]
      .filter((button) => ["YES", "NO"].includes(button.textContent?.trim() || ""))
    return buttons.length === 2 && buttons.every((button) =>
      Boolean(button.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
    )
  }), "The explanation belongs after both answer buttons").toBe(true)
  await details.locator("summary").click()
  await expect(explanation).toBeVisible()
  await expect(question).toBeVisible()
  await expect(yes).toBeVisible()
  await expect(no).toBeVisible()
  await details.locator("summary").click()
  await expect(explanation).toBeHidden()
  await survey.getByRole("button", { name: "pragmatic clinical trials", exact: true }).last().click()
  await expect(page.getByRole("dialog", { name: "What Are Pragmatic Clinical Trials?" })).toBeVisible()
  await page.getByRole("button", { name: "Close explanation", exact: true }).click()
  await expect(yes).toBeVisible()
  await expect(no).toBeVisible()
}

async function answerInBrowser(page: Page, militaryPercent: number, answer: "YES" | "NO", inspectDetails = false) {
  const survey = page.locator("#vote")
  const slider = survey.getByRole("slider")
  // The control measures clinical trials; the API payload measures military spending.
  const clinicalPercent = 100 - militaryPercent
  await slider.press(clinicalPercent > 50 ? "End" : "Home")
  const distance = clinicalPercent > 50 ? 100 - clinicalPercent : clinicalPercent
  for (let step = 0; step < distance; step++) {
    await slider.press(clinicalPercent > 50 ? "ArrowLeft" : "ArrowRight")
  }
  await expect(slider).toHaveValue(String(clinicalPercent))
  await survey.getByRole("button", { name: "SUBMIT", exact: true }).click()
  expect(await pendingVote(page)).toMatchObject({ answer: "", militaryAllocationPercent: militaryPercent })
  if (inspectDetails) await expectCompactQuestion(page)
  await survey.getByRole("button", { name: answer, exact: true }).click()
}

function nextVoteResponse(page: Page) {
  return page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/votes/sync" && response.request().method() === "POST",
  )
}

async function capturedVerificationLink(email: string) {
  const messages = (await readFile(process.env.AUTH_E2E_OUTBOX!, "utf8"))
    .trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
  const message = messages.findLast((item) => item.to === email || item.to?.includes(email))
  expect(Boolean(message), "The real email sender must reach the local capture transport").toBe(true)
  const link = message.text.match(/https?:\/\/[^\s]+\/api\/auth\/callback\/email\?[^\s]+/u)?.[0]
  expect(Boolean(link), "The captured email must contain the real NextAuth verification link").toBe(true)
  return link as string
}

test("allocation survives anonymous verification, revotes, retries, and rejected writes", async ({ page }) => {
  const email = `allocation-e2e-${test.info().project.name}-${randomUUID()}@example.invalid`
  const referrerId = randomUUID()
  const referralCode = `allocation-referrer-${randomUUID()}`
  await pool.query(`INSERT INTO "User" (id, email, "referralCode", "emailVerified", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())`,
  [referrerId, `${referralCode}@example.invalid`, referralCode])
  const events = await captureAnalytics(page)

  await test.step("anonymous homepage allocation reaches the database after real email verification", async () => {
    await page.goto(`/?ref=${referralCode}&invite=unresolved-${randomUUID()}`)
    await expect.poll(() => events.some((event) => event.name === "treaty_viewed")).toBe(true)
    await expectStages(events, [])
    await answerInBrowser(page, 37, "YES", true)
    await expectStages(events, coreStages.slice(0, 2))
    expect(events.filter((event) => event.name === "treaty_details_opened")).toHaveLength(1)
    expect(await pendingVote(page)).toMatchObject({ answer: "YES", militaryAllocationPercent: 37 })
    expect((await savedState(email)).votes).toHaveLength(0)
    expect((await savedState(email)).allocations).toHaveLength(0)
    await page.locator("#vote").getByLabel(/^Email/).fill(email)
    await page.locator("#vote").getByRole("button", { name: "Verify (magic link)", exact: true }).click()
    await expect(page.getByText("Check your email", { exact: true })).toBeVisible()
    await expectStages(events, coreStages.slice(0, 3))
    expect((await savedState(email)).votes).toHaveLength(0)

    const verificationLink = await capturedVerificationLink(email)
    const synced = nextVoteResponse(page)
    await page.goto(verificationLink)
    expect((await synced).status()).toBe(200)
    await expect(page).toHaveURL(/\/dashboard$/u)
    const session = await (await page.request.get("/api/auth/session")).json()
    expect(session.user?.email).toBe(email)
    await expect.poll(() => pendingVote(page)).toBeNull()
    await expectSaved(email, "YES", 37, referrerId)
    await expectStages(events, coreStages)
    await page.reload()
    await expectSaved(email, "YES", 37, referrerId)
    await expectStages(events, coreStages)
  })

  const original = await savedState(email)
  await test.step("authenticated slider revotes update the same rows at both allocation endpoints", async () => {
    for (const [militaryPercent, answer] of [[100, "NO"], [0, "YES"]] as const) {
      await page.goto("/survey/demo")
      const synced = nextVoteResponse(page)
      await answerInBrowser(page, militaryPercent, answer)
      expect((await synced).status()).toBe(200)
      await expect.poll(() => pendingVote(page)).toBeNull()
      const state = await expectSaved(email, answer, militaryPercent, referrerId)
      expect(state.votes[0].id).toBe(original.votes[0].id)
      expect(state.allocations[0].id).toBe(original.allocations[0].id)
      await expectCompletionCounts(events, true)
    }
  })

  await test.step("repeated sync is idempotent and signature-only sync preserves the allocation", async () => {
    const before = await savedState(email)
    for (const data of [{ answer: "YES", militaryAllocationPercent: 0 }, { answer: "YES" }]) {
      expect((await page.request.post("/api/votes/sync", { data })).status()).toBe(200)
      expect(await savedState(email)).toEqual(before)
    }
    await expectCompletionCounts(events, true)
  })

  await test.step("invalid allocations cannot partially change the vote", async () => {
    const before = await savedState(email)
    for (const invalid of [-1, 101, 37.5, "37", null, true]) {
      const response = await page.request.post("/api/votes/sync", {
        data: { answer: "NO", militaryAllocationPercent: invalid },
      })
      expect(response.status(), `Reject allocation ${JSON.stringify(invalid)} before any write`).toBe(400)
      expect(await savedState(email)).toEqual(before)
    }
    await expectCompletionCounts(events, true)
  })

  await test.step("a real allocation write failure rolls back the vote and retains the browser draft", async () => {
    const before = await savedState(email)
    // Only this synthetic user's writes fail. The local-only config rejects remote DBs.
    const constraint = `allocation_e2e_${randomUUID().replaceAll("-", "")}`
    const userLiteral = `'${String(before.users[0].id).replaceAll("'", "''")}'`
    await pool.query(`ALTER TABLE "WishocraticAllocation" ADD CONSTRAINT "${constraint}"
      CHECK ("userId" <> ${userLiteral}) NOT VALID`)
    try {
      await page.goto("/survey/demo")
      const failed = nextVoteResponse(page)
      await answerInBrowser(page, 64, "NO")
      expect((await failed).status()).toBe(500)
      expect(await savedState(email)).toEqual(before)
      expect(await pendingVote(page)).toMatchObject({ answer: "NO", militaryAllocationPercent: 64 })
      await expectCompletionCounts(events, true)
    } finally {
      await pool.query(`ALTER TABLE "WishocraticAllocation" DROP CONSTRAINT "${constraint}"`)
    }
    // A reload exercises the component's real pending-vote recovery, without a test-side sync.
    const retried = nextVoteResponse(page)
    await page.reload()
    expect((await retried).status()).toBe(200)
    await expect.poll(() => pendingVote(page)).toBeNull()
    const recovered = await expectSaved(email, "NO", 64, referrerId)
    expect(recovered.votes[0].id).toBe(original.votes[0].id)
    expect(recovered.allocations[0].id).toBe(original.allocations[0].id)
    await expectCompletionCounts(events, true)
  })
})

test("a failed first save is not a conversion and an unresolved referral gets no credit", async ({ page }) => {
  const userId = randomUUID()
  const email = `allocation-retry-${test.info().project.name}-${randomUUID()}@example.invalid`
  await pool.query(`INSERT INTO "User" (id, email, "referralCode", "updatedAt")
    VALUES ($1, $2, $3, NOW())`, [userId, email, randomUUID()])
  const events = await captureAnalytics(page)
  await page.goto(`/?ref=unresolved-${randomUUID()}`)
  await answerInBrowser(page, 64, "NO")
  await expectStages(events, coreStages.slice(0, 2))
  expect((await savedState(email)).users[0].emailVerified).toBeNull()
  await page.locator("#vote").getByLabel(/^Email/).fill(email)
  await page.locator("#vote").getByRole("button", { name: "Verify (magic link)", exact: true }).click()
  await expect(page.getByText("Check your email", { exact: true })).toBeVisible()
  await expectStages(events, coreStages.slice(0, 3))

  const constraint = `allocation_e2e_${randomUUID().replaceAll("-", "")}`
  const userLiteral = `'${userId.replaceAll("'", "''")}'`
  await pool.query(`ALTER TABLE "WishocraticAllocation" ADD CONSTRAINT "${constraint}"
    CHECK ("userId" <> ${userLiteral}) NOT VALID`)
  try {
    const failed = nextVoteResponse(page)
    await page.goto(await capturedVerificationLink(email))
    expect((await failed).status()).toBe(500)
    const state = await savedState(email)
    expect(state.users[0].emailVerified).toBeTruthy()
    expect(state.votes).toHaveLength(0)
    expect(state.allocations).toHaveLength(0)
    expect(await pendingVote(page)).toMatchObject({ answer: "NO", militaryAllocationPercent: 64 })
    await expectStages(events, coreStages.slice(0, 3))
  } finally {
    await pool.query(`ALTER TABLE "WishocraticAllocation" DROP CONSTRAINT "${constraint}"`)
  }

  const retried = nextVoteResponse(page)
  await page.reload()
  expect((await retried).status()).toBe(200)
  await expect.poll(() => pendingVote(page)).toBeNull()
  await expectSaved(email, "NO", 64)
  await expectStages(events, coreStages.slice(0, 4))
  await page.reload()
  await expectSaved(email, "NO", 64)
  await expectCompletionCounts(events, false)
  expect(events.filter((event) => event.name === "treaty_details_opened")).toHaveLength(0)
})
