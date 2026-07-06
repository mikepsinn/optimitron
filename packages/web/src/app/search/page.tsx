import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { Search } from "lucide-react";
import { Avatar } from "@/components/retroui/Avatar";
import { Input } from "@/components/retroui/Input";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { ROUTES, searchLink } from "@/lib/routes";
import { searchSiteContent } from "@/lib/site-search.server";
import { getConfiguredSiteOrigin, getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = getRouteMetadata(searchLink);

const SITE_ORIGIN = getConfiguredSiteOrigin({
  allowLocalFallback: process.env.NODE_ENV !== "production",
});
const SITE_BASE_ORIGIN = new URL(SITE_ORIGIN).origin;

const sampleQueries = [
  "treaty",
  "clinical trials",
  "leader reminders",
  "signatories",
  "government waste",
  "donation math",
];

type SearchScope = "all" | "manual" | "pages" | "tasks";

type SearchResultItem = {
  description: string;
  external: boolean;
  href: string;
  meta: string | null;
  scope: Exclude<SearchScope, "all">;
  score: number;
  source: string;
  title: string;
};

const SEARCH_SCOPE_PRIORITY: Record<SearchResultItem["scope"], number> = {
  pages: 3,
  manual: 2,
  tasks: 1,
};

function dedupeResultItems(items: SearchResultItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.scope}:${item.href.toLowerCase()}:${item.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getScopeCounts(
  results: Awaited<ReturnType<typeof searchSiteContent>>,
  pageSourceLabel: string,
) {
  const items = getResultItems(results, pageSourceLabel);

  return {
    all: items.length,
    manual: items.filter((item) => item.scope === "manual").length,
    pages: items.filter((item) => item.scope === "pages").length,
    tasks: items.filter((item) => item.scope === "tasks").length,
  } satisfies Record<SearchScope, number>;
}

function buildScopeHref(query: string, scope: SearchScope) {
  const searchParams = new URLSearchParams();
  if (query.trim()) {
    searchParams.set("q", query.trim());
  }
  if (scope !== "all") {
    searchParams.set("scope", scope);
  }

  const suffix = searchParams.toString();
  return suffix ? `${ROUTES.search}?${suffix}` : ROUTES.search;
}

function getResultItems(
  results: Awaited<ReturnType<typeof searchSiteContent>>,
  pageSourceLabel: string,
): SearchResultItem[] {
  const pageItems: SearchResultItem[] = results.pages
    .filter((page) => !page.external)
    .map((page) => ({
    description: page.description,
    external: false,
    href: page.href,
    meta: page.section,
    scope: "pages",
    score: page.score,
    source: pageSourceLabel,
    title: page.title,
  }));

  const taskItems: SearchResultItem[] = results.tasks.map((task) => ({
    description: task.snippet ?? "Task result",
    external: false,
    href: task.href,
    meta: [
      formatEnumLabel(task.status),
      formatEnumLabel(task.category),
      task.assigneeLabel ? `Assignee: ${task.assigneeLabel}` : null,
    ]
      .filter(Boolean)
      .join(" / "),
    scope: "tasks",
    score: task.score,
    source: "Task",
    title: task.title,
  }));

  const manualItems: SearchResultItem[] = results.manual.map((entry) => ({
    description: entry.description,
    external: true,
    href: entry.href,
    meta: entry.section ?? null,
    scope: "manual",
    score: entry.score,
    source: "Instruction Manual",
    title: entry.title,
  }));

  return dedupeResultItems([...pageItems, ...taskItems, ...manualItems]).sort((left, right) => {
    const priorityDelta =
      SEARCH_SCOPE_PRIORITY[right.scope] - SEARCH_SCOPE_PRIORITY[left.scope];

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.title.localeCompare(right.title);
  });
}

function SearchTab({
  count,
  href,
  isActive,
  label,
}: {
  count: number;
  href: string;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors ${
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span className="text-[11px]">{count.toLocaleString()}</span>
    </Link>
  );
}

function formatDisplayUrl(href: string, external: boolean) {
  const absoluteUrl = new URL(href, SITE_ORIGIN);

  if (!external && absoluteUrl.origin === SITE_BASE_ORIGIN) {
    return absoluteUrl.pathname || "/";
  }

  const normalizedPath = absoluteUrl.pathname
    .replace(/\/$/, "")
    .replace(/\.html$/i, "");

  return normalizedPath && normalizedPath !== "/"
    ? `${absoluteUrl.hostname}${normalizedPath}`
    : absoluteUrl.hostname;
}

function SearchResultRow({
  description,
  external,
  href,
  meta,
  source,
  title,
}: Omit<SearchResultItem, "scope" | "score">) {
  const absoluteUrl = new URL(href, SITE_ORIGIN);
  const displayUrl = formatDisplayUrl(href, external);
  const faviconUrl = external
    ? `${absoluteUrl.origin}/favicon.ico`
    : "/favicon.ico";
  const row = (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Avatar className="h-5 w-5 border border-primary/25 bg-background">
          <Avatar.Image src={faviconUrl} alt="" className="h-full w-full object-cover" />
          <Avatar.Fallback className="bg-background text-[9px] font-black text-foreground">
            {source.charAt(0)}
          </Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-foreground">{source}</div>
          <div className="truncate text-xs text-muted-foreground">
            {displayUrl}
            {meta ? <span>{` / ${meta}`}</span> : null}
          </div>
        </div>
      </div>
      <h2 className="text-xl font-bold text-foreground transition-colors hover:text-primary">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div className="border-b border-primary/20 pb-6">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {row}
        </a>
      ) : (
        <Link href={href} className="block">
          {row}
        </Link>
      )}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const params = await searchParams;
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const query = typeof params.q === "string" ? params.q : "";
  const scope: SearchScope =
    params.scope === "pages" ||
    params.scope === "tasks" ||
    params.scope === "manual"
      ? params.scope
      : "all";
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const results = await searchSiteContent(query, {
    pageLimit: 24,
    site,
    taskLimit: 24,
    userId,
  });
  const allResults = getResultItems(results, site.shortName);
  const visibleResults =
    scope === "all" ? allResults : allResults.filter((result) => result.scope === scope);
  const counts = getScopeCounts(results, site.shortName);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4 border-b border-primary/30 pb-4">
          <form action={ROUTES.search} className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search the site"
                autoFocus
                className="h-14 rounded-none border-2 border-foreground bg-background pl-12 text-base font-bold md:max-w-3xl"
                defaultValue={query}
                name="q"
                placeholder="Search pages, tasks, treaty docs, policy analysis..."
                type="search"
              />
            </div>
            {scope !== "all" ? <input type="hidden" name="scope" value={scope} /> : null}
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center border-2 border-foreground bg-foreground px-6 text-sm font-black uppercase tracking-[0.14em] text-background transition-colors hover:bg-background hover:text-foreground"
            >
              Search
            </button>
          </form>

          {query ? (
            <div className="flex flex-wrap items-center gap-5 overflow-x-auto">
              <SearchTab
                count={counts.all}
                href={buildScopeHref(query, "all")}
                isActive={scope === "all"}
                label="All"
              />
              <SearchTab
                count={counts.pages}
                href={buildScopeHref(query, "pages")}
                isActive={scope === "pages"}
                label="Pages"
              />
              <SearchTab
                count={counts.tasks}
                href={buildScopeHref(query, "tasks")}
                isActive={scope === "tasks"}
                label="Tasks"
              />
              <SearchTab
                count={counts.manual}
                href={buildScopeHref(query, "manual")}
                isActive={scope === "manual"}
                label="Instruction Manual"
              />
            </div>
          ) : null}
        </section>

        {query ? (
          <>
            <section className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground">
                {visibleResults.length.toLocaleString()} result{visibleResults.length === 1 ? "" : "s"} for{" "}
                <span className="text-foreground">&quot;{results.query}&quot;</span>
                {scope !== "all" ? (
                  <span>{` in ${scope}`}</span>
                ) : null}
              </p>
              {results.manualError ? (
                <div className="max-w-3xl border-2 border-primary bg-background px-4 py-3 text-sm font-bold text-foreground">
                  {results.manualError}
                </div>
              ) : null}
            </section>

            {visibleResults.length === 0 ? (
              <section className="max-w-3xl border-2 border-foreground bg-background p-6">
                <h2 className="text-2xl font-black uppercase text-foreground">No Matches</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
                  Try a broader term, a person name, a system name, or a concrete phrase like
                  &quot;clinical trials&quot; or &quot;fund optimization&quot;.
                </p>
              </section>
            ) : null}

            {visibleResults.length > 0 ? (
              <section className="max-w-4xl space-y-6">
                {visibleResults.map((result) => (
                  <SearchResultRow
                    key={`${result.scope}:${result.href}:${result.title}`}
                    description={result.description}
                    external={result.external}
                    href={result.href}
                    meta={result.meta}
                    source={result.source}
                    title={result.title}
                  />
                ))}
              </section>
            ) : null}
          </>
        ) : (
          <section className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
              Search {site.shortName}
            </h1>
            <p className="text-base font-bold leading-7 text-muted-foreground">
              Find pages, tasks, and manual entries.
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sampleQuery) => (
                <Link
                  key={sampleQuery}
                  href={`${ROUTES.search}?q=${encodeURIComponent(sampleQuery)}`}
                  className="border border-foreground px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  {sampleQuery}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
