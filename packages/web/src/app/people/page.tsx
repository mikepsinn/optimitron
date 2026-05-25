import Link from "next/link";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { DatingRelationshipIntent } from "@optimitron/db/enums";
import { MissionDiscoverClient } from "@/components/missions/MissionClient";
import { MissionSafetyNotice } from "@/components/missions/MissionSafetyNotice";
import { Avatar } from "@/components/retroui/Avatar";
import { Input } from "@/components/retroui/Input";
import {
  defaultButtonClassName,
  primaryButtonClassName,
} from "@/components/ui/default-button";
import { authOptions } from "@/lib/auth";
import { getDatingDiscoverData } from "@/lib/dating.server";
import { getSiteMetadata } from "@/lib/metadata";
import {
  getPeopleDirectoryData,
  parsePeopleDirectoryRole,
  type PeopleDirectoryPerson,
  type PeopleDirectoryRole,
} from "@/lib/people-directory.server";
import { getSignInPath, peopleLink, plaintiffsLink, ROUTES } from "@/lib/routes";
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

const MISSION_INTENT_FILTERS: Array<{
  label: string;
  value: DatingRelationshipIntent | null;
}> = [
  { label: "All mission people", value: null },
  { label: "Mission friends", value: DatingRelationshipIntent.FRIENDS },
  { label: "Could be romantic", value: DatingRelationshipIntent.DATES },
  { label: "Long-term", value: DatingRelationshipIntent.LONG_TERM },
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

function buildMissionPeopleHref(intent: DatingRelationshipIntent | null) {
  const params = new URLSearchParams({ missions: "1" });
  if (intent) params.set("intent", intent);
  return `${ROUTES.people}?${params.toString()}`;
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

function parseMissionMode(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

function parseMissionIntent(
  value: string | string[] | undefined,
): DatingRelationshipIntent | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === DatingRelationshipIntent.FRIENDS ||
    raw === DatingRelationshipIntent.DATES ||
    raw === DatingRelationshipIntent.LONG_TERM ||
    raw === DatingRelationshipIntent.LIFE_PARTNER ||
    raw === DatingRelationshipIntent.CASUAL ||
    raw === DatingRelationshipIntent.NON_MONOGAMY ||
    raw === DatingRelationshipIntent.UNSURE
  ) {
    return raw;
  }
  return null;
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

function PersonDirectoryRow({ person }: { person: PeopleDirectoryPerson }) {
  const roleText = [
    person.isPublicFigure ? "Public official" : null,
    person.countryCode,
  ]
    .filter(Boolean)
    .join(" / ");
  const taskCount = `${person.publicTaskCount.toLocaleString()} task${
    person.publicTaskCount === 1 ? "" : "s"
  }`;
  const metadata = [roleText || "Person", taskCount];

  return (
    <Link
      aria-label={`Open ${person.displayName} profile`}
      className="group grid gap-4 border-b border-border bg-background px-4 py-4 text-foreground transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground lg:grid-cols-[minmax(240px,1.35fr)_minmax(140px,0.65fr)] lg:items-center"
      href={person.href}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0 border border-border bg-background">
          <Avatar.Image
            alt={person.displayName}
            src={person.image ?? undefined}
          />
          <Avatar.Fallback className="bg-background text-sm font-black">
            {getFallbackInitials(person.displayName)}
          </Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="break-words text-base font-black leading-6">
            <span className="underline-offset-4 group-hover:underline">
              {person.displayName}
            </span>
          </h2>
          {person.headline || person.affiliation ? (
            <p className="mt-1 break-words text-sm font-bold leading-6 text-muted-foreground">
              {person.headline ?? person.affiliation}
            </p>
          ) : null}
        </div>
      </div>

      <div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground lg:text-sm lg:font-bold lg:normal-case lg:tracking-normal">
        <p className="lg:hidden">{metadata.join(" / ")}</p>
        <div className="hidden lg:block">
          {metadata.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </Link>
  );
}

async function loadMissionDiscover(
  userId: string,
  relationshipIntent: DatingRelationshipIntent | null,
) {
  try {
    return {
      data: await getDatingDiscoverData(userId, { relationshipIntent }),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not load mission people.",
    };
  }
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
  const missionMode = parseMissionMode(params.missions);
  const missionIntent = parseMissionIntent(params.intent);

  if (missionMode) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const result = userId
      ? await loadMissionDiscover(userId, missionIntent)
      : null;
    const profile = result?.data?.profile ?? null;
    const candidates = result?.data?.candidates ?? [];
    const canBrowse =
      profile?.status === "ACTIVE" && profile.wantsCampaignDates === true;

    return (
      <main className="min-h-screen bg-background text-foreground [font-family:var(--v0-font-libre-baskerville)]">
        <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-14">
          <header className="space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Mission people
              </p>
              <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
                Find someone to optimize Earth with.
              </h1>
              <p className="max-w-3xl text-lg font-bold leading-8 text-muted-foreground">
                These humans turned on Earth Optimization Missions. Like,
                pass, or send one sentence. Mutual interest opens messages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {MISSION_INTENT_FILTERS.map((filter) => {
                const active = filter.value === missionIntent;
                return (
                  <Link
                    className={`inline-flex min-h-11 items-center justify-center border-2 border-foreground px-4 text-xs font-black uppercase ${
                      active
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-foreground hover:text-background"
                    }`}
                    href={buildMissionPeopleHref(filter.value)}
                    key={filter.label}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className={`${defaultButtonClassName} min-h-11 px-4 text-xs`}
                href={ROUTES.people}
              >
                All people
              </Link>
              <Link
                className={`${primaryButtonClassName} min-h-11 px-4 text-xs`}
                href={`${ROUTES.profile}#missions`}
              >
                Mission settings
              </Link>
              <Link
                className={`${defaultButtonClassName} min-h-11 px-4 text-xs`}
                href={ROUTES.messages}
              >
                Messages
              </Link>
            </div>
          </header>

          <MissionSafetyNotice compact />

          {!userId ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Sign in first</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Mission browsing is for signed-in humans who turned on missions.
              </p>
              <Link
                className={`${primaryButtonClassName} mt-4 min-h-11 px-4 text-xs`}
                href={getSignInPath(buildMissionPeopleHref(missionIntent))}
              >
                Sign in
              </Link>
            </div>
          ) : result?.error || !profile ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">
                Turn on missions
              </h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Use your profile to turn on missions before browsing other
                mission people.
              </p>
              <Link
                className={`${primaryButtonClassName} mt-4 min-h-11 px-4 text-xs`}
                href={`${ROUTES.profile}#missions`}
              >
                Mission settings
              </Link>
            </div>
          ) : !canBrowse ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">
                Missions are paused
              </h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Set your mission status to active when you want to be visible.
              </p>
              <Link
                className={`${primaryButtonClassName} mt-4 min-h-11 px-4 text-xs`}
                href={`${ROUTES.profile}#missions`}
              >
                Mission settings
              </Link>
            </div>
          ) : candidates.length ? (
            <MissionDiscoverClient candidates={candidates} />
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No people yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                The mission pool is empty. This happens before the party
                starts.
              </p>
            </div>
          )}
        </section>
      </main>
    );
  }

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
              Humans who can end war and disease
            </p>
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
              Find the human who should do something.
            </h1>
            <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground">
              Find officials, lawyers, clinical researchers, organizers,
              funders, and communicators who can help end war and disease.
              Open a profile, see the task, and remind the human.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={`${primaryButtonClassName} min-h-11 px-4 text-xs`}
              href={ROUTES.tasks}
            >
              See tasks
            </Link>
            <Link
              className={`${defaultButtonClassName} min-h-11 px-4 text-xs`}
              href={ROUTES.plaintiffs}
            >
              {plaintiffsLink.label}
            </Link>
            <Link
              className={`${defaultButtonClassName} min-h-11 px-4 text-xs`}
              href={buildMissionPeopleHref(null)}
            >
              Mission people
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
              className="min-h-12 border-foreground bg-background text-base font-bold text-foreground placeholder:text-muted-foreground"
              defaultValue={data.query}
              name="q"
              placeholder="Name, role, skill, organization, jurisdiction, or task"
              type="search"
            />
            <button
              className={`${defaultButtonClassName} text-xs`}
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
                {data.totalCount.toLocaleString()}{" "}
                {data.totalCount === 1 ? "person" : "people"} with tasks
              </h2>
            </div>
          </div>

          {data.people.length > 0 ? (
            <>
              <div className="overflow-hidden border border-border bg-background">
                <div className="hidden border-b border-border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground lg:grid lg:grid-cols-[minmax(240px,1.35fr)_minmax(140px,0.65fr)]">
                  <span>Person</span>
                  <span>Role</span>
                </div>
                {data.people.map((person) => (
                  <PersonDirectoryRow key={person.id} person={person} />
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
                        className={`${defaultButtonClassName} min-h-10 px-4 text-xs`}
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
            <article className="border border-border bg-background p-6 text-foreground">
              <p className="text-lg font-black uppercase">No people found.</p>
              <p className="mt-3 max-w-3xl font-bold leading-7 text-muted-foreground">
                Try a broader search, pick another role, or open the task list
                and find work that needs an assignee.
              </p>
              <Link
                className={`${primaryButtonClassName} mt-5 min-h-11 px-4 text-xs`}
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
