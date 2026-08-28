/**
 * Canonical redirect list — single source of truth.
 *
 * Consumed by:
 *   - next.config.js (serves the redirects)
 *   - scripts/check-redirect-conflicts.ts (verifies no page.tsx exists at source paths)
 *
 * Plain JS (not TS) so next.config.js can require() it without a build step.
 *
 * @type {Array<{
 *   source: string;
 *   destination: string;
 *   permanent: boolean;
 *   has?: Array<{ type: "host"; value: string }>;
 * }>}
 */
const REDIRECTS = [
  // Campaign domain consolidation: one public campaign site, paths preserved.
  { source: "/:path*", has: [{ type: "host", value: "1percenttreaty.org" }], destination: "https://warondisease.org/:path*", permanent: true },
  { source: "/:path*", has: [{ type: "host", value: "www.1percenttreaty.org" }], destination: "https://warondisease.org/:path*", permanent: true },
  { source: "/:path*", has: [{ type: "host", value: "trialabundancesurvey.org" }], destination: "https://warondisease.org/:path*", permanent: true },
  { source: "/:path*", has: [{ type: "host", value: "www.trialabundancesurvey.org" }], destination: "https://warondisease.org/:path*", permanent: true },
  { source: "/:path*", has: [{ type: "host", value: "acceleratedmedicine.org" }], destination: "https://warondisease.org/:path*", permanent: true },
  { source: "/:path*", has: [{ type: "host", value: "www.acceleratedmedicine.org" }], destination: "https://warondisease.org/:path*", permanent: true },

  // Optimized Governance — old top-level paths → new /agencies/* paths
  { source: "/wishocracy", destination: "/agencies/dcongress/wishocracy", permanent: true },
  { source: "/alignment", destination: "/agencies/dfec/alignment", permanent: true },
  { source: "/alignment/:id", destination: "/agencies/dfec/alignment/:id", permanent: true },
  { source: "/referendum", destination: "/agencies/dcongress/referendums", permanent: true },
  { source: "/referendum/:slug", destination: "/agencies/dcongress/referendums/:slug", permanent: true },
  // /money is now a standalone page — no redirect needed
  // /why folded into the treaty page — the WHEREAS clauses ARE the case.
  { source: "/why", destination: "/treaty", permanent: true },
  { source: "/budget", destination: "/agencies/domb", permanent: true },
  { source: "/budget/:slug", destination: "/agencies/domb/:slug", permanent: true },
  { source: "/policies", destination: "/agencies/dcbo", permanent: true },
  { source: "/policies/:slug", destination: "/agencies/dcbo/:slug", permanent: true },
  { source: "/transparency", destination: "/agencies/dgao", permanent: true },
  { source: "/discoveries", destination: "/agencies/dih/discoveries", permanent: true },
  // Deduplicated agency pages → canonical locations under dTreasury
  { source: "/agencies/dirs", destination: "/agencies/dtreasury/dirs", permanent: true },
  { source: "/agencies/dfed", destination: "/agencies/dtreasury/dfed", permanent: true },
  { source: "/agencies/dssa", destination: "/agencies/dtreasury/dssa", permanent: true },
  // Legacy aliases
  { source: "/federal-reserve", destination: "/agencies/dtreasury/dfed", permanent: true },
  { source: "/department-of-war", destination: "/agencies/ddod", permanent: true },
  { source: "/treasury", destination: "/agencies/dtreasury", permanent: true },
  { source: "/politicians", destination: "/governments/US/politicians", permanent: false },
  { source: "/politicians/:jurisdictionCode", destination: "/governments/:jurisdictionCode/politicians", permanent: false },

  // /people/manage was the staging name; canonical is /plaintiffs/manage.
  // Edge redirect (Next.js preserves query string automatically). Replaces
  // the page.tsx that called redirect() inside a Server Component —
  // Next.js was statically pre-rendering it and converting the server
  // redirect into a meta-refresh + client hop (200 OK), not a real 307.
  { source: "/people/manage", destination: "/plaintiffs/manage", permanent: true },
  // /about was a Server Component redirect — Next.js was statically pre-rendering it
  // and converting the server redirect into a meta-refresh + client hop (200 OK), not a real 307.
  { source: "/about", destination: "/eos", permanent: true },
  { source: "/campaign", destination: "/signatories", permanent: true },
  { source: "/coalition", destination: "/signatories", permanent: true },

  // /find-trials belongs to the dfda.earth site (see site.ts canonicalPrefixes
  // for the dfda site object). InterventionCard generates relative
  // /find-trials links via generatePatientTrialSearchPath; when rendered on
  // warondisease.org pages they land here. 301 to the canonical surface,
  // preserving any path tail + query string (Next preserves the query
  // automatically for redirect responses).
  { source: "/find-trials", has: [{ type: "host", value: "warondisease.org" }], destination: "https://dfda.earth/find-trials", permanent: true },
  { source: "/find-trials/:path*", has: [{ type: "host", value: "warondisease.org" }], destination: "https://dfda.earth/find-trials/:path*", permanent: true },

  // The Humanity v. Government case and Court of Humanity join surfaces
  // moved to the dedicated courtofhumanity.org app (apps/courtofhumanity),
  // so the court is not hosted by a party to the case. Same slugs on the
  // new domain, so external links survive with one hop. Next preserves the
  // query string (?ref=... referral codes) automatically.
  //
  // Temporary (307) rather than permanent (308) until courtofhumanity.org
  // resolves. A 308 is cached by browsers and CDNs, so shipping one ahead of
  // DNS would leave clients pinned to a dead host even after the domain goes
  // live. Switch these to permanent once the cutover is done.
  { source: "/court", destination: "https://courtofhumanity.org/court", permanent: false },
  { source: "/humanity-v-government", destination: "https://courtofhumanity.org/humanity-v-government", permanent: false },
  // Old share cards embed /humanity-v-government/opengraph-image; the new
  // app serves the same subpath.
  { source: "/humanity-v-government/:path*", destination: "https://courtofhumanity.org/humanity-v-government/:path*", permanent: false },
];

const EXTRA_REDIRECT_ONLY_ROUTE_SOURCES = [
  // Route handler whose only behavior is a site-aware redirect.
  "/impact",
];

const REDIRECT_ONLY_ROUTE_SOURCES = [
  ...REDIRECTS.filter((redirect) => !redirect.has).map((redirect) => redirect.source),
  ...EXTRA_REDIRECT_ONLY_ROUTE_SOURCES,
];

function redirectSourceToReviewPath(source) {
  if (!source.startsWith("/") || source.includes("*")) {
    return null;
  }
  return source.replace(/:([A-Za-z][A-Za-z0-9_]*)/g, "[$1]");
}

function normalizePathname(pathname) {
  const raw = String(pathname ?? "").trim();
  if (!raw) return "/";
  const withoutHash = raw.split("#", 1)[0] ?? raw;
  const withoutQuery = withoutHash.split("?", 1)[0] ?? withoutHash;
  const withSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sourceToMatcher(source) {
  if (!source.startsWith("/") || source.includes("*")) {
    return null;
  }
  const pattern = source
    .split("/")
    .filter(Boolean)
    .map((segment) => (segment.startsWith(":") ? "[^/]+" : escapeRegex(segment)))
    .join("/");
  return new RegExp(`^/${pattern}/?$`);
}

const REDIRECT_ONLY_REVIEW_PATHS = Array.from(
  new Set(REDIRECT_ONLY_ROUTE_SOURCES.map(redirectSourceToReviewPath).filter(Boolean)),
).sort();

const REDIRECT_ONLY_ROUTE_MATCHERS = REDIRECT_ONLY_ROUTE_SOURCES
  .map(sourceToMatcher)
  .filter(Boolean);

function getRedirectOnlyRoutePaths() {
  return REDIRECT_ONLY_REVIEW_PATHS;
}

function isRedirectOnlyRoutePath(pathname) {
  const normalized = normalizePathname(pathname);
  return REDIRECT_ONLY_ROUTE_MATCHERS.some((matcher) => matcher.test(normalized));
}

module.exports = {
  REDIRECTS,
  getRedirectOnlyRoutePaths,
  isRedirectOnlyRoutePath,
};
