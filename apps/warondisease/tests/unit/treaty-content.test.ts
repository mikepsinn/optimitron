import { beforeEach, describe, expect, it, vi } from "vitest"
import { shareableSnippets } from "@optimitron/data/parameters"

const mocks = vi.hoisted(() => ({
  referendumFindUnique: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: { referendum: { findUnique: mocks.referendumFindUnique } },
}))

import { getTreatyPageContent } from "@/lib/treaty-content.server"

// /treaty shipped without its treaty body twice, when a preview database held
// the treaty referendum with an empty body. The page must fall back to the
// bundled treaty text instead of rendering an empty document.
describe("getTreatyPageContent", () => {
  beforeEach(() => {
    mocks.referendumFindUnique.mockReset()
  })

  it("falls back to the bundled treaty text when the seeded body is empty", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      question: "Should your government sign the 1% Treaty?",
      bodyMarkdown: null,
    })

    await expect(getTreatyPageContent()).resolves.toEqual({
      question: "Should your government sign the 1% Treaty?",
      bodyMarkdown: shareableSnippets.onePercentTreatyText.markdown,
    })
  })

  it("keeps the seeded body when the row has one", async () => {
    mocks.referendumFindUnique.mockResolvedValue({
      question: "Sign?",
      bodyMarkdown: "Seeded treaty body",
    })

    await expect(getTreatyPageContent()).resolves.toEqual({
      question: "Sign?",
      bodyMarkdown: "Seeded treaty body",
    })
  })

  it("fails loudly when the treaty referendum is not seeded", async () => {
    mocks.referendumFindUnique.mockResolvedValue(null)

    await expect(getTreatyPageContent()).rejects.toThrow("is not seeded")
  })
})
