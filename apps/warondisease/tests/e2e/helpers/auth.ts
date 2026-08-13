import type { Page } from "@playwright/test"

interface TestUser {
  email: string
  name: string
  referredBy?: string
}

interface AuthenticatedUser {
  id: string
  email: string
  name: string
  referralCode: string
}

export const VOTE_TEST_PATH = "/survey/demo"

/**
 * Creates a test user and authenticates them using the test API
 * Only works in development/test environments
 */
export async function authenticateTestUser(
  page: Page,
  user: TestUser
): Promise<AuthenticatedUser> {
  // Use Playwright's request context to make the API call
  // This properly handles cookies and can set them in the browser context
  const response = await page.request.post("http://localhost:3000/api/test/auth", {
    data: {
      email: user.email,
      name: user.name,
      referredBy: user.referredBy,
    },
  })

  if (!response.ok()) {
    const text = await response.text()
    throw new Error(`Failed to authenticate test user: ${response.status()} - ${text}`)
  }

  const data = await response.json()

  // The cookie is automatically set in the browser context by Playwright
  // when using page.request.post() - it shares cookies with the page context

  // Navigate to a page to ensure the session is loaded
  // This is needed because the cookie needs to be sent in a request
  await page.goto(VOTE_TEST_PATH, { waitUntil: "domcontentloaded" })
  await syncPendingVoteIfPresent(page)

  return data.user
}

async function syncPendingVoteIfPresent(page: Page) {
  const result = await page.evaluate(async () => {
    const pendingVote = window.localStorage.getItem("pendingVote")
    if (!pendingVote) return { skipped: true }

    const response = await fetch("/api/votes/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: pendingVote,
    })

    const body = await response.text()
    if (response.ok) {
      window.localStorage.removeItem("pendingVote")
    }

    return {
      skipped: false,
      ok: response.ok,
      status: response.status,
      body,
    }
  })

  if (!result.skipped && !result.ok) {
    throw new Error(`Failed to sync pending vote: ${result.status} - ${result.body}`)
  }
}

/**
 * Generates a unique test email
 */
export function generateTestEmail(prefix: string = "test"): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}@test.example.com`
}

/**
 * Generates a unique test name
 */
export function generateTestName(prefix: string = "Test User"): string {
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix} ${random}`
}
