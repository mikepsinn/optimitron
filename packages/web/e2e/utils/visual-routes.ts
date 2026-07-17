import { getRouteReviewSpecs, ROUTES } from "@/lib/routes";
import {
  MANAGED_DEMO_COLLECTION_ID,
  MANAGED_DEMO_DOCUMENT_ID,
} from "@optimitron/db/constants";
import type { SiteKey } from "@/lib/site";
import {
  filterRedirectOnlyRoutes,
  isRedirectOnlyRoutePath,
} from "@/lib/redirect-review";
import { ALL_PAGE_PATHS, PUBLIC_PAGE_PATHS } from "./static-pages";

export type VisualRoute = {
  authenticated?: boolean;
  createTaskMode?: "person";
  expectSettings?: boolean;
  name: string;
  openCreateTask?: boolean;
  openContentShare?: boolean;
  openMenu?: boolean;
  path: string;
  required: boolean;
  requiredSelector?: string;
  requiredText?: RegExp;
  /** Capture under a non-default site variant (x-optimitron-site-key). */
  siteVariant?: SiteKey;
  waitForImages?: boolean;
};

const PRESIDENT_TASK_LIST_SELECTOR =
  '[data-visual-section="president-task-list"]';

const REQUIRED_SELECTOR_BY_PATH = new Map<string, string>([
  [ROUTES.employees, PRESIDENT_TASK_LIST_SELECTOR],
]);

const IMAGE_STABLE_ROUTE_PATHS = new Set<string>([ROUTES.employees]);

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
  {
    name: "create-task-dialog-person",
    path: ROUTES.home,
    required: true,
    authenticated: true,
    openCreateTask: true,
    createTaskMode: "person",
    requiredText: /New person/,
  },
];

const SEEDED_DYNAMIC_ROUTES: VisualRoute[] = [
  {
    name: "document-detail",
    path: `/documents/${MANAGED_DEMO_DOCUMENT_ID}`,
    required: true,
    authenticated: true,
    requiredText: /^Current decision$/,
  },
  {
    name: "collection-detail",
    path: `/collections/${MANAGED_DEMO_COLLECTION_ID}`,
    required: true,
    authenticated: true,
    requiredText: /^Finish the Vaultanium Systems proposal$/,
  },
  {
    name: "collection-share",
    path: `/collections/${MANAGED_DEMO_COLLECTION_ID}`,
    required: true,
    authenticated: true,
    openContentShare: true,
    requiredText: /^Only you can access this item\.$/,
  },
  {
    name: "content-search",
    path: "/search?q=Vaultanium",
    required: true,
    authenticated: true,
    requiredText: /^Finish the Vaultanium Systems proposal$/,
  },
  {
    name: "referendum-one-percent-treaty",
    path: "/agencies/dcongress/referendums/one-percent-treaty",
    required: false,
  },
  {
    name: "organization-iam-public",
    path: "/organizations/institute-for-accelerated-medicine",
    required: false,
  },
  {
    name: "organization-iam-survey",
    path: "/survey/institute-for-accelerated-medicine",
    required: false,
  },
  { name: "people-mike", path: "/people/mike", required: false },
  {
    name: "people-demo-owner",
    path: "/people/demo",
    required: false,
    authenticated: true,
    requiredText: /work to end war and disease/i,
  },
  {
    name: "people-demo-assign-dialog",
    path: "/people/demo?assignTask=1",
    required: false,
    authenticated: true,
    requiredText: /Who should do it\?/,
  },
  {
    name: "people-missions",
    path: "/people?missions=1",
    required: false,
    authenticated: true,
    requiredText: /Mission people/,
  },
  {
    name: "people-missions-romantic",
    path: "/people?missions=1&intent=DATES",
    required: false,
    authenticated: true,
    requiredText: /Could be romantic/,
  },
  {
    name: "task-optimize-earth",
    path: "/tasks/optimize-earth",
    required: false,
  },
  {
    name: "task-one-percent-treaty",
    path: "/tasks/1-pct-treaty",
    required: false,
  },
  {
    name: "task-signer-canada",
    path: "/tasks/1-pct-treaty-signer-ca",
    required: false,
  },
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
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
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
    waitForImages: IMAGE_STABLE_ROUTE_PATHS.has(path),
  }));

/**
 * Variant-delta coverage: the non-default site variants share almost all
 * route code with the default warOnDisease surface, so the review captures
 * only what actually differs per variant — the homepage component, the
 * chrome (nav/footer/branding) on one representative shared route, and for
 * the allowlisted microsites one on-list route. Full-matrix capture would
 * multiply review load for near-identical images; see AGENTS.md
 * ("keep secondary variant screenshots/links available for regression
 * checks ... so PR review load stays low").
 *
 * Deliberately NO disallowed-route probe: middleware redirects
 * canonically-owned paths to the owning production domain, which would make
 * the capture depend on an external site.
 */
const VARIANT_DELTA_ROUTES: VisualRoute[] = [
  {
    name: "variant-optimitron-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "optimitron",
  },
  {
    name: "variant-optimitron-tasks",
    path: ROUTES.tasks,
    required: true,
    siteVariant: "optimitron",
  },
  {
    name: "variant-dfda-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dfda",
  },
  {
    name: "variant-dfda-conditions",
    path: "/conditions",
    required: false,
    siteVariant: "dfda",
  },
  {
    name: "variant-dih-home",
    path: ROUTES.home,
    required: true,
    siteVariant: "dih",
  },
  {
    name: "variant-dih-institutes",
    path: "/institutes",
    required: false,
    siteVariant: "dih",
  },
];

export const VISUAL_ROUTES: VisualRoute[] = dedupeRoutes([
  ...PUBLIC_SCREENSHOT_ROUTES,
  ...AUTHENTICATED_SCREENSHOT_ROUTES,
  ...SPECIAL_STATE_ROUTES,
  ...SEEDED_DYNAMIC_ROUTES,
  ...VARIANT_DELTA_ROUTES,
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
