import { createAuthMiddleware } from "@/lib/create-middleware"

export default createAuthMiddleware()

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe).*)"],
}
