import {
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
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
import { GOVERNMENTS_PAID_TO_PROMOTE_WELFARE } from "@/lib/people-parameters";
import {
  getRepresentedPeopleGalleryData,
  type RepresentedPeopleSortKey,
} from "@/lib/represented-people.server";
import { peopleLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

const VALID_SORT_KEYS: RepresentedPeopleSortKey[] = [
  "recent",
  "oldest",
  "alphabetical",
  "died-closest-to-cure",
];

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
        pageSize: 24,
        sort,
      })
    : null;
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
  const showBrowseTools = hasActiveBrowseState || filteredCount >= 24;
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
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:py-14">
        <header className="space-y-6">
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
            Sign the treaty for someone who can't.
          </h1>
          <p className="max-w-5xl text-lg font-bold leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
            Please list everyone you love who can no longer sign the 1% Treaty
            because of death, disease, or both, so they may be presented as
            evidence in the class action lawsuit Humanity v. Government.
          </p>
        </header>

        <RepresentedPersonConversionForm />

        <section className="max-w-5xl space-y-4 text-lg font-bold leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
          <p>
            Governments are paid{" "}
            <ParameterValue
              className="font-black"
              param={GOVERNMENTS_PAID_TO_PROMOTE_WELFARE}
              figures={2}
            />{" "}
            a year to promote the general welfare. Over the last century, they
            spent{" "}
            <ParameterValue
              className="font-black"
              param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              figures={2}
            />{" "}
            murdering{" "}
            <ParameterValue
              className="font-black"
              param={WAR_DEATHS_SINCE_1900}
              figures={2}
            />{" "}
            humans.
          </p>
          <p>
            This is the opposite of promoting their welfare and a breach of
            their employment contract. That{" "}
            <ParameterValue
              className="font-black"
              param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              figures={2}
            />{" "}
            would have funded{" "}
            <ParameterValue
              className="font-black"
              param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
              figures={2}
            />{" "}
            years of clinical trials at current government spending.
          </p>
          <p>
            Therefore, it is very likely disease would have been eradicated long
            ago were it not for this misallocation.
          </p>
        </section>

        <section className="space-y-5 border-t border-border pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Public plaintiffs
              </p>
              <h2 className="text-3xl font-black uppercase leading-tight">
                Plaintiffs in Humanity v. Government
              </h2>
            </div>
          </div>

          {showBrowseTools ? (
            <>
              <PeopleFilterBar />
              {hasActiveBrowseState ? (
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Showing {formatCount(people.length)} of{" "}
                  {formatCount(filteredCount)}
                </p>
              ) : null}
            </>
          ) : null}

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
                  No public plaintiffs yet
                </p>
                <p className="mt-4 text-lg font-bold leading-8">
                  Add the first plaintiff above.
                </p>
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Questions
          </p>
          <details className="border border-border bg-card p-4 text-card-foreground">
            <summary className="cursor-pointer text-lg font-black uppercase">
              Who belongs here?
            </summary>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              Some humans cannot sign the treaty themselves. Dementia, severe
              illness, disability, no internet, captivity, and death are all
              terrible UX.
            </p>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              Add a relative, patient, friend, neighbor, or dead human with
              unfinished business. Use this for someone who cannot sign the 1%
              Treaty themselves.
            </p>
          </details>
          <details className="border border-border bg-card p-4 text-card-foreground">
            <summary className="cursor-pointer text-lg font-black uppercase">
              The Invisible Graveyard
            </summary>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              Dead humans cannot click a treaty button. Their names still count
              toward making preventable death harder to hide.
            </p>
          </details>
          <details className="border border-border bg-card p-4 text-card-foreground">
            <summary className="cursor-pointer text-lg font-black uppercase">
              Know a victim of war or disease?
            </summary>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              Add them to the plaintiff list for Humanity v. Government, the
              class action against the governments of Earth. Governments were
              hired to promote the general welfare. They spent{" "}
              <ParameterValue
                className="font-black"
                param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
                figures={2}
              />{" "}
              on war since 1913, while war and conflict killed{" "}
              <ParameterValue
                className="font-black"
                param={WAR_DEATHS_SINCE_1900}
                figures={2}
              />{" "}
              of their employers since 1900. That is not welfare. That is breach
              of contract with artillery.
            </p>
            <p className="mt-3 max-w-4xl font-bold leading-7 text-muted-foreground">
              The same money could have funded{" "}
              <ParameterValue
                className="font-black"
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
                figures={2}
              />{" "}
              of government clinical trials at current spending. Disease victims
              belong here too. Medicine was the alternative purchase. The
              complaint needs plaintiffs with names.
            </p>
          </details>
        </section>
      </section>
    </main>
  );
}
