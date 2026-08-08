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
        name: "Integration Test User",
        username: `inttest${Date.now()}`,
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
        type: "INSTITUTE",
      },
    })

    expect(org.id).toBeDefined()

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        organization: {
          connect: { id: org.id },
        },
      },
      include: {
        organization: true,
      },
    })

    expect(updatedUser.organizationId).toBe(org.id)
    expect(updatedUser.organization?.name).toBe(org.name)

    const fetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: true,
      },
    })

    expect(fetchedUser).toBeDefined()
    expect(fetchedUser?.organizationId).toBe(org.id)
  })
})
