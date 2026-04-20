import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  variantSetId: z.string(),
  hostKey: z.string().optional(),
  organizationId: z.string().optional(),
  relationshipBucket: z.string().optional(),
  localeKey: z.string().optional(),
  surface: z.string().optional(),
  priority: z.number().int().default(0),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });

  const rule = await prisma.reasoningAssignmentRule.create({
    data: {
      variantSetId: body.data.variantSetId,
      hostKey: body.data.hostKey,
      organizationId: body.data.organizationId,
      relationshipBucket: body.data.relationshipBucket,
      localeKey: body.data.localeKey,
      surface: body.data.surface,
      priority: body.data.priority,
      isPin: true,
      active: true,
      createdByUserId: session.user.id,
    },
  });
  return NextResponse.json({ ok: true, ruleId: rule.id });
}
