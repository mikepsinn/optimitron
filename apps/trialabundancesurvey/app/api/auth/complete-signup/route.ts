import { createCompleteSignupHandler } from "@/lib/auth-api-complete-signup"

const handlers = createCompleteSignupHandler({
  successMessage: "Vote verification completed successfully",
})

export const POST = handlers.POST
export const dynamic = handlers.dynamic
