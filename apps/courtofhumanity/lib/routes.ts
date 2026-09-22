export * from "@optimitron/site-kit/lib/routes";
import { ROUTES as sharedRoutes } from "@optimitron/site-kit/lib/routes";

/** Court owns its case homepage without changing other apps' case routes. */
export const ROUTES = { ...sharedRoutes, humanityVGovernment: "/" } as const;
