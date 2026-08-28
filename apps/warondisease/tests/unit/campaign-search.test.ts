import fs from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  organizationFindMany: vi.fn(),
  userFindMany: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findMany: mocks.organizationFindMany },
    user: { findMany: mocks.userFindMany },
  },
}))

import {
  CAMPAIGN_PAGE_HREFS,
  searchCampaign,
} from "../../app/search/campaign-search.server"

beforeEach(() => {
  mocks.organizationFindMany.mockReset().mockResolvedValue([])
  mocks.userFindMany.mockReset().mockResolvedValue([])
})

describe("searchCampaign", () => {
  it("does not query the database for a one-character query", async () => {
    // `contains` on a single character scans both tables and returns noise, so
    // the guard is there to stop the query, not just to filter the results.
    const results = await searchCampaign("a")

    expect(results.totalResults).toBe(0)
    expect(mocks.userFindMany).not.toHaveBeenCalled()
    expect(mocks.organizationFindMany).not.toHaveBeenCalled()
  })

  it("only looks up people who are public and not soft-deleted", async () => {
    await searchCampaign("nadia")

    const where = mocks.userFindMany.mock.calls[0][0].where
    expect(where.deletedAt).toBeNull()
    expect(where.person.isPublic).toBe(true)
    expect(where.person.deletedAt).toBeNull()
  })

  it("only looks up approved, public, undeleted organizations", async () => {
    await searchCampaign("clinic")

    const where = mocks.organizationFindMany.mock.calls[0][0].where
    expect(where.status).toBe("APPROVED")
    expect(where.visibility).toBe("PUBLIC")
    expect(where.deletedAt).toBeNull()
  })

  it("matches a page on its keywords, not just its title", async () => {
    // /poster is titled "Hang Up Flyers"; "flyer" is the word a visitor types.
    const results = await searchCampaign("flyer")

    expect(results.pages.map((page) => page.href)).toContain("/poster")
  })

  it("ranks a person above nothing and keeps the profile href", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        city: "Nairobi",
        countryCode: "KE",
        person: {
          bio: "Signed early.",
          countryCode: "KE",
          displayName: "Nadia Okonkwo",
          handle: "nadia",
        },
      },
    ])

    const results = await searchCampaign("nadia")

    expect(results.people).toHaveLength(1)
    expect(results.people[0].href).toBe("/u/nadia")
    expect(results.people[0].meta).toBe("Nairobi, KE")
  })

  it("drops a person row whose person record has no handle", async () => {
    // The href is built from the handle, so a null one would produce /u/null.
    mocks.userFindMany.mockResolvedValue([
      {
        city: null,
        countryCode: null,
        person: {
          bio: null,
          countryCode: null,
          displayName: "Nadia Okonkwo",
          handle: null,
        },
      },
    ])

    const results = await searchCampaign("nadia")

    expect(results.people).toEqual([])
  })
})

describe("campaign page index", () => {
  // Routes that exist but are deliberately absent from search: an authenticated
  // surface, and the search page itself.
  const EXCLUDED = new Set(["/dashboard", "/search"])

  it("indexes every public page in the app", () => {
    const appDir = path.resolve(__dirname, "../../app")
    const routes = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          fs.existsSync(path.join(appDir, entry.name, "page.tsx")),
      )
      .map((entry) => `/${entry.name}`)
      .filter((route) => !EXCLUDED.has(route))

    const missing = routes.filter(
      (route) => !CAMPAIGN_PAGE_HREFS.includes(route),
    )

    expect(missing).toEqual([])
  })
})
