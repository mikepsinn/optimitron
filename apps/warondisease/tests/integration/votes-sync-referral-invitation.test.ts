import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanDatabase,
  getPrismaClient,
  ensureTreatyReferendum,
} from "../utils/db-test-utils"
import { ReferralInvitationStatus } from "@optimitron/db"

let currentUserId = ""
vi.mock("@/lib/auth-utils", () => ({
  requireAuth: vi.fn(async () => ({ userId: currentUserId, userEmail: `${currentUserId}@example.com` })),
}))

vi.mock("@/lib/email", () => ({
  sendReferralConfirmedEmail: vi.fn(async () => ({ success: false, error: "disabled in tests" })),
}))

import { POST } from "@/app/api/votes/sync/route"

const prisma = getPrismaClient()

async function createUser(id: string, email = `${id.toLowerCase()}@example.com`) {
  return prisma.user.create({
    data: {
      id,
      email,
      referralCode: `CODE_${id}`,
      emailVerified: new Date(),
    },
  })
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/votes/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", "user-agent": "vitest" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest
}

describe("/api/votes/sync referral invitations", () => {
  beforeEach(async () => {
    await cleanDatabase()
    await ensureTreatyReferendum()
  })

  it("attaches a verified vote to the invite token and marks the invitation converted", async () => {
    await createUser("REFERRER")
    await createUser("VOTER")
    currentUserId = "VOTER"

    const invitation = await prisma.referralInvitation.create({
      data: {
        referrerUserId: "REFERRER",
        recipientName: "Voter",
        recipientEmail: "voter@example.com",
        contactMethod: "EMAIL",
        inviteToken: "invite_token_123",
      },
    })

    const res = await POST(
      makeRequest({
        answer: "YES",
        referredBy: "referrer",
        inviteToken: "invite_token_123",
        timestamp: new Date().toISOString(),
      })
    )

    expect(res.status).toBe(200)

    const vote = await prisma.referendumVote.findFirstOrThrow({
      where: { userId: "VOTER", deletedAt: null },
    })
    expect(vote.referredByUserId).toBe("REFERRER")

    const after = await prisma.referralInvitation.findUniqueOrThrow({ where: { id: invitation.id } })
    expect(after.status).toBe(ReferralInvitationStatus.CONVERTED)
    expect(after.convertedVoteId).toBe(vote.id)
  })
})
