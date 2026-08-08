import { createCompleteSignupHandler } from "@/lib/auth-api-complete-signup"

const handlers = createCompleteSignupHandler({
  successMessage: "Signup completed",
})

export const POST = handlers.POST
export const dynamic = handlers.dynamic
