import { createPasswordSignupHandler } from "@/lib/auth-api-signup"

export const POST = createPasswordSignupHandler({
  welcomeTitle: "Welcome to the War on Disease!",
  welcomeMessage:
    "Your account has been created. Share your referral link to start saving lives.",
})
