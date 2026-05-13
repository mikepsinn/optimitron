import {
  CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA,
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  GLOBAL_GOVERNMENT_EXPENSE_ANNUAL,
  LOST_PROSPERITY_LIFETIME_DAMAGES_PER_CAPITA,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { PersonDeathCauseCategory } from "@optimitron/db/enums";
import { headers } from "next/headers";
import Link from "next/link";
import { PeopleFilterBar } from "@/components/people/PeopleFilterBar";
import { PersonFaceTile } from "@/components/people/PersonFaceTile";
import { RepresentedPersonConversionForm } from "@/components/people/RepresentedPersonConversionForm";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { formatCount } from "@/lib/format-count";
import { getSiteMetadata } from "@/lib/metadata";
import {
  getRepresentedPeopleGalleryData,
  type RepresentedPeopleSortKey,
} from "@/lib/represented-people.server";
import { getPlaintiffsReferendumSlug } from "@/lib/plaintiffs-flow";
import { humanityVGovernmentLink, plaintiffsLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

const VALID_SORT_KEYS: RepresentedPeopleSortKey[] = [
  "recent",
  "oldest",
  "alphabetical",
  "died-closest-to-cure",
];
const PLAINTIFFS_PAGE_SIZE = 24;
const FILTER_PARAM_KEYS = new Set([
  "cause",
  "conditionId",
  "conflictId",
  "country",
  "efficacyLag",
  "sort",
]);

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
      title: `${plaintiffsLink.label} | ${site.name}`,
      description: plaintiffsLink.description,
    },
    ROUTES.plaintiffs,
    { robots: { index: true, follow: true } },
  );
}

export default async function PlaintiffsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
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

  const referendumSlug = getPlaintiffsReferendumSlug(site);
  const data = await getRepresentedPeopleGalleryData(referendumSlug, {
    filters: {
      causeCategory,
      conditionGlobalVariableId,
      conflictId,
      countryCode,
      efficacyLagOnly,
    },
    page,
    pageSize: PLAINTIFFS_PAGE_SIZE,
    sort,
  });
  const people = data?.people ?? [];
  const filteredCount = data?.filteredCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasActiveBrowseState = Boolean(
    causeCategory ||
    conditionGlobalVariableId ||
    conflictId ||
    countryCode ||
    efficacyLagOnly ||
    sort !== "recent" ||
    currentPage > 1,
  );
  const showBrowseTools =
    hasActiveBrowseState || filteredCount >= PLAINTIFFS_PAGE_SIZE;
  const filterParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const flat = Array.isArray(value) ? value[0] : value;
    if (
      FILTER_PARAM_KEYS.has(key) &&
      typeof flat === "string" &&
      flat.length > 0
    ) {
      filterParams.set(key, flat);
    }
  }
  const buildPageUrl = (target: number) => {
    const next = new URLSearchParams(filterParams);
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `?${qs}` : ROUTES.plaintiffs;
  };

  return (
    <main className="min-h-screen bg-background text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:py-14">
        <header className="space-y-6">
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-none sm:text-6xl">
            Register plaintiffs for Humanity v Government.
          </h1>
          <div className="max-w-5xl space-y-4 text-lg font-bold leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
            <p>
              You pay your governments{" "}
              <ParameterValue
                figures={3}
                param={GLOBAL_GOVERNMENT_EXPENSE_ANNUAL}
              />{" "}
              to promote your general welfare. Since 1900 they spent{" "}
              <ParameterValue
                figures={3}
                param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              />{" "}
              murdering{" "}
              <ParameterValue figures={3} param={WAR_DEATHS_SINCE_1900} />{" "}
              of their employers — enough to fund{" "}
              <ParameterValue
                figures={3}
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
              />{" "}
              years of clinical trials at current funding levels.
            </p>
            <p>
              Register anyone you love who was killed or harmed. The case in{" "}
              <Link
                className="underline underline-offset-4"
                href={ROUTES.humanityVGovernment}
              >
                {humanityVGovernmentLink.label}
              </Link>{" "}
              seeks{" "}
              <ParameterValue
                figures={3}
                param={CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA}
              />{" "}
              per murdered human in damages.
            </p>
          </div>
        </header>

        <RepresentedPersonConversionForm referendumSlug={referendumSlug} />

        <section className="space-y-5 border-t border-border pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-muted-foreground">
                Public plaintiffs
              </p>
              <h2 className="text-3xl font-black uppercase leading-tight">
                Plaintiffs in{" "}
                <Link
                  className="underline underline-offset-4"
                  href={ROUTES.humanityVGovernment}
                >
                  {humanityVGovernmentLink.label}
                </Link>
              </h2>
            </div>
          </div>

          {showBrowseTools ? (
            <>
              <PeopleFilterBar />
              {hasActiveBrowseState ? (
                <p className="text-xs font-black uppercase text-muted-foreground">
                  Showing {formatCount(people.length)} of{" "}
                  {formatCount(filteredCount)}
                </p>
              ) : null}
            </>
          ) : null}

          <section
            aria-label="Wall of faces"
            className="grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8"
          >
            {people.length > 0 ? (
              people.map((person, index) => (
                <PersonFaceTile
                  index={index}
                  key={person.partyId}
                  person={person}
                />
              ))
            ) : (
              <article className="col-span-3 border border-border bg-card p-8 text-card-foreground sm:col-span-4 md:col-span-6 lg:col-span-7 xl:col-span-8">
                <p className="text-xs font-black uppercase text-muted-foreground">
                  No public plaintiffs yet
                </p>
                <p className="mt-4 text-lg font-bold leading-8">
                  Add the first plaintiff above.
                </p>
              </article>
            )}
          </section>

          {totalPages > 1 ? (
            <nav className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-black uppercase">
              {currentPage > 1 ? (
                <Link
                  className="border border-border bg-background px-4 py-2 text-foreground"
                  href={buildPageUrl(currentPage - 1)}
                >
                  Previous
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
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>

        <section className="space-y-3 border-t border-border pt-8">
          <details className="border border-border bg-card p-4 text-card-foreground">
            <summary className="cursor-pointer text-lg font-black uppercase">
              Who belongs here?
            </summary>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              Anyone you love who can&apos;t speak for themselves. Dementia,
              severe illness, disability, captivity, no internet, or death.
              Their names still count — they make preventable death harder to
              hide. Add a relative, a patient, a friend, a neighbor, or anyone
              with unfinished business with the governments of Earth.
            </p>
          </details>
        </section>

        <section
          aria-label="Damages claim"
          className="border-t-2 border-foreground bg-background pt-8"
        >
          <p className="text-xs font-black uppercase text-muted-foreground">
            The damages claim
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black uppercase leading-none sm:text-5xl">
                <ParameterValue
                  param={CORPORATE_DAMAGES_FORWARD_SETTLEMENT_VALUE_PER_CAPITA}
                  figures={2}
                />
              </span>
              <span className="text-xs font-black uppercase text-muted-foreground">
                Per murdered human (NPV at 3% perpetuity)
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black uppercase leading-none sm:text-5xl">
                <ParameterValue
                  param={LOST_PROSPERITY_LIFETIME_DAMAGES_PER_CAPITA}
                  figures={2}
                />
              </span>
              <span className="text-xs font-black uppercase text-muted-foreground">
                Lifetime cohort exposure per human
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
