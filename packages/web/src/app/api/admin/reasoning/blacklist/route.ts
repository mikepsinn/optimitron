import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  scope: z
    .enum([
      "HANDOFF",
      "CHAIN_NODE",
      "OBJECTION_NODE",
      "INEVITABILITY",
      "REPLICATION_CTA",
      "DEEP_CHAIN_NODE",
    ])
    .optional(),
  patternKind: z.string(),
  pattern: z.string(),
  reason: z.string(),
});

export async function GET() {
  const rows = await prisma.reasoningBlacklistRule.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });
  const rule = await prisma.reasoningBlacklistRule.create({
    data: {
      scope: body.data.scope,
      patternKind: body.data.patternKind,
      pattern: body.data.pattern,
      reason: body.data.reason,
      createdByUserId: session.user.id,
      active: true,
    },
  });
  return NextResponse.json({ ok: true, ruleId: rule.id });
}
