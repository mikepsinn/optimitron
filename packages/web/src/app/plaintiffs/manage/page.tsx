import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS,
  CUMULATIVE_MILITARY_SPENDING_FED_ERA,
  WAR_DEATHS_SINCE_1900,
} from "@optimitron/data/parameters";
import { PersonConditionStatus, ReferendumVoteSource } from "@optimitron/db";
import { PersonDeathCauseCategory } from "@optimitron/db/enums";
import { ManageRepresentedPeopleClient } from "@/components/people/ManageRepresentedPeopleClient";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { authOptions } from "@/lib/auth";
import { getRouteMetadata } from "@/lib/metadata";
import { GOVERNMENTS_PAID_TO_PROMOTE_WELFARE } from "@/lib/people-parameters";
import { prisma } from "@/lib/prisma";
import { getSignInPath, plaintiffsManageLink, ROUTES } from "@/lib/routes";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

const MANAGE_PAGE_SIZE = 5;

export const metadata = getRouteMetadata({
  ...plaintiffsManageLink,
});

function dateInputValue(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function parsePage(value: string | string[] | undefined) {
  const raw = Number.parseInt(
    Array.isArray(value) ? (value[0] ?? "1") : (value ?? "1"),
    10,
  );
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function pageUrl(page: number) {
  return page > 1
    ? `${ROUTES.plaintiffsManage}?page=${page}`
    : ROUTES.plaintiffsManage;
}

function ManagePagination({
  currentPage,
  totalCount,
  totalPages,
}: {
  currentPage: number;
  totalCount: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const first = (currentPage - 1) * MANAGE_PAGE_SIZE + 1;
  const last = Math.min(currentPage * MANAGE_PAGE_SIZE, totalCount);

  return (
    <nav
      aria-label="Your plaintiffs pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-1 py-4 text-foreground"
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        {first}-{last} of {totalCount}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {currentPage > 1 ? (
          <Link
            className="inline-flex min-h-10 items-center border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground"
            href={pageUrl(currentPage - 1)}
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center border border-border bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground opacity-50">
            Previous
          </span>
        )}
        <span className="px-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link
            className="inline-flex min-h-10 items-center border border-foreground bg-foreground px-4 text-xs font-black uppercase tracking-[0.14em] text-background"
            href={pageUrl(currentPage + 1)}
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
  );
}

export default async function ManagePeoplePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  if (!userId) {
    redirect(getSignInPath(ROUTES.plaintiffsManage));
  }

  const referendumSlug = TREATY_REFERENDUM_SLUG;
  const params = (await searchParams) ?? {};
  const requestedPage = parsePage(params.page);
  const editParam = Array.isArray(params.edit) ? params.edit[0] : params.edit;
  const initialEditingId =
    typeof editParam === "string" && editParam.trim() ? editParam.trim() : null;
  const representedPeopleWhere = {
    createdByUserId: userId,
    deletedAt: null,
    referendumVotes: {
      some: {
        deletedAt: null,
        referendum: { slug: referendumSlug },
        userId,
        voteSource: ReferendumVoteSource.REPRESENTED,
      },
    },
  };
  const totalCount = await prisma.person.count({
    where: representedPeopleWhere,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / MANAGE_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const people = await prisma.person.findMany({
    skip: (currentPage - 1) * MANAGE_PAGE_SIZE,
    take: MANAGE_PAGE_SIZE,
    where: representedPeopleWhere,
    orderBy: { createdAt: "desc" },
    select: {
      birthDate: true,
      conditions: {
        where: { deletedAt: null },
        orderBy: [{ status: "desc" as const }, { createdAt: "asc" as const }],
        select: { conditionName: true, status: true },
        take: 3,
      },
      deathDate: true,
      displayName: true,
      id: true,
      image: true,
      isPublic: true,
      lifeStatus: true,
      memorial: {
        select: {
          causeCategory: true,
          deathCountryCode: true,
          evidence: {
            where: { deletedAt: null, submittedByUserId: userId },
            orderBy: { createdAt: "desc" },
            select: {
              description: true,
              evidenceKind: true,
              id: true,
              sourceUrl: true,
              title: true,
            },
            take: 8,
          },
          submissions: {
            where: { deletedAt: null, submittedByUserId: userId },
            orderBy: { createdAt: "desc" },
            select: {
              consentCourtEvidence: true,
              memorialMessage: true,
            },
            take: 1,
          },
        },
      },
      referendumVotes: {
        where: {
          deletedAt: null,
          referendum: { slug: referendumSlug },
          userId,
          voteSource: ReferendumVoteSource.REPRESENTED,
        },
        select: { publicComment: true },
        take: 1,
      },
      relationshipsAsObject: {
        where: { createdByUserId: userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { relationshipType: true },
        take: 1,
      },
    },
  });

  const editablePeople = people.map((person) => {
    const primaryCondition =
      person.conditions.find(
        (condition) =>
          condition.status === PersonConditionStatus.CAUSE_OF_DEATH,
      ) ??
      person.conditions[0] ??
      null;
    const submission = person.memorial?.submissions[0] ?? null;
    return {
      birthDate: dateInputValue(person.birthDate),
      causeCategory:
        person.memorial?.causeCategory ?? PersonDeathCauseCategory.UNKNOWN,
      conditionName: primaryCondition?.conditionName ?? "",
      dateOfDeath: dateInputValue(person.deathDate),
      deathCountryCode: person.memorial?.deathCountryCode ?? "",
      displayName: person.displayName,
      evidence:
        person.memorial?.evidence.map((evidence) => ({
          description: evidence.description ?? "",
          evidenceKind: evidence.evidenceKind,
          id: evidence.id,
          sourceUrl: evidence.sourceUrl ?? "",
          title: evidence.title ?? "",
        })) ?? [],
      id: person.id,
      imageUrl: person.image ?? "",
      isPublic: person.isPublic,
      lifeStatus: person.lifeStatus,
      memorialMessage: submission?.memorialMessage ?? "",
      publicComment: person.referendumVotes[0]?.publicComment ?? "",
      relationshipType: person.relationshipsAsObject[0]?.relationshipType ?? "",
      consentCourtEvidence: submission?.consentCourtEvidence ?? false,
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <section className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-14">
        <header className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Humanity v. Government
              </p>
              <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
                Your Plaintiffs
              </h1>
            </div>
            <Link
              className="inline-flex min-h-11 items-center border border-foreground bg-background px-4 text-xs font-black uppercase tracking-[0.14em] text-foreground"
              href={ROUTES.plaintiffs}
            >
              Register another plaintiff
            </Link>
          </div>
          <div className="space-y-4 border border-foreground bg-background p-5 text-lg font-bold leading-8 text-foreground">
            <p>
              These are the plaintiffs you registered for Humanity v.
              Government, the Court of Humanity class action.
            </p>
            <p>
              Humanity pays governments{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={GOVERNMENTS_PAID_TO_PROMOTE_WELFARE}
              />{" "}
              a year to promote the general welfare. Over the last century, they
              spent{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={CUMULATIVE_MILITARY_SPENDING_FED_ERA}
              />{" "}
              murdering{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={WAR_DEATHS_SINCE_1900}
              />{" "}
              humans. That money could have funded{" "}
              <ParameterValue
                className="font-black"
                figures={2}
                param={CUMULATIVE_MILITARY_IN_GOVT_TRIAL_YEARS}
              />{" "}
              years of clinical trials at current government spending.
            </p>
            <p>
              Open a plaintiff to add the photo, disease or cause, relationship,
              public note, or evidence.
            </p>
          </div>
        </header>

        <ManageRepresentedPeopleClient
          currentPage={currentPage}
          initialEditingId={initialEditingId}
          people={editablePeople}
          referendumSlug={referendumSlug}
        />

        <ManagePagination
          currentPage={currentPage}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </section>
    </main>
  );
}
