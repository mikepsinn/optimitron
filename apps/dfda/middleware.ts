import {
  createAuthMiddleware,
  authMiddlewareMatcher,
} from "@/lib/create-middleware"

export default createAuthMiddleware()

export const config = {
  matcher: authMiddlewareMatcher,
}
