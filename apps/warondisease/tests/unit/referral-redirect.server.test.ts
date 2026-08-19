import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findUserByHandleOrReferralCode: vi.fn(),
  referralClickCreate: vi.fn(),
  shareAttemptUpdateMany: vi.fn(),
}))

vi.mock("@/lib/referral.server", () => ({
  findUserByHandleOrReferralCode: mocks.findUserByHandleOrReferralCode,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referralClick: {
      create: mocks.referralClickCreate,
    },
    shareAttempt: {
      updateMany: mocks.shareAttemptUpdateMany,
    },
  },
}))

import {
  buildReferralRedirectUrl,
  logReferralRedirectClick,
} from "@/lib/referral-redirect.server"

describe("referral redirect helpers", () => {
  beforeEach(() => {
    mocks.findUserByHandleOrReferralCode.mockReset()
    mocks.referralClickCreate.mockReset()
    mocks.shareAttemptUpdateMany.mockReset()
    mocks.shareAttemptUpdateMany.mockResolvedValue({ count: 1 })
  })

  it("builds the vote-surface redirect for generic referral links", () => {
    expect(buildReferralRedirectUrl({ code: "jane" })).toBe("/vote?ref=jane")
  })

  it("preserves share-attempt and invite attribution params", () => {
    expect(
      buildReferralRedirectUrl({
        code: "REF123",
        flowVariant: "vote-first",
        inviteToken: "invite 1",
        shareAttemptId: "share_1",
        treatyFlow: "v1",
      }),
    ).toBe(
      "/vote?ref=REF123&sa=share_1&invite=invite+1&treatyFlow=v1&flowVariant=vote-first",
    )
  })

  it("passes remaining query params (utm_*) through unchanged", () => {
    expect(
      buildReferralRedirectUrl({
        code: "jane",
        shareAttemptId: "share_1",
        passthroughParams: new URLSearchParams(
          "sa=share_1&utm_source=twitter&utm_medium=social&source=dfda.earth",
        ),
      }),
    ).toBe(
      "/vote?ref=jane&sa=share_1&utm_source=twitter&utm_medium=social&source=dfda.earth",
    )
  })

  it("does not duplicate owned referral params from the passthrough set", () => {
    expect(
      buildReferralRedirectUrl({
        code: "jane",
        inviteToken: "tok",
        passthroughParams: new URLSearchParams("ref=jane&invite=tok"),
      }),
    ).toBe("/vote?ref=jane&invite=tok")
  })

  it("logs canonical /vote username clicks through the shared resolver", async () => {
    mocks.findUserByHandleOrReferralCode.mockResolvedValue({ id: "user_jane" })

    await logReferralRedirectClick({
      code: "jane",
      refererUrl: "https://example.com",
      shareAttemptId: null,
      userAgent: "vitest",
    })

    expect(mocks.findUserByHandleOrReferralCode).toHaveBeenCalledWith("jane")
    expect(mocks.referralClickCreate).toHaveBeenCalledWith({
      data: {
        code: "jane",
        referrerUserId: "user_jane",
        refererUrl: "https://example.com",
        shareAttemptId: null,
        userAgent: "vitest",
      },
    })
    expect(mocks.shareAttemptUpdateMany).not.toHaveBeenCalled()
  })

  it("logs referral-code clicks and share-attempt attribution", async () => {
    mocks.findUserByHandleOrReferralCode.mockResolvedValue({ id: "user_ref" })

    await logReferralRedirectClick({
      code: "REF123",
      refererUrl: null,
      shareAttemptId: "share_1",
      userAgent: null,
    })

    expect(mocks.findUserByHandleOrReferralCode).toHaveBeenCalledWith("REF123")
    expect(mocks.referralClickCreate).toHaveBeenCalledWith({
      data: {
        code: "REF123",
        referrerUserId: "user_ref",
        refererUrl: null,
        shareAttemptId: "share_1",
        userAgent: null,
      },
    })
    expect(mocks.shareAttemptUpdateMany).toHaveBeenCalledWith({
      where: { id: "share_1", firstReferralClickAt: null },
      data: { firstReferralClickAt: expect.any(Date) },
    })
  })

  it("never fails closed when click logging throws", async () => {
    mocks.findUserByHandleOrReferralCode.mockRejectedValue(
      new Error("db down"),
    )

    await expect(
      logReferralRedirectClick({
        code: "jane",
        refererUrl: null,
        shareAttemptId: null,
        userAgent: null,
      }),
    ).resolves.toBeUndefined()
  })
})
