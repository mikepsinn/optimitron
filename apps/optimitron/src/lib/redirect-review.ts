import redirectsModule from "./redirects.js";

interface RedirectReviewModule {
  getRedirectOnlyRoutePaths: () => string[];
  isRedirectOnlyRoutePath: (pathname: string) => boolean;
}

const redirectReview = redirectsModule as RedirectReviewModule;

export const REDIRECT_ONLY_ROUTE_PATHS =
  redirectReview.getRedirectOnlyRoutePaths();

export function isRedirectOnlyRoutePath(pathname: string) {
  return redirectReview.isRedirectOnlyRoutePath(pathname);
}

export function filterRedirectOnlyRoutes<T extends { path: string }>(
  routes: T[],
): T[] {
  return routes.filter((route) => !isRedirectOnlyRoutePath(route.path));
}
