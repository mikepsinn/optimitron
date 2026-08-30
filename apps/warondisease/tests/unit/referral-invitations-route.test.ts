import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  emailLogCreate: vi.fn(),
  invitationCount: vi.fn(),
  invitationCreate: vi.fn(),
  invitationFindUnique: vi.fn(),
  invitationUpdate: vi.fn(),
  referendumFindUnique: vi.fn(),
  sendReferralInviteEmail: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: vi.fn(async () => ({ userId: "USER1" })),
}))
vi.mock("@/lib/email", () => ({
  sendReferralInviteEmail: mocks.sendReferralInviteEmail,
}))
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailLog: { create: mocks.emailLogCreate },
    referendum: { findUnique: mocks.referendumFindUnique },
    referralInvitation: {
      count: mocks.invitationCount,
      create: mocks.invitationCreate,
      findUnique: mocks.invitationFindUnique,
      update: mocks.invitationUpdate,
    },
    user: { findUnique: mocks.userFindUnique },
  },
}))

import { PATCH, POST } from "@/app/api/referral-invitations/route"

function request(method: "PATCH" | "POST", body: unknown) {
  return new Request("http://localhost/api/referral-invitations", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  }) as unknown as import("next/server").NextRequest
}

describe("the shared referral invitation contract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.invitationCount.mockResolvedValue(0)
    mocks.referendumFindUnique.mockResolvedValue({ id: "REFERENDUM1" })
    mocks.userFindUnique.mockResolvedValue({
      id: "USER1",
      email: "sender@example.com",
      person: { displayName: "Sender", handle: "sender" },
      referralCode: "REFERRAL1",
    })
  })

  it("accepts one recipientEmail invitation and returns it singularly", async () => {
    mocks.invitationCreate.mockImplementation(async ({ data }) => ({
      ...data,
      id: "INVITATION1",
    }))

    const response = await POST(
      request("POST", {
        contactMethod: "EMAIL",
        messageFormat: "FRIEND",
        originUrl: "https://warondisease.org/employees?utm_source=test",
        recipientEmail: "bob@example.com",
        recipientName: "Bob",
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.invitation).toMatchObject({
      id: "INVITATION1",
      originUrl: "https://warondisease.org/employees?utm_source=test",
      recipientEmail: "bob@example.com",
      recipientName: "Bob",
    })
  })

  it("accepts markCopied and persists the rendered message", async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: "INVITATION1",
      referrerUserId: "USER1",
    })
    mocks.invitationUpdate.mockImplementation(async ({ data }) => ({
      ...data,
      id: "INVITATION1",
    }))

    const response = await PATCH(
      request("PATCH", {
        action: "markCopied",
        id: "INVITATION1",
        messageText: "Bob, vote on the 1% Treaty.",
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.invitation).toMatchObject({
      messageText: "Bob, vote on the 1% Treaty.",
      status: "COPIED",
    })
  })

  it("sends email for the shared sendMessage action", async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: "INVITATION1",
      inviteToken: "invite-token",
      messageText: null,
      recipientEmail: "bob@example.com",
      recipientName: "Bob",
      referrerUserId: "USER1",
    })
    mocks.sendReferralInviteEmail.mockResolvedValue({
      data: { id: "EMAIL1" },
      success: true,
    })
    mocks.invitationUpdate.mockResolvedValue({
      id: "INVITATION1",
      recipientEmail: "bob@example.com",
      status: "SENT",
    })
    mocks.emailLogCreate.mockResolvedValue({ id: "LOG1" })

    const response = await PATCH(
      request("PATCH", {
        action: "sendMessage",
        id: "INVITATION1",
        messageText: "Bob, vote on the 1% Treaty.",
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({ dispatched: true, status: "sent" })
    expect(mocks.sendReferralInviteEmail).toHaveBeenCalledOnce()
  })

  it("does not send an invitation that was already sent", async () => {
    mocks.invitationFindUnique.mockResolvedValue({
      id: "INVITATION1",
      inviteToken: "invite-token",
      messageText: "Bob, vote on the 1% Treaty.",
      recipientEmail: "bob@example.com",
      recipientName: "Bob",
      referrerUserId: "USER1",
      sentAt: new Date("2026-08-29T12:00:00Z"),
    })

    const response = await PATCH(
      request("PATCH", {
        action: "sendMessage",
        id: "INVITATION1",
        messageText: "Bob, vote on the 1% Treaty.",
      }),
    )
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload).toEqual({ error: "This invitation was already sent." })
    expect(mocks.invitationCount).not.toHaveBeenCalled()
    expect(mocks.sendReferralInviteEmail).not.toHaveBeenCalled()
  })
})
