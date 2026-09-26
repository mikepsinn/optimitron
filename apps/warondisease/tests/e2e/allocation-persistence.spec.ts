import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { readFile, rm } from "node:fs/promises"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const treatySlug = "one-percent-treaty"

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
    pool.query(`SELECT v.id, v.answer, v."personId" FROM "ReferendumVote" v
      JOIN "User" u ON u.id = v."userId"
      JOIN "Referendum" r ON r.id = v."referendumId"
      WHERE u.email = $1 AND r.slug = $2 AND v."deletedAt" IS NULL`, [email, treatySlug]),
    pool.query(`SELECT a.id, a."itemAId", a."itemBId", a."allocationA", a."allocationB"
      FROM "WishocraticAllocation" a JOIN "User" u ON u.id = a."userId"
      WHERE u.email = $1 AND a."deletedAt" IS NULL`, [email]),
  ])
  return { users: users.rows, votes: votes.rows, allocations: allocations.rows }
}

async function expectSaved(email: string, answer: "YES" | "NO", militaryPercent: number) {
  const state = await savedState(email)
  expect(state.users).toHaveLength(1)
  expect(state.users[0].emailVerified).toBeTruthy()
  expect(state.votes).toEqual([{
    id: expect.any(String), answer, personId: state.users[0].personId,
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

async function answerInBrowser(page: Page, militaryPercent: number, answer: "YES" | "NO") {
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

  await test.step("anonymous homepage allocation reaches the database after real email verification", async () => {
    await page.goto("/")
    await answerInBrowser(page, 37, "YES")
    expect(await pendingVote(page)).toMatchObject({ answer: "YES", militaryAllocationPercent: 37 })
    expect((await savedState(email)).votes).toHaveLength(0)
    expect((await savedState(email)).allocations).toHaveLength(0)
    await page.locator("#vote").getByLabel(/^Email/).fill(email)
    await page.locator("#vote").getByRole("button", { name: "Verify (magic link)", exact: true }).click()
    await expect(page.getByText("Check your email", { exact: true })).toBeVisible()

    const verificationLink = await capturedVerificationLink(email)
    const synced = nextVoteResponse(page)
    await page.goto(verificationLink)
    expect((await synced).status()).toBe(200)
    await expect(page).toHaveURL(/\/dashboard$/u)
    const session = await (await page.request.get("/api/auth/session")).json()
    expect(session.user?.email).toBe(email)
    await expect.poll(() => pendingVote(page)).toBeNull()
    await expectSaved(email, "YES", 37)
    await page.reload()
    await expectSaved(email, "YES", 37)
  })

  const original = await savedState(email)
  await test.step("authenticated slider revotes update the same rows at both allocation endpoints", async () => {
    for (const [militaryPercent, answer] of [[100, "NO"], [0, "YES"]] as const) {
      await page.goto("/survey/demo")
      const synced = nextVoteResponse(page)
      await answerInBrowser(page, militaryPercent, answer)
      expect((await synced).status()).toBe(200)
      await expect.poll(() => pendingVote(page)).toBeNull()
      const state = await expectSaved(email, answer, militaryPercent)
      expect(state.votes[0].id).toBe(original.votes[0].id)
      expect(state.allocations[0].id).toBe(original.allocations[0].id)
    }
  })

  await test.step("repeated sync is idempotent and signature-only sync preserves the allocation", async () => {
    const before = await savedState(email)
    for (const data of [{ answer: "YES", militaryAllocationPercent: 0 }, { answer: "YES" }]) {
      expect((await page.request.post("/api/votes/sync", { data })).status()).toBe(200)
      expect(await savedState(email)).toEqual(before)
    }
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
    } finally {
      await pool.query(`ALTER TABLE "WishocraticAllocation" DROP CONSTRAINT "${constraint}"`)
    }
    // A reload exercises the component's real pending-vote recovery, without a test-side sync.
    const retried = nextVoteResponse(page)
    await page.reload()
    expect((await retried).status()).toBe(200)
    await expect.poll(() => pendingVote(page)).toBeNull()
    const recovered = await expectSaved(email, "NO", 64)
    expect(recovered.votes[0].id).toBe(original.votes[0].id)
    expect(recovered.allocations[0].id).toBe(original.allocations[0].id)
  })
})
