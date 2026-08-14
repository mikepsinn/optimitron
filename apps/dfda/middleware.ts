import { createAuthMiddleware } from "@/lib/create-middleware"

export default createAuthMiddleware()

export const config = {
  // api/mcp and .well-known serve machine clients with Bearer tokens; keep
  // session middleware off their request path entirely.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/stripe|api/mcp|\\.well-known).*)",
  ],
}
