import { createCompleteSignupHandler } from "@/lib/auth-api-complete-signup"
import { sendVoteConfirmedImpactEmail } from "@/lib/email"

const handlers = createCompleteSignupHandler({
  sendVoteConfirmedEmail: sendVoteConfirmedImpactEmail,
  successMessage: "Vote verification completed successfully",
})

export const POST = handlers.POST
export const dynamic = "force-dynamic"
