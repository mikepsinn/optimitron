import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { AuthenticationRequiredError } from "./auth-utils"

import {
  trialAbundanceResponseSchema,
  type TrialAbundanceResponseInput,
} from "./trial-abundance-response"

interface PostDependencies {
  submit?: (
    input: TrialAbundanceResponseInput,
  ) => Promise<Record<string, unknown>>
}

export function createPostHandler(dependencies: PostDependencies = {}) {
  return async function post(request: Request) {
    try {
      const input = trialAbundanceResponseSchema.parse(await request.json())
      const submit =
        dependencies.submit ??
        (await import("./trial-abundance-response-store"))
          .saveTrialAbundanceResponse
      const result = await submit(input)

      return NextResponse.json({ success: true, ...result })
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        return NextResponse.json(
          { success: false, error: "Please check the survey response." },
          { status: 400 },
        )
      }

      if (error instanceof AuthenticationRequiredError) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        )
      }

      console.error("Trial Abundance response sync failed", error)
      return NextResponse.json(
        {
          success: false,
          error: "We could not save this response. Please try again.",
        },
        { status: 503 },
      )
    }
  }
}
