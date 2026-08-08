import { describe, expect, it } from "vitest"
import { getPrismaClient } from "../utils/db-test-utils"

const prisma = getPrismaClient()

describe("Organization Persistence Flow", () => {
  const email = `test-integration-${Date.now()}@example.com`
  const orgSlug = `test-org-${Date.now()}`

  it("should create a user, an organization, link them, and verify persistence", async () => {
    const user = await prisma.user.create({
      data: {
        email,
        referralCode: `INTCODE${Date.now()}`,
      },
    })

    expect(user.id).toBeDefined()

    const org = await prisma.organization.create({
      data: {
        name: "Integration Logic Org",
        slug: orgSlug,
        contactEmail: email,
        creatorId: user.id,
        status: "APPROVED",
        description: "Test Description",
        type: "NONPROFIT",
      },
    })

    expect(org.id).toBeDefined()

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: "MEMBER",
      },
    })

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      include: {
        organization: true,
        user: true,
      },
    })

    expect(membership).toBeDefined()
    expect(membership?.organizationId).toBe(org.id)
    expect(membership?.userId).toBe(user.id)
    expect(membership?.organization.name).toBe(org.name)

    const fetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    })

    expect(fetchedUser).toBeDefined()
    expect(fetchedUser?.organizationMemberships).toHaveLength(1)
    expect(fetchedUser?.organizationMemberships[0]?.organizationId).toBe(org.id)
  })
})
