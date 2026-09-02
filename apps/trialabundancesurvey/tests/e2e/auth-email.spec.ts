import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"
import { readFile, rm, mkdir } from "node:fs/promises"
import path from "node:path"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const emailFor = (name: string) => `auth-e2e-${test.info().project.name}-${name}@example.invalid`

async function verificationLink(email: string) {
  const messages = (await readFile(process.env.AUTH_E2E_OUTBOX!, "utf8"))
    .trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
  const message = messages.findLast((item) => item.to === email || item.to?.includes(email))
  expect(message, "The real email sender must deliver to the capture transport").toBeTruthy()
  const link = message.text.match(/https?:\/\/[^\s]+\/api\/auth\/callback\/email\?[^\s]+/u)?.[0]
  expect(Boolean(link), "The email must contain a verification link").toBe(true)
  return new URL(link)
}

async function requestLink(page: Page, email: string) {
  await page.getByRole("button", { name: "Continue with Email", exact: true }).click()
  await page.getByLabel("Email", { exact: true }).fill(email)
  await expect(page.getByLabel("Subscribe for updates on our progress")).toHaveCount(0)
  await page.getByRole("button", { name: "Send magic link", exact: true }).click()
  await expect(page.getByText("Check your email!", { exact: true })).toBeVisible()
  return verificationLink(email)
}

async function expectDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard$/u)
  await expect(page.getByRole("heading", { name: "Your survey response" })).toBeVisible()
  const session = await (await page.request.get("/api/auth/session")).json()
  expect(Boolean(session.user?.id), "Email verification must create a real session").toBe(true)
}

async function capture(page: Page, name: string) {
  if (!process.env.AUTH_CAPTURE_REVIEW) return
  const directory = path.resolve("../optimitron/output/playwright/review")
  await mkdir(directory, { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }))
  await page.mouse.move(0, 0)
  await page.screenshot({
    path: path.join(directory, `${name}-${test.info().project.name}-after.png`),
    fullPage: true,
    animations: "disabled",
  })
}

test.afterAll(async () => {
  await pool.end()
  await rm(process.env.AUTH_E2E_OUTBOX!, { force: true })
})

test("survey email link saves the answers and lands on the dashboard", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Yes", exact: true }).click()
  await expect(page.getByText("Question 2 of 3", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Not sure", exact: true }).click()
  await page.getByRole("slider").press("ArrowRight")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("combobox", { name: "Country", exact: true }).selectOption("US")
  await page.getByLabel("State", { exact: true }).fill("Missouri")
  await page.getByRole("combobox", { name: "Your role", exact: true }).selectOption("patient-or-caregiver")
  await expect(page.getByRole("checkbox")).not.toBeChecked()
  await page.getByRole("button", { name: "Continue to verification", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Save your response" })).toBeVisible()
  if (process.env.AUTH_CAPTURE_REVIEW) {
    await expect(page.getByText("Question 3 of 3", { exact: true })).toHaveCount(0)
    await expect(page.locator("canvas")).toHaveCount(0)
  }
  await capture(page, "survey-auth-form")
  const email = emailFor("survey")
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByRole("button", { name: "Email me a verification link" }).click()
  await expect(page.getByText("Check your email!", { exact: true })).toBeVisible()
  const link = await verificationLink(email)
  const completion = new URL(link.searchParams.get("callbackUrl")!)
  expect(completion.pathname).toBe("/auth/complete-signup")
  expect(completion.searchParams.get("callbackUrl")).toBe("/dashboard")
  await page.goto(link.href)
  await expectDashboard(page)
  await expect(page.getByText("Patient access: YES", { exact: true })).toBeVisible()
  await expect(page.getByText("Patient-funded access: NOT SURE", { exact: true })).toBeVisible()
  await expect(page.getByText("Allocation: 49% military and weapons, 51% pragmatic clinical trials", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText("Patient access: YES", { exact: true })).toBeVisible()
  await capture(page, "survey-auth-dashboard")

  await page.getByRole("button", { name: "Toggle menu" }).click()
  await page.getByRole("button", { name: "Log Out", exact: true }).click()
  await expect(page).toHaveURL(/\/$/u)
  await page.goto(link.href)
  await expect(page.getByRole("heading", { name: "Sign in again" })).toBeVisible()
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual({})
  await capture(page, "survey-auth-used-link")
  await page.getByRole("link", { name: "Get a new sign-in link" }).click()
  await expect(page.getByRole("button", { name: "Continue with Email", exact: true })).toBeVisible()
  await capture(page, "survey-auth-signin")
  const replacement = await requestLink(page, email)
  await page.goto(replacement.href)
  await expectDashboard(page)
})

test("an already-issued homepage callback finishes on the dashboard in a new browser", async ({ page, browser }) => {
  // Request the legacy callback exactly as the old survey form did.
  const csrf = await (await page.request.get("/api/auth/csrf")).json()
  const result = await page.request.post("/api/auth/signin/email", {
    form: {
      email: emailFor("legacy"),
      csrfToken: csrf.csrfToken,
      callbackUrl: "/auth/complete-signup?callbackUrl=%2F%23vote",
      json: "true",
    },
  })
  expect(result.ok()).toBe(true)
  const link = await verificationLink(emailFor("legacy"))
  const freshContext = await browser.newContext()
  try {
    const freshPage = await freshContext.newPage()
    await freshPage.goto(link.href)
    await expect(freshPage).toHaveURL(/\/dashboard$/u)
    await expect(freshPage.getByRole("heading", { name: "Your survey response" })).toBeVisible()
    const session = await (await freshPage.request.get(new URL("/api/auth/session", link.origin).href)).json()
    expect(Boolean(session.user?.id)).toBe(true)
  } finally {
    await freshContext.close()
  }
  if (process.env.AUTH_CAPTURE_REVIEW) {
    await page.goto("/auth/complete-signup?visual=1")
    await expect(page.getByRole("heading", { name: "Verifying response..." })).toBeVisible()
    await capture(page, "survey-auth-completion")
  }
})

test("an expired link offers a fresh login without creating a session", async ({ page }) => {
  const email = emailFor("expired")
  await page.goto("/auth/signin")
  const link = await requestLink(page, email)
  // Expire only this test's token. No clock sleeps or global database resets.
  const expired = await pool.query(
    'UPDATE "VerificationToken" SET expires = $1 WHERE identifier = $2',
    [new Date("2000-01-01T00:00:00Z"), email],
  )
  expect(expired.rowCount).toBeGreaterThan(0)
  await page.goto(link.href)
  await expect(page.getByRole("heading", { name: "Sign in again" })).toBeVisible()
  await expect(page.getByText("The verification link has expired or has already been used.")).toBeVisible()
  expect(await (await page.request.get("/api/auth/session")).json()).toEqual({})
  await capture(page, "survey-auth-expired-link")
  await page.getByRole("link", { name: "Get a new sign-in link" }).click()
  const replacement = await requestLink(page, email)
  await page.goto(replacement.href)
  await expectDashboard(page)
})

test("a failed link cannot save another person's draft to the active account", async ({ page }) => {
  const activeEmail = emailFor("active-account")
  const pendingEmail = emailFor("pending-account")
  await page.goto("/auth/signin")
  const activeLink = await requestLink(page, activeEmail)
  await page.goto(activeLink.href)
  await expectDashboard(page)
  const activeSession = await (await page.request.get("/api/auth/session")).json()
  const accountState = async () => Promise.all([
    pool.query(`SELECT u."newsletterSubscribed", p."displayName" FROM "User" u
      LEFT JOIN "Person" p ON p.id = u."personId" WHERE u.id = $1`, [activeSession.user.id]),
    pool.query('SELECT id, answer FROM "ReferendumVote" WHERE "userId" = $1 ORDER BY id', [activeSession.user.id]),
  ]).then((results) => results.map(({ rows }) => rows))
  const before = await accountState()

  await page.goto("/auth/signin")
  const failedLink = await requestLink(page, pendingEmail)
  await pool.query('UPDATE "VerificationToken" SET expires = $1 WHERE identifier = $2', [
    new Date("2000-01-01T00:00:00Z"), pendingEmail,
  ])
  // Model a second person's unsaved draft in a shared browser.
  const pending = {
    patientAccessAnswer: "NO", selfFundedAccessAnswer: "YES",
    militaryAllocationPercent: 37, referredBy: null, timestamp: "2026-01-15T00:00:00Z",
  }
  await page.evaluate((draft) => {
    localStorage.setItem("pendingTrialAbundanceResponse", JSON.stringify(draft))
    localStorage.setItem("signup_name", "Pending respondent")
    localStorage.setItem("signup_subscribe", "true")
  }, pending)

  await page.goto(failedLink.href)
  await expect(page.getByRole("heading", { name: "Sign in again" })).toBeVisible()
  await capture(page, "survey-auth-wrong-account")
  expect((await (await page.request.get("/api/auth/session")).json()).user.id).toBe(activeSession.user.id)
  expect(await accountState()).toEqual(before)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pendingTrialAbundanceResponse")!))).toEqual(pending)

  await page.getByRole("link", { name: "Get a new sign-in link" }).click()
  const replacement = await requestLink(page, pendingEmail)
  await page.goto(replacement.href)
  await expectDashboard(page)
  const verifiedSession = await (await page.request.get("/api/auth/session")).json()
  expect(verifiedSession.user.email).toBe(pendingEmail)
  expect(verifiedSession.user.id).not.toBe(activeSession.user.id)
  await expect(page.getByText("Patient access: NO", { exact: true })).toBeVisible()
  await expect(page.getByText("Patient-funded access: YES", { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem("pendingTrialAbundanceResponse"))).toBeNull()

  // Even a same-account consumed link must offer recovery, not infer identity.
  await page.goto(replacement.href)
  await expect(page.getByRole("heading", { name: "Sign in again" })).toBeVisible()
})
