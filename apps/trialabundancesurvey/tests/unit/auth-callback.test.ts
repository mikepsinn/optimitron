import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import type { NextAuthOptions } from "next-auth"

let redirect: NonNullable<NonNullable<NextAuthOptions["callbacks"]>["redirect"]>

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
  vi.stubEnv("NEXTAUTH_SECRET", "local-auth-unit-test-secret-not-for-production")
  vi.stubEnv("NEXTAUTH_URL", "http://localhost:3001")
  const { authOptions } = await import("../../../../packages/site-kit/src/lib/auth")
  redirect = authOptions.callbacks!.redirect!
})

afterAll(() => vi.unstubAllEnvs())

describe("NextAuth callback URL round trip", () => {
  it.each([
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://trial-survey-branch-team.vercel.app",
    "https://trialabundancesurvey.org",
  ])("keeps the completion path after NextAuth resolves it on %s", async (baseUrl) => {
    const path = "/auth/complete-signup?callbackUrl=%2Fdashboard"
    const resolved = await redirect({ url: path, baseUrl })
    expect(resolved).toBe(`${baseUrl}${path}`)
    expect(await redirect({ url: resolved, baseUrl })).toBe(resolved)
  })

  it("does not treat an unrelated Vercel deployment as the same site", async () => {
    const baseUrl = "https://trial-survey-branch-team.vercel.app"
    expect(await redirect({ url: "https://unrelated.vercel.app/dashboard", baseUrl })).toBe(baseUrl)
  })
})
