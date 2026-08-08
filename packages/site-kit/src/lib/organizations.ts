
import { prisma } from "./prisma"
import { generateSlug, makeSlugUnique } from "./slug"
import { sendPartnerWelcomeEmail } from "./email"

/**
 * Search approved organizations by name
 */
export async function searchOrganizations(query: string) {
    if (!query || query.length < 2) return []

    const orgs = await prisma.organization.findMany({
        where: {
            name: {
                contains: query,
                mode: "insensitive",
            },
            status: "APPROVED",
        },
        select: {
            id: true,
            name: true,
            slug: true,
        },
        take: 10,
        orderBy: {
            name: "asc",
        },
    })

    return orgs
}

/**
 * Create a new partner organization
 */
export async function createOrganizationLogic(
    data: {
        name: string
        website?: string
        description?: string
    },
    user: { id: string; email: string }
) {
    if (!data.name) {
        throw new Error("Organization name is required")
    }

    // Generate slug
    let slug = generateSlug(data.name)

    // Ensure uniqueness
    const existingOrg = await prisma.organization.findUnique({ where: { slug } })
    if (existingOrg) {
        const allSlugs = await prisma.organization.findMany({
            where: { slug: { startsWith: slug } },
            select: { slug: true }
        })
        slug = makeSlugUnique(
            slug,
            allSlugs.map((o) => o.slug).filter((s): s is string => s !== null)
        )
    }

    // Create organization
    const organization = await prisma.organization.create({
        data: {
            name: data.name,
            type: "INSTITUTE",
            website: data.website || null,
            description: data.description || "Partner institute for the Global Clinical Trial Abundance Survey",
            contactEmail: user.email,
            slug,
            status: "APPROVED", // Auto-approved for authenticated users
            creatorId: user.id,
        },
    })

    // Send welcome email (non-blocking)
    sendPartnerWelcomeEmail({
        to: user.email,
        organizationName: data.name,
        slug: organization.slug!,
    }).catch((err) => {
        console.error("Failed to send partner welcome email", err)
    })

    return organization
}
