import { getServerSession } from "next-auth";
import {
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  fmtParam,
  fmtParamValueOnly,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { PersonDeathCauseCategory } from "@optimitron/db/enums";
import { headers } from "next/headers";
import Link from "next/link";
import { PeopleFilterBar } from "@/components/people/PeopleFilterBar";
import { PersonFaceTile } from "@/components/people/PersonFaceTile";
import { RepresentedPersonForm } from "@/components/people/RepresentedPersonForm";
import { formatCount } from "@/lib/format-count";
import { getSiteMetadata } from "@/lib/metadata";
import {
  getRepresentedPeopleGalleryData,
  type RepresentedPeopleSortKey,
} from "@/lib/represented-people.server";
import { getSignInPath, peopleLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";
import { authOptions } from "@/lib/auth";

const VALID_SORT_KEYS: RepresentedPeopleSortKey[] = [
  "recent",
  "oldest",
  "alphabetical",
  "died-closest-to-cure",
];

const historicalMilitarySpending = fmtParam(
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
);
const historicalWarDeaths = fmtParamValueOnly(WAR_DEATHS_SINCE_1900);
const militarySpendingAsTrialYears = fmtParam(
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
);

function parseSort(
  value: string | string[] | undefined,
): RepresentedPeopleSortKey {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && (VALID_SORT_KEYS as readonly string[]).includes(candidate)) {
    return candidate as RepresentedPeopleSortKey;
  }
  return "recent";
}

function parseEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && (allowed as readonly string[]).includes(candidate)) {
    return candidate as T;
  }
  return null;
}

function parseString(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed ? trimmed : null;
}

export const dynamic = "force-dynamic";

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

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const session = await getServerSession(authOptions);
  const params = (await searchParams) ?? {};
  const sort = parseSort(params.sort);
  const causeCategory = parseEnum<PersonDeathCauseCategory>(params.cause, [
    PersonDeathCauseCategory.DISEASE,
    PersonDeathCauseCategory.ARMED_CONFLICT,
    PersonDeathCauseCategory.STATE_VIOLENCE,
    PersonDeathCauseCategory.TERRORISM,
    PersonDeathCauseCategory.OTHER_PREVENTABLE,
    PersonDeathCauseCategory.OTHER,
    PersonDeathCauseCategory.UNKNOWN,
  ]);
  const conditionGlobalVariableId = parseString(params.conditionId);
  const conflictId = parseString(params.conflictId);
  const countryCode = parseString(params.country)?.toUpperCase() ?? null;
  const efficacyLagOnly =
    (Array.isArray(params.efficacyLag)
      ? params.efficacyLag[0]
      : params.efficacyLag) === "1";
  const pageRaw = Number.parseInt(
    Array.isArray(params.page) ? (params.page[0] ?? "1") : (params.page ?? "1"),
    10,
  );
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const data = site.primaryReferendumSlug
    ? await getRepresentedPeopleGalleryData(site.primaryReferendumSlug, {
        filters: {
          causeCategory,
          conditionGlobalVariableId,
          conflictId,
          countryCode,
          efficacyLagOnly,
        },
        page,
        sort,
      })
    : null;
  const people = data?.people ?? [];
  const filteredCount = data?.filteredCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;
  const filterParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const flat = Array.isArray(value) ? value[0] : value;
    if (typeof flat === "string" && flat.length > 0 && key !== "page") {
      filterParams.set(key, flat);
    }
  }
  const buildPageUrl = (target: number) => {
    const next = new URLSearchParams(filterParams);
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  return (
    <main className="min-h-screen bg-background text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:py-14">
        <header className="space-y-6 border-b border-border pb-8">
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
            Sign the treaty for someone
          </h1>
          <p className="max-w-4xl text-2xl font-bold leading-9 sm:text-3xl sm:leading-10">
            Some humans cannot sign the treaty themselves. Dementia, severe
            illness, disability, no internet, captivity, and death are all
            terrible UX.
          </p>
          <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            Add them here. Direct treaty signatures stay separate. Represented
            humans become public evidence that the treaty is for actual people,
            not spreadsheet fog.
          </p>
        </header>

        <section className="space-y-4 border-b border-border pb-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Represented humans
          </p>
          <p className="max-w-4xl text-2xl font-bold leading-9 sm:text-3xl sm:leading-10">
            👻 <strong>{formatCount(data?.deadPersonVoteCount ?? 0)}</strong>{" "}
            humans are no longer alive.{" "}
            <strong>{formatCount(data?.representedHumanCount ?? 0)}</strong>{" "}
            more are alive but could not sign it themselves.{" "}
            <strong>{formatCount(data?.officialVoteCount ?? 0)}</strong> humans
            signed directly.
          </p>
          <div className="space-y-3">
            <h2 className="max-w-4xl text-3xl font-black uppercase leading-tight sm:text-4xl">
              The Invisible Graveyard
            </h2>
            <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground">
              Dead humans do not count toward direct signature totals. They
              count toward making preventable death harder to hide.
            </p>
          </div>
        </section>

        <section className="space-y-4 border-y border-border py-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Plaintiffs list
          </p>
          <h2 className="max-w-4xl text-3xl font-black uppercase leading-tight sm:text-4xl">
            Know a victim of war or disease?
          </h2>
          <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground">
            Add them to the plaintiff list for the Court of Humanity class
            action against the governments of Earth. Governments were hired to
            promote the general welfare. They spent {historicalMilitarySpending}{" "}
            on war since 1913, while war and conflict killed{" "}
            {historicalWarDeaths} of their employers since 1900. That is not
            welfare. That is breach of contract with artillery.
          </p>
          <p className="max-w-4xl text-lg font-bold leading-8 text-muted-foreground">
            The same money could have funded {militarySpendingAsTrialYears} of
            government clinical trials at current spending. Disease victims
            belong here too. Medicine was the alternative purchase. The
            complaint needs plaintiffs with names.
          </p>
        </section>

        <PeopleFilterBar />

        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Showing {formatCount(people.length)} of {formatCount(filteredCount)}
        </p>

        <section
          aria-label="Wall of faces"
          className="grid gap-2 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8"
        >
          {people.length > 0 ? (
            people.map((person, index) => (
              <PersonFaceTile
                index={index}
                key={person.voteId}
                person={person}
              />
            ))
          ) : (
            <article className="col-span-3 border border-border bg-card p-8 text-card-foreground sm:col-span-4 md:col-span-6 lg:col-span-7 xl:col-span-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                Empty
              </p>
              <p className="mt-4 text-lg font-bold leading-8">
                This page is empty. Not because nobody is sick, forgotten,
                offline, or dead. Because nobody has documented them here yet.
                On Wishonia, we kept records. Your species... does not. This is
                how 10.7 billion preventable deaths remain invisible. They have
                no page.
              </p>
              <p className="mt-4 text-2xl font-black uppercase">Fix that.</p>
            </article>
          )}
        </section>

        {totalPages > 1 ? (
          <nav className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-black uppercase tracking-[0.14em]">
            {currentPage > 1 ? (
              <Link
                className="border border-border bg-background px-4 py-2 text-foreground"
                href={buildPageUrl(currentPage - 1)}
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                className="border border-border bg-background px-4 py-2 text-foreground"
                href={buildPageUrl(currentPage + 1)}
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        <section className="grid gap-6 border-t border-border pt-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Add someone
            </p>
            <h2 className="text-3xl font-black uppercase leading-tight">
              Sign the treaty for them.
            </h2>
            <p className="font-bold leading-7 text-muted-foreground">
              Add a relative, patient, friend, neighbor, or dead human with
              unfinished business. Use this for someone who cannot sign the 1%
              Treaty themselves. Direct treaty signatures stay separate.
            </p>
            {!session?.user ? (
              <Link
                className="inline-block border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background"
                href={getSignInPath(ROUTES.people)}
              >
                Sign in
              </Link>
            ) : null}
          </div>
          {session?.user ? (
            <RepresentedPersonForm />
          ) : (
            <div className="border border-border bg-card p-6 text-card-foreground">
              <p className="text-lg font-black uppercase">
                Sign the treaty yourself, then bring someone with you.
              </p>
              <Link
                className="mt-5 inline-block border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background"
                href={ROUTES.vote}
              >
                Sign Treaty
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
