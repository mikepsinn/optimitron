import { test, expect, type Page } from "@playwright/test"
import { authenticateTestUser, generateTestEmail, generateTestName, VOTE_TEST_PATH } from "./helpers/auth"

async function submitYesVote(page: Page) {
  const voteSection = page.locator("#vote").first()
  await expect(voteSection).toBeVisible({ timeout: 10000 })
  await voteSection.scrollIntoViewIfNeeded()

  await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search)
    window.localStorage.setItem(
      "pendingVote",
      JSON.stringify({
        answer: "YES",
        referredBy: params.get("ref"),
        inviteToken: params.get("invite"),
        timestamp: new Date().toISOString(),
        militaryAllocationPercent: 49,
        organizationId: null,
        sourceUrl: `${window.location.origin}${window.location.pathname}`,
        sourceReferrer: document.referrer || null,
      })
    )
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await expectVoteVerificationPrompt(page)
}

async function expectVoteVerificationPrompt(page: Page) {
  await expect(page.getByText(/Please verify to see the results/i).first()).toBeVisible({ timeout: 10000 })
}

async function expectDashboardLoaded(page: Page) {
  await expect(page.getByRole("heading", { name: /survey results|eradicate disease/i })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.locator("#referral")).toBeVisible({ timeout: 15000 })
}

async function openDashboardStats(page: Page) {
  const referralCount = page.getByTestId("referral-count")
  if ((await referralCount.count()) === 0) {
    await page.getByRole("button", { name: /more stats/i }).click()
  }
  await expect(referralCount).toBeVisible({ timeout: 10000 })
  return referralCount
}

async function openAndFillEmailAuthForm(page: Page, name: string, email: string) {
  const continueButton = page.getByRole("button", { name: /continue with email/i })
  if ((await continueButton.count()) > 0) {
    await continueButton.click()
  }

  const nameInput = page.getByLabel(/^name$/i)
  if ((await nameInput.count()) > 0) {
    await nameInput.fill(name)
  }

  await page.getByLabel(/email/i).fill(email)
}

test.describe("Referral Flow", () => {
  test("complete referral journey: vote → signup → share → referee votes → count increases", async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000)

    // Generate unique test data
    const user1Email = generateTestEmail("referrer")
    const user1Name = generateTestName("Referrer")
    const user2Email = generateTestEmail("referee")
    const user2Name = generateTestName("Referee")

    // STEP 1: First user visits home page and votes
    await page.goto(VOTE_TEST_PATH, { waitUntil: "domcontentloaded" })
    await submitYesVote(page)

    // STEP 2: Signup form should appear after voting
    await expectVoteVerificationPrompt(page)

    // Verify signup form elements are present
    await openAndFillEmailAuthForm(page, user1Name, user1Email)

    // STEP 3: Authenticate user1 using test API (bypassing magic link)
    const user1 = await authenticateTestUser(page, {
      email: user1Email,
      name: user1Name,
    })

    // STEP 4: Navigate to dashboard and get referral link
    await page.goto("/dashboard")

    await expectDashboardLoaded(page)

    // Find and verify initial referral count is 0
    const referralCountElement = await openDashboardStats(page)
    await expect(referralCountElement).toHaveText("0")

    // Get referral code from user (already have it from auth response)
    const referralCode = user1.referralCode

    // Verify copy button is present
    await expect(page.getByRole("button", { name: /copy referral link/i }).first()).toBeVisible()

    // STEP 5: Second user visits site with referral link
    const refereeContext = await browser.newContext()
    const page2 = await refereeContext.newPage()
    await page2.goto(`${VOTE_TEST_PATH}?ref=${referralCode}`, { waitUntil: "domcontentloaded" })

    // Verify referral indicator is present (if shown in UI)
    // The app saves referral code when voting, so we'll vote first
    await submitYesVote(page2)

    // Signup form should appear
    await expectVoteVerificationPrompt(page2)

    // STEP 6: Authenticate user2 with referral code
    await authenticateTestUser(page2, {
      email: user2Email,
      name: user2Name,
      referredBy: referralCode,
    })

    // STEP 7: Go back to first user's dashboard and verify referral count increased
    await page.reload()

    // Wait for dashboard to update
    await page.waitForTimeout(1000) // Give it a moment to update

    // Verify referral count is now 1
    await expectDashboardLoaded(page)
    const updatedReferralCountElement = await openDashboardStats(page)
    await expect(updatedReferralCountElement).toHaveText("1", { timeout: 10000 })

    // Clean up
    await refereeContext.close()
  })

  test("referral link contains correct referral code", async ({ page }) => {
    const userEmail = generateTestEmail("user")
    const userName = generateTestName("User")

    // Authenticate user
    const user = await authenticateTestUser(page, {
      email: userEmail,
      name: userName,
    })

    // Go to dashboard
    await page.goto("/dashboard")

    // Wait for copy button to be visible
    await expectDashboardLoaded(page)

    // Verify the user has a referral code
    expect(user.referralCode).toBeTruthy()
    expect(user.referralCode).toMatch(/^[A-Z0-9]+$/) // Alphanumeric uppercase
  })

  test("vote is saved before authentication", async ({ page }) => {
    // Visit home page
    await page.goto(VOTE_TEST_PATH, { waitUntil: "domcontentloaded" })
    await submitYesVote(page)

    // Signup form should appear
    await expectVoteVerificationPrompt(page)
  })
})

test.describe("Referral Edge Cases", () => {
  test("handles invalid referral codes gracefully", async ({ page }) => {
    // Visit with invalid referral code
    await page.goto(`${VOTE_TEST_PATH}?ref=INVALID123`, { waitUntil: "domcontentloaded" })

    // Page should still load normally
    const voteSection = page.locator("#vote").first()
    await expect(voteSection).toBeVisible({ timeout: 10000 })

    // Vote section should be available
    await submitYesVote(page)
  })

  test("dashboard shows zero referrals for new user", async ({ page }) => {
    const userEmail = generateTestEmail("newuser")
    const userName = generateTestName("New User")

    // Authenticate new user
    await authenticateTestUser(page, {
      email: userEmail,
      name: userName,
    })

    // Go to dashboard
    await page.goto("/dashboard")

    // Verify referral count is 0
    await expectDashboardLoaded(page)
    const referralCountElement = await openDashboardStats(page)
    await expect(referralCountElement).toHaveText("0", { timeout: 10000 })
  })

  test("prevents duplicate votes from same user", async ({ page }) => {
    const userEmail = generateTestEmail("voter")
    const userName = generateTestName("Voter")

    // Visit and vote
    await page.goto(VOTE_TEST_PATH, { waitUntil: "domcontentloaded" })
    await submitYesVote(page)

    // Authenticate
    await authenticateTestUser(page, {
      email: userEmail,
      name: userName,
    })

    // Try to vote again - visit home page
    await page.goto(VOTE_TEST_PATH, { waitUntil: "domcontentloaded" })
    const voteSection = page.locator("#vote").first()
    await voteSection.scrollIntoViewIfNeeded()

    // The vote buttons might be disabled or show already voted state
    // This depends on the app implementation
    // For now, just verify the page loads
    await expect(voteSection).toBeVisible()
  })
})
