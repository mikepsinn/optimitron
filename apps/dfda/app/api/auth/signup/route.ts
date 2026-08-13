import { createPasswordSignupHandler } from "@/lib/auth-api-signup"

export const POST = createPasswordSignupHandler({
  welcomeTitle: "Welcome!",
  welcomeMessage: "Your account has been created.",
  welcomeLink: "/",
})
