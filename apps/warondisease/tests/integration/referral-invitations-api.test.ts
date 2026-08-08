import { describe, expect, it, beforeEach, vi } from "vitest"
import { getPrismaClient, cleanDatabase } from "../utils/db-test-utils"

// Mock auth — the route handlers gate on requireAuth(). We don't test auth here,
// we test what the route does AFTER auth succeeds. Each test sets the current userId.
// vi.mock is hoisted above imports, so the route import below picks up the mock.
let currentUserId = ""
vi.mock("@/lib/auth-utils", () => ({
  requireAuth: vi.fn(async () => ({ userId: currentUserId, userEmail: `${currentUserId}@example.com` })),
}))

import { POST, GET, PATCH } from "@/app/api/referral-invitations/route"

const prisma = getPrismaClient()

async function createTestUser(id: string) {
  return prisma.user.create({
    data: {
      id,
      email: `${id}@example.com`,
      name: `User ${id}`,
      username: id.toLowerCase(),
      referralCode: `CODE_${id}`,
    },
  })
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/referral-invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/referral-invitations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest
}

describe("/api/referral-invitations", () => {
  beforeEach(async () => {
    await cleanDatabase()
    await createTestUser("USER1")
    currentUserId = "USER1"
  })

  describe("POST", () => {
    it("creates invitations for the authenticated user", async () => {
      const res = await POST(
        makePostRequest({
          invitations: [
            { recipientName: "Bob Smith", inviteeContact: "bob@example.com", contactMethod: "EMAIL" },
            { recipientName: "Alice Chen" },
          ],
        })
      )

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.created).toBe(2)

      const rows = await prisma.referralInvitation.findMany({
        where: { referrerUserId: "USER1" },
        orderBy: { recipientName: "asc" },
      })
      expect(rows).toHaveLength(2)
      expect(rows[0].recipientName).toBe("Alice Chen")
      expect(rows[0].inviteeContact).toBeNull()
      expect(rows[0].contactMethod).toBeNull()
      expect(rows[0].status).toBe("PENDING")
      expect(rows[1].recipientName).toBe("Bob Smith")
      expect(rows[1].inviteeContact).toBe("bob@example.com")
      expect(rows[1].contactMethod).toBe("EMAIL")
    })

    it("rejects empty invitations array", async () => {
      const res = await POST(makePostRequest({ invitations: [] }))
      expect(res.status).toBe(400)
    })

    it("rejects when no invitation has a name", async () => {
      const res = await POST(
        makePostRequest({
          invitations: [{ recipientName: "" }, { recipientName: "   " }],
        })
      )
      expect(res.status).toBe(400)
      const rows = await prisma.referralInvitation.findMany({ where: { referrerUserId: "USER1" } })
      expect(rows).toHaveLength(0)
    })

    it("rejects more than the max per-request limit", async () => {
      const invitations = Array.from({ length: 11 }, (_, i) => ({ recipientName: `Person ${i}` }))
      const res = await POST(makePostRequest({ invitations }))
      expect(res.status).toBe(400)
    })

    it("trims whitespace and caps long names", async () => {
      const longName = "X".repeat(200)
      const res = await POST(
        makePostRequest({
          invitations: [
            { recipientName: "  Bob  " },
            { recipientName: longName },
          ],
        })
      )
      expect(res.status).toBe(201)
      const rows = await prisma.referralInvitation.findMany({
        where: { referrerUserId: "USER1" },
        orderBy: { createdAt: "asc" },
      })
      expect(rows[0].recipientName).toBe("Bob")
      expect(rows[1].recipientName).toHaveLength(120) // MAX_NAME_LENGTH
    })

    it("silently ignores rows with no name but keeps valid ones", async () => {
      const res = await POST(
        makePostRequest({
          invitations: [
            { recipientName: "" },
            { recipientName: "Valid Person" },
            { recipientName: null },
          ],
        })
      )
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.created).toBe(1)
    })
  })

  describe("GET", () => {
    it("returns only the current user's invitations", async () => {
      await createTestUser("USER2")

      await prisma.referralInvitation.createMany({
        data: [
          { referrerUserId: "USER1", recipientName: "Mine A" },
          { referrerUserId: "USER1", recipientName: "Mine B" },
          { referrerUserId: "USER2", recipientName: "Not mine" },
        ],
      })

      currentUserId = "USER1"
      const res = await GET()
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.invitations).toHaveLength(2)
      const names = json.invitations.map((c: { recipientName: string }) => c.recipientName).sort()
      expect(names).toEqual(["Mine A", "Mine B"])
    })
  })

  describe("PATCH", () => {
    it("marks a invitation as VOTED and stamps votedAt", async () => {
      const created = await prisma.referralInvitation.create({
        data: { referrerUserId: "USER1", recipientName: "Bob" },
      })
      expect(created.votedAt).toBeNull()

      const res = await PATCH(makePatchRequest({ id: created.id, status: "VOTED" }))
      expect(res.status).toBe(200)

      const after = await prisma.referralInvitation.findUniqueOrThrow({ where: { id: created.id } })
      expect(after.status).toBe("VOTED")
      expect(after.votedAt).toBeInstanceOf(Date)
    })

    it("increments remindersSent and sets lastRemindedAt when marked REMINDED", async () => {
      const created = await prisma.referralInvitation.create({
        data: { referrerUserId: "USER1", recipientName: "Bob" },
      })

      const res = await PATCH(makePatchRequest({ id: created.id, status: "REMINDED" }))
      expect(res.status).toBe(200)

      const after = await prisma.referralInvitation.findUniqueOrThrow({ where: { id: created.id } })
      expect(after.status).toBe("REMINDED")
      expect(after.remindersSent).toBe(1)
      expect(after.lastRemindedAt).toBeInstanceOf(Date)
    })

    it("refuses to update another user's invitation", async () => {
      await createTestUser("USER2")
      const otherinvitation = await prisma.referralInvitation.create({
        data: { referrerUserId: "USER2", recipientName: "Bob" },
      })

      // Auth'd as USER1, try to update USER2's row.
      currentUserId = "USER1"
      const res = await PATCH(
        makePatchRequest({ id: otherinvitation.id, status: "VOTED" })
      )
      expect(res.status).toBe(404)

      const unchanged = await prisma.referralInvitation.findUniqueOrThrow({
        where: { id: otherinvitation.id },
      })
      expect(unchanged.status).toBe("PENDING")
    })

    it("rejects invalid status values", async () => {
      const created = await prisma.referralInvitation.create({
        data: { referrerUserId: "USER1", recipientName: "Bob" },
      })
      const res = await PATCH(makePatchRequest({ id: created.id, status: "NONSENSE" }))
      expect(res.status).toBe(400)
    })

    it("rejects missing id", async () => {
      const res = await PATCH(makePatchRequest({ status: "VOTED" }))
      expect(res.status).toBe(400)
    })
  })
})

