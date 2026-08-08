import { describe, expect, it, beforeEach } from "vitest"
import { getPrismaClient, cleanDatabase } from "../utils/db-test-utils"
import { getReferralTreeStats } from "@/lib/referral.server"
import type { VotePosition } from "@optimitron/db"

const prisma = getPrismaClient()

/**
 * Exercises the recursive CTE in getReferralTreeStats. The tree semantics
 * (direct vs. downstream, depth, public/private visibility) are the single
 * non-trivial piece of SQL in the codebase — worth a real-Postgres test.
 *
 * Tree shape used by most tests:
 *
 *       A          (root — the user we query for)
 *       |
 *       B  (depth 1, direct referral)
 *      / \
 *     C   D  (depth 2)
 *     |
 *     E      (depth 3)
 */
async function seedChain(opts: {
  ids: string[]
  publicFlags?: Record<string, boolean>
  // parent[i] = who referred user i. First user has no referrer.
  parents: (string | null)[]
}) {
  const { ids, parents, publicFlags = {} } = opts
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    await prisma.user.create({
      data: {
        id,
        email: `${id}@example.com`,
        name: `User ${id}`,
        username: id.toLowerCase(),
        referralCode: `CODE_${id}`,
        isPublic: publicFlags[id] ?? true,
      },
    })
    const parentId = parents[i]
    // A vote with referredByUserId = parent is what links the tree.
    await prisma.referendumVote.create({
      data: {
        answer: "YES" as VotePosition,
        userId: id,
        referredByUserId: parentId,
      },
    })
  }
}

describe("getReferralTreeStats", () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it("returns zeros for a user with no referrals", async () => {
    await seedChain({ ids: ["A"], parents: [null] })

    const stats = await getReferralTreeStats("A")

    expect(stats.directCount).toBe(0)
    expect(stats.totalDownstreamCount).toBe(0)
    expect(stats.maxDepth).toBe(0)
    expect(stats.publicRecruits).toEqual([])
  })

  it("counts direct referrals at depth 1", async () => {
    // A referred B and C; no deeper chain.
    await seedChain({
      ids: ["A", "B", "C"],
      parents: [null, "A", "A"],
    })

    const stats = await getReferralTreeStats("A")

    expect(stats.directCount).toBe(2)
    expect(stats.totalDownstreamCount).toBe(2)
    expect(stats.maxDepth).toBe(1)
    expect(stats.publicRecruits.map((r) => r.id).sort()).toEqual(["B", "C"])
    expect(stats.publicRecruits.every((r) => r.depth === 1)).toBe(true)
  })

  it("walks a 4-level chain and reports depth + downstream correctly", async () => {
    // Canonical tree from the header comment.
    await seedChain({
      ids: ["A", "B", "C", "D", "E"],
      parents: [null, "A", "B", "B", "C"],
    })

    const stats = await getReferralTreeStats("A")

    expect(stats.directCount).toBe(1) // just B
    expect(stats.totalDownstreamCount).toBe(4) // B, C, D, E
    expect(stats.maxDepth).toBe(3) // A → B → C → E
    // All four should appear in publicRecruits since publicFlags defaults to true.
    const ids = stats.publicRecruits.map((r) => r.id).sort()
    expect(ids).toEqual(["B", "C", "D", "E"])
    // Depth values must reflect distance from A, not absolute.
    const depthById = Object.fromEntries(
      stats.publicRecruits.map((r) => [r.id, r.depth])
    )
    expect(depthById).toEqual({ B: 1, C: 2, D: 2, E: 3 })
  })

  it("excludes private recruits from publicRecruits but counts them in totals", async () => {
    // B is private; C and D are public. A should see counts unchanged but
    // only C and D in the named list.
    await seedChain({
      ids: ["A", "B", "C", "D"],
      parents: [null, "A", "B", "B"],
      publicFlags: { A: true, B: false, C: true, D: true },
    })

    const stats = await getReferralTreeStats("A")

    // Counts include B even though it's private — privacy gates the name, not the number.
    expect(stats.directCount).toBe(1)
    expect(stats.totalDownstreamCount).toBe(3)
    expect(stats.maxDepth).toBe(2)

    const ids = stats.publicRecruits.map((r) => r.id).sort()
    expect(ids).toEqual(["C", "D"])
    expect(ids).not.toContain("B")
  })

  it("does not count votes from another user's subtree", async () => {
    // Two disjoint trees: A→B and X→Y→Z. Querying A must not see X/Y/Z.
    await seedChain({
      ids: ["A", "B", "X", "Y", "Z"],
      parents: [null, "A", null, "X", "Y"],
    })

    const aStats = await getReferralTreeStats("A")
    expect(aStats.directCount).toBe(1)
    expect(aStats.totalDownstreamCount).toBe(1)
    expect(aStats.maxDepth).toBe(1)
    expect(aStats.publicRecruits.map((r) => r.id)).toEqual(["B"])

    const xStats = await getReferralTreeStats("X")
    expect(xStats.directCount).toBe(1) // Y
    expect(xStats.totalDownstreamCount).toBe(2) // Y, Z
    expect(xStats.maxDepth).toBe(2)
  })

  it("respects publicRecruitsLimit", async () => {
    // A recruits 5 users directly. Limit=2 should return exactly 2 names but
    // not affect the counts.
    await seedChain({
      ids: ["A", "B", "C", "D", "E", "F"],
      parents: [null, "A", "A", "A", "A", "A"],
    })

    const stats = await getReferralTreeStats("A", { publicRecruitsLimit: 2 })

    expect(stats.directCount).toBe(5)
    expect(stats.totalDownstreamCount).toBe(5)
    expect(stats.publicRecruits).toHaveLength(2)
  })
})
