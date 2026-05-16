import {
  getRouteReviewSpecs,
  ROUTES,
} from "@/lib/routes";
import {
  filterRedirectOnlyRoutes,
  isRedirectOnlyRoutePath,
} from "@/lib/redirect-review";
import { ALL_PAGE_PATHS, PUBLIC_PAGE_PATHS } from "./static-pages";

export type VisualRoute = {
  authenticated?: boolean;
  expectSettings?: boolean;
  name: string;
  openMenu?: boolean;
  path: string;
  required: boolean;
  requiredSelector?: string;
  requiredText?: RegExp;
};

const PRESIDENT_TASK_LIST_SELECTOR =
  '[data-visual-section="president-task-list"]';

const REQUIRED_SELECTOR_BY_PATH = new Map<string, string>([
  [ROUTES.employees, PRESIDENT_TASK_LIST_SELECTOR],
]);

const REQUIRED_TEXT_BY_PATH = new Map<string, RegExp>([
  [ROUTES.court, /IN WITNESS WHEREOF/],
]);

const SPECIAL_STATE_ROUTES: VisualRoute[] = [
  {
    name: "side-menu",
    path: ROUTES.home,
    required: true,
    openMenu: true,
  },
  {
    name: "side-menu-auth",
    path: ROUTES.home,
    required: true,
    authenticated: true,
    openMenu: true,
    expectSettings: true,
  },
];

const SEEDED_DYNAMIC_ROUTES: VisualRoute[] = [
  {
    name: "organization-iam-public",
    path: "/organizations/institute-for-accelerated-medicine",
    required: false,
  },
  { name: "people-mike", path: "/people/mike", required: false },
  { name: "task-optimize-earth", path: "/tasks/optimize-earth", required: false },
  { name: "task-one-percent-treaty", path: "/tasks/1-pct-treaty", required: false },
  { name: "task-signer-canada", path: "/tasks/1-pct-treaty-signer-ca", required: false },
];

const PUBLIC_SCREENSHOT_ROUTES: VisualRoute[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("screenshot"),
)
  .filter(({ path }) => PUBLIC_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    name,
    path,
    required: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
  }));

const AUTHENTICATED_SCREENSHOT_ROUTES: VisualRoute[] = filterRedirectOnlyRoutes(
  getRouteReviewSpecs("authenticatedScreenshot"),
)
  .filter(({ path }) => ALL_PAGE_PATHS.includes(path))
  .map(({ name, path }) => ({
    name: publicRouteHasScreenshot(path) ? `${name}-auth` : name,
    path,
    required: true,
    authenticated: true,
    requiredSelector: REQUIRED_SELECTOR_BY_PATH.get(path),
    requiredText: REQUIRED_TEXT_BY_PATH.get(path),
  }));

export const VISUAL_ROUTES: VisualRoute[] = dedupeRoutes([
  ...PUBLIC_SCREENSHOT_ROUTES,
  ...AUTHENTICATED_SCREENSHOT_ROUTES,
  ...SPECIAL_STATE_ROUTES,
  ...SEEDED_DYNAMIC_ROUTES,
]);

function publicRouteHasScreenshot(path: string): boolean {
  return (
    !isRedirectOnlyRoutePath(path) &&
    getRouteReviewSpecs("screenshot").some((spec) => spec.path === path)
  );
}

function dedupeRoutes(routes: VisualRoute[]): VisualRoute[] {
  const seen = new Set<string>();
  const deduped: VisualRoute[] = [];
  for (const route of routes) {
    if (seen.has(route.name)) {
      throw new Error(`Duplicate visual route name: ${route.name}`);
    }
    seen.add(route.name);
    deduped.push(route);
  }
  return deduped;
}
