import { createPasswordSignupHandler } from "@/lib/auth-api-signup"

export const POST = createPasswordSignupHandler({
  welcomeTitle: "Welcome to Wishocracy!",
  welcomeMessage:
    "Your account has been created. Start allocating budget — the catalog is the product.",
})
