import Link from "next/link";
import { headers } from "next/headers";
import { Avatar } from "@/components/retroui/Avatar";
import { Input } from "@/components/retroui/Input";
import { getSiteMetadata } from "@/lib/metadata";
import {
  getPeopleDirectoryData,
  parsePeopleDirectoryRole,
  type PeopleDirectoryPerson,
  type PeopleDirectoryRole,
} from "@/lib/people-directory.server";
import { peopleLink, plaintiffsLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export const dynamic = "force-dynamic";

const ROLE_FILTERS: Array<{ label: string; value: PeopleDirectoryRole }> = [
  { label: "All", value: "all" },
  { label: "Officials", value: "officials" },
  { label: "Researchers", value: "research" },
  { label: "Lawyers", value: "legal" },
  { label: "Organizers", value: "organizing" },
  { label: "Communicators", value: "communications" },
  { label: "Governance", value: "governance" },
];

function getFallbackInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDirectoryHref({
  page,
  query,
  role,
}: {
  page?: number;
  query: string;
  role: PeopleDirectoryRole;
}) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (role !== "all") params.set("role", role);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${ROUTES.people}?${qs}` : ROUTES.people;
}

function parsePage(value: string | string[] | undefined) {
  const raw = Number.parseInt(
    Array.isArray(value) ? (value[0] ?? "1") : (value ?? "1"),
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  return getSiteMetadata(
    site,
    {
      title: `${peopleLink.label} | ${site.name}`,
      description: peopleLink.description,
    },
    ROUTES.people,
    { robots: { index: true, follow: true } },
  );
}

function PersonDirectoryCard({ person }: { person: PeopleDirectoryPerson }) {
  const topTask = person.openTaskPreview[0] ?? null;
  const verifiedTask = person.verifiedTaskPreview[0] ?? null;
  const tags: string[] = [];
  if (person.isPublicFigure) tags.push("Public official");
  if (person.countryCode) tags.push(person.countryCode);
  tags.push(
    `${person.publicTaskCount} task${person.publicTaskCount === 1 ? "" : "s"}`,
  );

  return (
    <article className="border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 shrink-0 border border-border bg-background">
          <Avatar.Image
            alt={person.displayName}
            src={person.image ?? undefined}
          />
          <Avatar.Fallback className="bg-background text-lg font-black">
            {getFallbackInitials(person.displayName)}
          </Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h2 className="break-words text-xl font-black leading-tight">
              <Link
                className="underline-offset-4 hover:underline"
                href={person.href}
              >
                {person.displayName}
              </Link>
            </h2>
            {person.headline || person.affiliation ? (
              <p className="mt-1 break-words text-sm font-bold leading-6 text-muted-foreground">
                {person.headline ?? person.affiliation}
              </p>
            ) : null}
          </div>
          {tags.length > 0 ? (
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              {tags.join(" / ")}
            </p>
          ) : null}
        </div>
      </div>

      {topTask ? (
        <section className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Next task
          </p>
          <Link
            className="mt-2 block font-black leading-6 underline-offset-4 hover:underline"
            href={`${ROUTES.tasks}/${topTask.id}`}
          >
            {topTask.title}
          </Link>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            {formatCategory(topTask.category)}
          </p>
        </section>
      ) : verifiedTask ? (
        <section className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Verified work
          </p>
          <Link
            className="mt-2 block font-black leading-6 underline-offset-4 hover:underline"
            href={`${ROUTES.tasks}/${verifiedTask.id}`}
          >
            {verifiedTask.title}
          </Link>
        </section>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 text-xs font-black uppercase tracking-[0.14em] text-background"
          href={person.href}
        >
          Open profile
        </Link>
        {topTask ? (
          <Link
            className="inline-flex min-h-11 items-center border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground"
            href={`${ROUTES.tasks}/${topTask.id}`}
          >
            Open task
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const query = Array.isArray(params.q)
    ? (params.q[0] ?? "")
    : (params.q ?? "");
  const role = parsePeopleDirectoryRole(params.role);
  const page = parsePage(params.page);
  const data = await getPeopleDirectoryData({ page, query, role });
  const firstResult =
    data.totalCount > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const lastResult = Math.min(data.page * data.pageSize, data.totalCount);

  return (
    <main className="min-h-screen bg-background text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:py-14">
        <header className="space-y-5">
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Decentralized to-do list for humanity
            </p>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
              Find people who can move work forward.
            </h1>
            <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground">
              Search for officials, lawyers, clinical researchers, organizers,
              funders, and other humans with tasks. Open a profile, see the work
              assigned to them, and remind the right person to do the right
              thing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 text-xs font-black uppercase tracking-[0.14em] text-background"
              href={ROUTES.tasks}
            >
              See tasks
            </Link>
            <Link
              className="inline-flex min-h-11 items-center border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground"
              href={ROUTES.plaintiffs}
            >
              {plaintiffsLink.label}
            </Link>
          </div>
        </header>

        <section className="space-y-4 border border-foreground bg-background p-4 sm:p-5">
          <form
            action={ROUTES.people}
            className="grid gap-3 md:grid-cols-[1fr_auto]"
          >
            {role !== "all" ? (
              <input name="role" type="hidden" value={role} />
            ) : null}
            <Input
              className="min-h-12 border-border bg-background text-base font-bold"
              defaultValue={data.query}
              name="q"
              placeholder="Name, role, skill, organization, jurisdiction, or task"
              type="search"
            />
            <button
              className="min-h-12 border border-foreground bg-foreground px-5 text-xs font-black uppercase tracking-[0.14em] text-background"
              type="submit"
            >
              Search
            </button>
          </form>

          <nav aria-label="People filters" className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map((filter) => (
              <Link
                className={`inline-flex min-h-9 items-center border px-3 text-xs font-black uppercase tracking-[0.12em] ${
                  role === filter.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground"
                }`}
                href={buildDirectoryHref({
                  query: data.query,
                  role: filter.value,
                })}
                key={filter.value}
              >
                {filter.label}
              </Link>
            ))}
          </nav>
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Directory
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase">
                {data.totalCount.toLocaleString()} useful human
                {data.totalCount === 1 ? "" : "s"}
              </h2>
            </div>
          </div>

          {data.people.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.people.map((person) => (
                  <PersonDirectoryCard key={person.id} person={person} />
                ))}
              </div>
              {data.totalPages > 1 ? (
                <nav
                  aria-label="People directory pages"
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-foreground"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                    {firstResult}-{lastResult} of {data.totalCount}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {data.page > 1 ? (
                      <Link
                        className="inline-flex min-h-10 items-center border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground"
                        href={buildDirectoryHref({
                          page: data.page - 1,
                          query: data.query,
                          role: data.role,
                        })}
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-10 items-center border border-border bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground opacity-50">
                        Previous
                      </span>
                    )}
                    <span className="px-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                      Page {data.page} of {data.totalPages}
                    </span>
                    {data.page < data.totalPages ? (
                      <Link
                        className="inline-flex min-h-10 items-center border border-foreground bg-foreground px-4 text-xs font-black uppercase tracking-[0.14em] text-background"
                        href={buildDirectoryHref({
                          page: data.page + 1,
                          query: data.query,
                          role: data.role,
                        })}
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-10 items-center border border-border bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground opacity-50">
                        Next
                      </span>
                    )}
                  </div>
                </nav>
              ) : null}
            </>
          ) : (
            <article className="border border-border bg-card p-6 text-card-foreground">
              <p className="text-lg font-black uppercase">
                No useful humans found.
              </p>
              <p className="mt-3 max-w-3xl font-bold leading-7 text-muted-foreground">
                Try a broader search, pick another role, or open the task list
                and find work that needs an assignee.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center border border-foreground bg-foreground px-4 text-xs font-black uppercase tracking-[0.14em] text-background"
                href={ROUTES.tasks}
              >
                See tasks
              </Link>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
