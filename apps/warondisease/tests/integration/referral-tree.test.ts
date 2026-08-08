import { describe, expect, it, beforeEach } from "vitest"
import {
  getPrismaClient,
  cleanDatabase,
  ensureTreatyReferendum,
} from "../utils/db-test-utils"
import { getReferralTreeStats } from "@/lib/referral.server"
import {
  VotePosition,
  PersonLifeStatus,
} from "@optimitron/db"

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
  const referendum = await ensureTreatyReferendum()

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const email = `${id.toLowerCase()}@example.com`
    const isPublic = publicFlags[id] ?? true

    const user = await prisma.user.create({
      data: {
        id,
        email,
        referralCode: `CODE_${id}`,
      },
    })

    const person = await prisma.person.create({
      data: {
        displayName: `User ${id}`,
        email,
        // Only public people get handles — private recruits must lack handle
        // so getReferralTreeStats privacy filter (isPublic OR handle) excludes them.
        handle: isPublic ? id.toLowerCase() : null,
        createdByUserId: user.id,
        sourceRef: `test:user:${user.id}`,
        lifeStatus: PersonLifeStatus.LIVING,
        isPublic,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { personId: person.id },
    })

    const parentId = parents[i]
    await prisma.referendumVote.create({
      data: {
        answer: VotePosition.YES,
        userId: id,
        personId: person.id,
        referendumId: referendum.id,
        referredByUserId: parentId,
        isPublic: true,
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
    await seedChain({
      ids: ["A", "B", "C", "D", "E"],
      parents: [null, "A", "B", "B", "C"],
    })

    const stats = await getReferralTreeStats("A")

    expect(stats.directCount).toBe(1) // just B
    expect(stats.totalDownstreamCount).toBe(4) // B, C, D, E
    expect(stats.maxDepth).toBe(3) // A → B → C → E
    // publicRecruits lists direct referrals only (depth 1)
    expect(stats.publicRecruits.map((r) => r.id)).toEqual(["B"])
    expect(stats.publicRecruits[0]?.depth).toBe(1)
  })

  it("excludes private recruits from publicRecruits but counts them in totals", async () => {
    // B is private (no handle); C is also a direct public recruit of A.
    await seedChain({
      ids: ["A", "B", "C"],
      parents: [null, "A", "A"],
      publicFlags: { A: true, B: false, C: true },
    })

    const stats = await getReferralTreeStats("A")

    expect(stats.directCount).toBe(2)
    expect(stats.totalDownstreamCount).toBe(2)
    expect(stats.maxDepth).toBe(1)

    const ids = stats.publicRecruits.map((r) => r.id)
    expect(ids).toEqual(["C"])
    expect(ids).not.toContain("B")
  })

  it("does not count votes from another user's subtree", async () => {
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
