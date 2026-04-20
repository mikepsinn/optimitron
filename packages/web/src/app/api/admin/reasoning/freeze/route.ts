import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  armId: z.string(),
  frozen: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ ok: false, error: "not-authorized" }, { status: 403 });
  }
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.reasoningVariantArm.update({
    where: { id: body.data.armId },
    data: { frozen: body.data.frozen },
  });
  return NextResponse.json({ ok: true });
}
