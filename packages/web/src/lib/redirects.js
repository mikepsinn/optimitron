/**
 * Canonical redirect list — single source of truth.
 *
 * Consumed by:
 *   - next.config.js (serves the redirects)
 *   - scripts/check-redirect-conflicts.ts (verifies no page.tsx exists at source paths)
 *
 * Plain JS (not TS) so next.config.js can require() it without a build step.
 *
 * @type {Array<{ source: string; destination: string; permanent: boolean }>}
 */
const REDIRECTS = [
  // Optimized Governance — old top-level paths → new /agencies/* paths
  { source: "/wishocracy", destination: "/agencies/dcongress/wishocracy", permanent: true },
  { source: "/alignment", destination: "/agencies/dfec/alignment", permanent: true },
  { source: "/alignment/:id", destination: "/agencies/dfec/alignment/:id", permanent: true },
  { source: "/referendum", destination: "/agencies/dcongress/referendums", permanent: true },
  { source: "/referendum/:slug", destination: "/agencies/dcongress/referendums/:slug", permanent: true },
  // /money is now a standalone page — no redirect needed
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
  { source: "/contribute", destination: "/prize", permanent: true },
  { source: "/politicians", destination: "/politicians/US", permanent: false },
];

module.exports = { REDIRECTS };
