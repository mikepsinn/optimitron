import { NextRequest, NextResponse } from "next/server";
import { OrganizationReferendumPositionStatus } from "@optimitron/db";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set<OrganizationReferendumPositionStatus>([
  OrganizationReferendumPositionStatus.PENDING,
  OrganizationReferendumPositionStatus.APPROVED,
  OrganizationReferendumPositionStatus.REJECTED,
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: OrganizationReferendumPositionStatus;
    };

    if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "status must be PENDING, APPROVED, or REJECTED" },
        { status: 400 },
      );
    }

    const updated = await prisma.organizationReferendumPosition.update({
      where: { id },
      data: {
        status: body.status,
        approvedByUserId:
          body.status === OrganizationReferendumPositionStatus.PENDING
            ? null
            : userId,
      },
    });

    return NextResponse.json({ success: true, position: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin referendum-position PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 },
      );
    }
    const { id } = await params;
    await prisma.organizationReferendumPosition.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin referendum-position DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 },
    );
  }
}
