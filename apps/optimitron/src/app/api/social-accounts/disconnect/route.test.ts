import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  prisma: {
    account: {
      deleteMany: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    socialAccount: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}))

import { POST } from "./route"

describe("social account disconnect route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset()
    mocks.prisma.account.deleteMany.mockReset()
    mocks.prisma.activity.create.mockReset()
    mocks.prisma.socialAccount.deleteMany.mockReset()
  })

  it("disconnects an auth-only provider like Google", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" })
    mocks.prisma.account.deleteMany.mockResolvedValue({ count: 1 })
    mocks.prisma.activity.create.mockResolvedValue({})

    const response = await POST(
      new Request("http://localhost/api/social-accounts/disconnect", {
        method: "POST",
        body: JSON.stringify({ platform: "GOOGLE" }),
      }) as never,
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.socialAccount.deleteMany).not.toHaveBeenCalled()
    expect(mocks.prisma.account.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        provider: "google",
      },
    })
    expect(mocks.prisma.activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        metadata: JSON.stringify({ platform: "GOOGLE" }),
      }),
    })
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("disconnects a social platform and deletes both records", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" })
    mocks.prisma.socialAccount.deleteMany.mockResolvedValue({ count: 1 })
    mocks.prisma.account.deleteMany.mockResolvedValue({ count: 1 })
    mocks.prisma.activity.create.mockResolvedValue({})

    const response = await POST(
      new Request("http://localhost/api/social-accounts/disconnect", {
        method: "POST",
        body: JSON.stringify({ platform: "GITHUB" }),
      }) as never,
    )

    expect(response.status).toBe(200)
    expect(mocks.prisma.socialAccount.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        platform: "GITHUB",
      },
    })
    expect(mocks.prisma.account.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        provider: "github",
      },
    })
  })

  it("rejects unknown providers", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" })

    const response = await POST(
      new Request("http://localhost/api/social-accounts/disconnect", {
        method: "POST",
        body: JSON.stringify({ platform: "NOT_A_PROVIDER" }),
      }) as never,
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Invalid platform" })
  })
})
