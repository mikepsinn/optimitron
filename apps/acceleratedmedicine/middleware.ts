import { createLandingMiddleware } from "@/lib/create-middleware"

export default createLandingMiddleware()

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe).*)"],
}
