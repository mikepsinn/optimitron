import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ReferralInvitationsCard } from "../../../../packages/site-kit/src/components/dashboard/ReferralInvitationsCard"
import type { DashboardReferralInvitation } from "../../../../packages/site-kit/src/types/dashboard"

const boundary = vi.hoisted(() => ({ saved: {} as Record<string, unknown> }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => {} }) }))
vi.mock("@/lib/auth-utils", () => ({ requireAuth: async () => ({ userId: "sender" }) }))
vi.mock("@/lib/email", () => ({ sendReferralInviteEmail: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  referralInvitation: {
    findUnique: async () => ({ id: "invite", referrerUserId: "sender", status: "PENDING", convertedAt: null }),
    update: async ({ data }: { data: Record<string, unknown> }) => { boundary.saved = data; return { id: "invite", ...data } },
  },
} }))

import { PATCH } from "../../app/api/referral-invitations/route"

const invitation: DashboardReferralInvitation = {
  id: "invite", recipientName: "Demo Friend", inviteeContact: null, contactMethod: "IN_PERSON", inviteToken: "token",
  referralUrl: "https://warondisease.org/vote/sender", messageText: null, status: "PENDING", votedAt: null,
  copiedAt: null, sentAt: null, remindersSent: 0, lastRemindedAt: null, confirmedAt: null, createdAt: new Date("2026-01-01"),
}

describe("dashboard invitation controls through the API", () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    boundary.saved = {}
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => PATCH(new Request(`https://warondisease.org${url}`, init) as never))
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } })
  })

  it("rejects a manual conversion so the later verified vote can still link the invitation", async () => {
    const response = await PATCH(new Request("https://warondisease.org/api/referral-invitations", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "invite", status: "CONVERTED" }),
    }) as never)
    expect(response.status).toBe(400)
    expect(boundary.saved).toEqual({})
  })

  it("records a copied reminder with its copy timestamp", async () => {
    render(<ReferralInvitationsCard invitations={[invitation]} referralLink={invitation.referralUrl} />)
    fireEvent.click(screen.getByRole("button", { name: "Copy reminder" }))
    await waitFor(() => expect(boundary.saved.status).toBe("COPIED"))
    expect(boundary.saved.copiedAt).toBeInstanceOf(Date)
  })

  it("shows rejected updates instead of silently treating them as saved", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 503 }))
    render(<ReferralInvitationsCard invitations={[invitation]} referralLink={invitation.referralUrl} />)
    fireEvent.click(screen.getByRole("button", { name: "Copy reminder" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not save that invitation update")
    expect(boundary.saved).toEqual({})
  })
})
