import { createAuthMiddleware } from "@/lib/create-middleware"

export default createAuthMiddleware({ authPaths: ["/dashboard"] })

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/stripe).*)"],
}
