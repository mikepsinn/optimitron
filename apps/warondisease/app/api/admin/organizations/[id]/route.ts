import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { OrgStatus } from "@optimitron/db"
import { createLogger } from "@/lib/logger"
import { sendPartnerWelcomeEmail, sendPartnerRejectionEmail } from "@/lib/email"

const log = createLogger("api:admin:organizations")

// PATCH /api/admin/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin()

    const { id } = params
    const body = await request.json()

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { id },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Allow updating status
    if (body.status && Object.values(OrgStatus).includes(body.status)) {
      updateData.status = body.status
    }

    // Allow updating basic fields
    if (body.name) updateData.name = body.name
    if (body.slug) updateData.slug = body.slug
    if (body.logo !== undefined) updateData.squareLogoUrl = body.logo
    if (body.contactEmail) updateData.contactEmail = body.contactEmail
    if (body.website) updateData.website = body.website
    if (body.description) updateData.description = body.description

    // Update organization
    const updated = await prisma.organization.update({
      where: { id },
      data: updateData,
    })

    // Send notification emails for status changes
    if (body.status === OrgStatus.APPROVED && organization.status !== OrgStatus.APPROVED) {
      // Only send approval email if status changed to approved
      if (updated.slug && updated.contactEmail) {
        await sendPartnerWelcomeEmail({
          to: updated.contactEmail,
          organizationName: updated.name,
          slug: updated.slug,
        })
        log.info(`Sent approval email to ${updated.contactEmail}`)
      } else {
        log.warn(`Cannot send approval email - organization ${id} has no slug or contactEmail`)
      }
    } else if (body.status === OrgStatus.REJECTED && organization.status !== OrgStatus.REJECTED) {
      if (updated.contactEmail) {
        await sendPartnerRejectionEmail({
          to: updated.contactEmail,
          organizationName: updated.name,
          reason: body.rejectionReason,
        })
        log.info(`Sent rejection email to ${updated.contactEmail}`)
      }
    }

    // Log admin action
    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "JOINED_ORG", // Reusing existing activity type
        description: `Admin ${body.status === OrgStatus.APPROVED ? "approved" : body.status === OrgStatus.REJECTED ? "rejected" : "updated"} organization: ${organization.name}`,
        metadata: JSON.stringify({
          organizationId: id,
          action: body.status || "update",
          adminId: admin.id,
        }),
      },
    })

    log.info(`Admin ${admin.email} updated organization ${id}:`, body.status || "update")

    return NextResponse.json({
      success: true,
      organization: updated,
    })
  } catch (error: any) {
    log.error("Error updating organization:", error)

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Organization with this slug already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/organizations/[id] - Soft delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin()

    const { id } = params

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { id },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Log admin action
    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "JOINED_ORG", // Reusing existing activity type
        description: `Admin deleted organization: ${organization.name}`,
        metadata: JSON.stringify({
          organizationId: id,
          action: "delete",
          adminId: admin.id,
        }),
      },
    })

    log.info(`Admin ${admin.email} deleted organization ${id}`)

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    })
  } catch (error: any) {
    log.error("Error deleting organization:", error)

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - admin access required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    )
  }
}
