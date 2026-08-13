import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"
import { generateSlug, makeSlugUnique, sanitizeCustomSlug } from "@/lib/slug"
import { requireAuth } from "@/lib/auth-utils"
import { sendPartnerWelcomeEmail } from "@/lib/email"

const logger = createLogger("institutes-apply")

export async function POST(request: NextRequest) {
  try {
    // Require authentication - user must be logged in
    const { userId, userEmail } = await requireAuth()

    const body = await request.json()
    const { name, website, description, customSlug } = body

    // Validate required fields (simplified: only org name required, email comes from auth)
    if (!name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 })
    }

    // Validate website URL if provided
    if (website) {
      try {
        new URL(website)
      } catch {
        return NextResponse.json({ error: "Invalid website URL" }, { status: 400 })
      }
    }

    // Generate or validate slug
    let slug: string

    if (customSlug) {
      // User provided a custom slug
      const sanitized = sanitizeCustomSlug(customSlug)
      if (!sanitized) {
        return NextResponse.json(
          { error: "Invalid slug. Use only lowercase letters, numbers, and hyphens (3-60 characters)" },
          { status: 400 }
        )
      }
      slug = sanitized
    } else {
      // Auto-generate slug from organization name
      slug = generateSlug(name)
    }

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    })

    if (existingOrg) {
      if (customSlug) {
        // User provided slug is taken
        return NextResponse.json({ error: "This URL is already taken. Please choose another." }, { status: 409 })
      } else {
        // Auto-generated slug conflict - make it unique
        const allSlugs = await prisma.organization.findMany({
          where: {
            slug: {
              startsWith: slug,
            },
          },
          select: { slug: true },
        })
        slug = makeSlugUnique(
          slug,
          allSlugs.map((o: { slug: string | null }) => o.slug).filter((s: string | null): s is string => s !== null)
        )
      }
    }

    // Create organization - auto-approved since user is authenticated
    const organization = await prisma.organization.create({
      data: {
        name,
        type: "RESEARCH_CENTER",
        // category left null - can be set later by admin or user
        website: website || null,
        description: description || "Partner institute for the Global Clinical Trial Abundance Survey",
        contactEmail: userEmail ?? "",
        slug,
        status: "APPROVED", // Auto-approved for authenticated users
        creatorId: userId,
      },
    })

    logger.info("New partner institute created", {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })

    if (!userEmail) {
      return NextResponse.json(
        {
          success: true,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          },
        },
        { status: 201 },
      )
    }

    // Send welcome email with survey links (non-blocking)
    sendPartnerWelcomeEmail({
      to: userEmail,
      organizationName: name,
      slug: organization.slug!,
    }).catch((err) => {
      logger.error("Failed to send partner welcome email", { error: err, organizationId: organization.id })
    })

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Error processing institute application", { error })

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to process application. Please try again." }, { status: 500 })
  }
}
