/**
 * Next may preserve percent-encoding in catch-all route parameters. Task IDs
 * intentionally contain colons (for example immutable receipt task IDs), so
 * decode the dynamic segment exactly once before a database lookup. Malformed
 * input is left unchanged and follows the normal not-found/access-gate path.
 */
export function decodeTaskRouteId(routeId: string): string {
  try {
    return decodeURIComponent(routeId);
  } catch {
    return routeId;
  }
}
