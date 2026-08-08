import {
  createLandingMiddleware,
  landingMiddlewareMatcher,
} from "@/lib/create-middleware"

export default createLandingMiddleware()

export const config = {
  matcher: landingMiddlewareMatcher,
}
