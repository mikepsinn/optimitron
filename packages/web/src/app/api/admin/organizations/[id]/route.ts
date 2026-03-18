import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { ActivityType, OrgStatus } from "@optimitron/db";

async function requireAdmin() {
  const { userId, userEmail } = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  return { id: userId, email: userEmail };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (
      body.status &&
      Object.values(OrgStatus).includes(body.status as OrgStatus)
    ) {
      updateData.status = body.status;
    }
    if (body.name) updateData.name = body.name;
    if (body.slug) updateData.slug = body.slug;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.contactEmail) updateData.contactEmail = body.contactEmail;
    if (body.website) updateData.website = body.website;
    if (body.description) updateData.description = body.description;

    const updated = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    // Log admin action
    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: ActivityType.JOINED_ORGANIZATION,
        description: `Admin ${body.status === OrgStatus.APPROVED ? "approved" : body.status === OrgStatus.REJECTED ? "rejected" : "updated"} organization: ${organization.name}`,
        metadata: JSON.stringify({
          organizationId: id,
          action: body.status || "update",
          adminId: admin.id,
        }),
      },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    await prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: ActivityType.JOINED_ORGANIZATION,
        description: `Admin deleted organization: ${organization.name}`,
        metadata: JSON.stringify({
          organizationId: id,
          action: "delete",
          adminId: admin.id,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 },
    );
  }
}
