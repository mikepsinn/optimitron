import { createCompleteSignupHandler } from "@/lib/auth-api-complete-signup"

const handlers = createCompleteSignupHandler({
  successMessage: "Signup completed successfully",
})

export const POST = handlers.POST
export const dynamic = "force-dynamic"
