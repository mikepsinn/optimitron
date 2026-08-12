import { describe, expect, it, beforeEach, vi } from "vitest"
import {
  getPrismaClient,
  cleanDatabase,
  ensureTreatyReferendum,
} from "../utils/db-test-utils"
import { ReferralInvitationStatus } from "@optimitron/db"

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
      email: `${id.toLowerCase()}@example.com`,
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
    await ensureTreatyReferendum()
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
      expect(rows[0].recipientEmail).toBeNull()
      expect(rows[0].contactMethod).toBeNull()
      expect(rows[0].status).toBe(ReferralInvitationStatus.PENDING)
      expect(rows[1].recipientName).toBe("Bob Smith")
      expect(rows[1].recipientEmail).toBe("bob@example.com")
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
      expect(rows[1].recipientName.length).toBeLessThanOrEqual(120)
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
          { referrerUserId: "USER1", recipientName: "Mine A", inviteToken: "tok_mine_a" },
          { referrerUserId: "USER1", recipientName: "Mine B", inviteToken: "tok_mine_b" },
          { referrerUserId: "USER2", recipientName: "Not mine", inviteToken: "tok_other" },
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
    it("marks an invitation as CONVERTED and stamps convertedAt", async () => {
      const created = await prisma.referralInvitation.create({
        data: {
          referrerUserId: "USER1",
          recipientName: "Bob",
          inviteToken: "tok_patch_converted",
        },
      })
      expect(created.convertedAt).toBeNull()

      const res = await PATCH(
        makePatchRequest({ id: created.id, status: ReferralInvitationStatus.CONVERTED })
      )
      expect(res.status).toBe(200)

      const after = await prisma.referralInvitation.findUniqueOrThrow({ where: { id: created.id } })
      expect(after.status).toBe(ReferralInvitationStatus.CONVERTED)
      expect(after.convertedAt).toBeInstanceOf(Date)
    })

    it("marks an invitation as COPIED via action", async () => {
      const created = await prisma.referralInvitation.create({
        data: {
          referrerUserId: "USER1",
          recipientName: "Bob",
          inviteToken: "tok_patch_copied",
        },
      })

      const res = await PATCH(makePatchRequest({ id: created.id, action: "copy" }))
      expect(res.status).toBe(200)

      const after = await prisma.referralInvitation.findUniqueOrThrow({ where: { id: created.id } })
      expect(after.status).toBe(ReferralInvitationStatus.COPIED)
      expect(after.copiedAt).toBeInstanceOf(Date)
    })

    it("refuses to update another user's invitation", async () => {
      await createTestUser("USER2")
      const otherInvitation = await prisma.referralInvitation.create({
        data: {
          referrerUserId: "USER2",
          recipientName: "Bob",
          inviteToken: "tok_other_user",
        },
      })

      currentUserId = "USER1"
      const res = await PATCH(
        makePatchRequest({ id: otherInvitation.id, status: ReferralInvitationStatus.CONVERTED })
      )
      expect(res.status).toBe(404)

      const unchanged = await prisma.referralInvitation.findUniqueOrThrow({
        where: { id: otherInvitation.id },
      })
      expect(unchanged.status).toBe(ReferralInvitationStatus.PENDING)
    })

    it("rejects invalid status values", async () => {
      const created = await prisma.referralInvitation.create({
        data: {
          referrerUserId: "USER1",
          recipientName: "Bob",
          inviteToken: "tok_invalid_status",
        },
      })
      const res = await PATCH(makePatchRequest({ id: created.id, status: "NONSENSE" }))
      expect(res.status).toBe(400)
    })

    it("rejects missing id", async () => {
      const res = await PATCH(makePatchRequest({ status: ReferralInvitationStatus.CONVERTED }))
      expect(res.status).toBe(400)
    })
  })
})
