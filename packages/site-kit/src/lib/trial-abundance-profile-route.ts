import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { AuthenticationRequiredError, requireAuth } from "./auth-utils"
import { surveyProfileSchema } from "./survey-participant"
import { getSurveyProfile, saveSurveyProfile } from "./trial-abundance-profile.server"

export async function GET() {
  try {
    const { userId } = await requireAuth()
    return NextResponse.json(await getSurveyProfile(userId), { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    return profileError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await requireAuth()
    const profile = surveyProfileSchema.parse(await request.json())
    await saveSurveyProfile(userId, profile)
    return NextResponse.json({ ...profile, hasProfile: true }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    return profileError(error)
  }
}

function profileError(error: unknown) {
  if (error instanceof AuthenticationRequiredError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (error instanceof ZodError || error instanceof SyntaxError) return NextResponse.json({ error: "Please check your details." }, { status: 400 })
  console.error("Survey profile request failed", error)
  return NextResponse.json({ error: "We could not load or save your details. Please try again." }, { status: 503 })
}
