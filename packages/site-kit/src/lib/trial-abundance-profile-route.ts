import { NextResponse } from "next/server"
import { AuthenticationRequiredError, requireAuth } from "./auth-utils"
import { prisma } from "./prisma"
import { TRIAL_ABUNDANCE_FORM_KEY } from "./trial-abundance-submission.server"

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const [user, role] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { countryCode: true, regionCode: true } }),
      prisma.formResponse.findFirst({
        where: {
          deletedAt: null, field: { key: "role" },
          submission: { respondentUserId: userId, deletedAt: null, status: "SUBMITTED",
            formRevision: { form: { sourceKey: TRIAL_ABUNDANCE_FORM_KEY } } },
        },
        orderBy: { createdAt: "desc" }, select: { valueJson: true },
      }),
    ])
    return NextResponse.json({ ...user, role: typeof role?.valueJson === "string" ? role.valueJson : "" },
      { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("Survey profile load failed", error)
    return NextResponse.json({ error: "Profile unavailable" }, { status: 503 })
  }
}
