// Paths that other sites own now. This domain served them while it was an
// Optimitron site variant, so old links still arrive here. `/:path*` keeps
// deep links such as /tasks/<id> and /people/<slug> working.

const OPTIMITRON_ORIGIN = "https://optimitron.com";
const COURT_OF_HUMANITY_ORIGIN = "https://courtofhumanity.org";

/** @type {{ source: string; destination: string; permanent: boolean }[]} */
export const LEGACY_EXTERNAL_REDIRECTS = [
  // The Earth Optimization Game pages.
  ...["/demo", "/video", "/game", "/prize"].map((source) => ({
    source,
    destination: `${OPTIMITRON_ORIGIN}${source}`,
    permanent: true,
  })),
  // Task and people directories.
  ...["/tasks", "/people"].flatMap((source) => [
    { source, destination: `${OPTIMITRON_ORIGIN}${source}`, permanent: true },
    {
      source: `${source}/:path*`,
      destination: `${OPTIMITRON_ORIGIN}${source}/:path*`,
      permanent: true,
    },
  ]),
  // The lawsuit.
  { source: "/plaintiffs", destination: `${COURT_OF_HUMANITY_ORIGIN}/plaintiffs`, permanent: true },
  {
    source: "/plaintiffs/:path*",
    destination: `${COURT_OF_HUMANITY_ORIGIN}/plaintiffs/:path*`,
    permanent: true,
  },
  { source: "/court", destination: `${COURT_OF_HUMANITY_ORIGIN}/court`, permanent: true },
  // courtofhumanity.org sends this path to its home page itself.
  { source: "/humanity-v-government", destination: `${COURT_OF_HUMANITY_ORIGIN}/`, permanent: true },
];
