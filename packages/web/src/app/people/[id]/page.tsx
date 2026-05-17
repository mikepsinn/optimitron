import type { Metadata } from "next";
import type { ReactNode } from "react";
import { VOTER_SUFFERING_HOURS_PREVENTED } from "@optimitron/data/parameters";
import { PersonLifeStatus, VotePosition } from "@optimitron/db/enums";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { SufferingPreventedMetric } from "@/components/referendum/SignatoriesLeaderboard";
import { Avatar } from "@/components/retroui/Avatar";
import { CopyLinkButton } from "@/components/sharing/copy-link-button";
import {
  defaultButtonClassName,
  primaryButtonClassName,
} from "@/components/ui/default-button";
import { PublicProfileTaskSection } from "@/components/tasks/PublicProfileTaskSection";
import { WelfareClaim } from "@/components/shared/WelfareClaim";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { authOptions } from "@/lib/auth";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { prisma } from "@/lib/prisma";
import { getRepresentedLifeStatusLabel } from "@/lib/represented-life-status";
import { buildOfficialReferendumVoteWhere } from "@/lib/referendum-vote-classification.server";
import {
  humanityVGovernmentLink,
  plaintiffsLink,
  ROUTES,
} from "@/lib/routes";
import {
  getRepresentedPersonProfileData,
  type RepresentedPersonProfileData,
} from "@/lib/represented-people.server";
import {
  getRequestSiteOrigin,
  getSiteFromHeaders,
} from "@/lib/site";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";
import { buildUserReferralUrl } from "@/lib/url";

const PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS = 300;

const getCachedRepresentedPersonProfileData = unstable_cache(
  async (id: string) => getRepresentedPersonProfileData(id),
  ["public-represented-person-profile"],
  { revalidate: PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS },
);

const getCachedPersonTaskProfileData = unstable_cache(
  async (id: string) => getPersonTaskProfileData(id, null),
  ["public-person-task-profile"],
  { revalidate: PUBLIC_PERSON_PROFILE_REVALIDATE_SECONDS },
);

type PersonTaskProfileData = NonNullable<
  Awaited<ReturnType<typeof getPersonTaskProfileData>>
>;
type PublicProfilePerson = PersonTaskProfileData["person"];
type PublicProfileVote = PublicProfilePerson["referendumVotes"][number];

async function getVisitorTreatyStatus(userId: string | null) {
  if (!userId) {
    return { hasSignedTreaty: false };
  }

  const vote = await prisma.referendumVote.findFirst({
    where: {
      ...buildOfficialReferendumVoteWhere({
        answer: VotePosition.YES,
      }),
      referendum: {
        deletedAt: null,
        slug: TREATY_REFERENDUM_SLUG,
      },
      userId,
    },
    select: { id: true },
  });

  return { hasSignedTreaty: Boolean(vote) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const [representedData, data] = await Promise.all([
    getRepresentedPersonProfileData(id),
    getPersonTaskProfileData(id, null),
  ]);

  if (representedData && (!data || !shouldUseCampaignProfile(data.person))) {
    const isDeceased =
      representedData.person.lifeStatus === PersonLifeStatus.DECEASED;
    const condition = representedData.memorial?.conditionLabel ?? null;
    const lag = representedData.memorial?.efficacyLag ?? null;
    const baseDescription =
      representedData.filing.publicComment ??
      representedData.memorial?.memorialMessage ??
      `${representedData.person.displayName} was registered as a plaintiff in Humanity v Government.`;
    const description = lag
      ? `${baseDescription} ${lag.interventionName} was approved ${lag.approvalDate.getUTCFullYear()}.`
      : condition && isDeceased
        ? `${representedData.person.displayName} died of ${condition}. ${baseDescription}`
        : baseDescription;
    return {
      title: {
        absolute: `${representedData.person.displayName} | ${site.name}`,
      },
      description,
      robots: { index: true, follow: true },
      metadataBase: new URL(site.canonicalOrigin),
      openGraph: {
        title: representedData.person.displayName,
        description,
        siteName: site.name,
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: representedData.person.displayName,
        description,
      },
    };
  }

  if (!data) {
    return {
      title: { absolute: `Person | ${site.name}` },
      metadataBase: new URL(site.canonicalOrigin),
    };
  }

  const treatyVote = getVoteBySlug(data.person, TREATY_REFERENDUM_SLUG);
  const description = treatyVote
    ? `${data.person.displayName} signed the 1% Treaty. Add your name.`
    : `${data.person.displayName}'s public campaign profile. Sign the 1% Treaty.`;

  return {
    title: { absolute: `${data.person.displayName} | ${site.name}` },
    description,
    robots: { index: true, follow: true },
    metadataBase: new URL(site.canonicalOrigin),
    openGraph: {
      siteName: site.name,
      title: data.person.displayName,
      description,
    },
  };
}

function getFallbackInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelationship(value: string | null) {
  if (!value) return null;
  return value.replace(/-/g, " ");
}

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatHumanCount(value: number) {
  return Math.max(0, value).toLocaleString("en-US");
}

function formatRecruitmentPhrase(value: number) {
  const count = Math.max(0, value);
  const noun = count === 1 ? "human" : "humans";
  return `recruited ${formatHumanCount(count)} ${noun}`;
}

function getVoteBySlug(
  person: PublicProfilePerson,
  slug: string,
): PublicProfileVote | null {
  return (
    person.referendumVotes.find(
      (vote) => vote.referendum.slug === slug,
    ) ?? null
  );
}

function shouldUseCampaignProfile(person: PublicProfilePerson) {
  return Boolean(person.user) || person.referendumVotes.length > 0;
}

function getTrustSignal(person: PublicProfilePerson) {
  const treatyVote = getVoteBySlug(person, TREATY_REFERENDUM_SLUG);
  const recruitedCount = person.user?._count.referendumReferrals ?? 0;

  if (treatyVote) {
    const signedDate = formatIsoDate(treatyVote.createdAt);
    const parts = [
      signedDate
        ? `Signed the 1% Treaty ${signedDate}`
        : "Signed the 1% Treaty",
    ];
    if (recruitedCount > 0) {
      parts.push(formatRecruitmentPhrase(recruitedCount));
    }
    return parts.join(", ");
  }

  const affiliation = person.currentAffiliation?.trim();
  if (
    affiliation &&
    /\b(institute|medicine|research|university|hospital|clinic|lab|foundation|mit)\b/i.test(
      affiliation,
    )
  ) {
    return affiliation;
  }

  return "Public campaign profile";
}

function buildForwardReferralHref(referralUrl: string) {
  const subject = "Sign the 1% Treaty";
  const body = `I signed the 1% Treaty. Add your name: ${referralUrl}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function RepresentedPersonProfile({
  data,
}: {
  data: RepresentedPersonProfileData;
}) {
  const {
    conditions,
    memorial,
    person,
    relationshipType,
    representedBy,
    filing,
  } = data;
  const fallbackInitials = getFallbackInitials(person.displayName);
  const relationship = formatRelationship(relationshipType);
  const birthDate = formatDate(person.birthDate);
  const deathDate = formatDate(person.deathDate);
  const filingComment =
    filing.publicComment && filing.publicComment !== memorial?.memorialMessage
      ? filing.publicComment
      : null;
  const summaryCards = [
    { label: "Registered by", value: representedBy },
    relationship ? { label: "Relationship", value: relationship } : null,
    {
      label: "Case",
      value: (
        <Link
          className="underline underline-offset-4"
          href={ROUTES.humanityVGovernment}
        >
          {humanityVGovernmentLink.label}
        </Link>
      ),
    },
  ].filter(Boolean) as Array<{ label: string; value: ReactNode }>;

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-14">
        <nav className="text-sm font-black uppercase tracking-[0.14em]">
          <Link
            className="underline underline-offset-4"
            href={ROUTES.plaintiffs}
          >
            {plaintiffsLink.label}
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-muted-foreground">{person.displayName}</span>
        </nav>

        <header className="grid gap-8 border-b border-border pb-8 md:grid-cols-[auto_1fr]">
          <Avatar className="h-36 w-36 border border-border bg-muted">
            <Avatar.Image
              alt={person.displayName}
              src={person.image ?? undefined}
            />
            <Avatar.Fallback className="bg-muted text-4xl font-black">
              {fallbackInitials || "?"}
            </Avatar.Fallback>
          </Avatar>
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              {getRepresentedLifeStatusLabel(person.lifeStatus)}
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
              {person.displayName}
            </h1>
            {person.bio ? (
              <p className="max-w-3xl text-base font-bold leading-7 text-muted-foreground">
                {person.bio}
              </p>
            ) : null}
            {birthDate || deathDate ? (
              <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">
                {birthDate ? `Born ${birthDate}` : null}
                {birthDate && deathDate ? " / " : null}
                {deathDate ? `Died ${deathDate}` : null}
                {memorial?.deathCountryCode
                  ? ` in ${memorial.deathCountryCode}`
                  : ""}
              </p>
            ) : null}
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              className="border border-border bg-card p-5 text-card-foreground"
              key={card.label}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-black">{card.value}</p>
            </div>
          ))}
        </section>

        {conditions.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-[0.12em]">
              Conditions
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {conditions.map((condition) => (
                <li
                  className="border border-border bg-card p-4 text-card-foreground"
                  key={`${condition.conditionName}-${condition.status}`}
                >
                  <p className="text-lg font-black uppercase">
                    {condition.conditionName}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                    {condition.status.replace(/_/g, " ").toLowerCase()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {filingComment ? (
          <section className="border-y border-border py-6">
            <p className="text-2xl font-black leading-10">
              &ldquo;{filingComment}&rdquo;
            </p>
          </section>
        ) : null}

        {memorial?.memorialMessage ? (
          <section className="border-y border-border py-6">
            <p className="text-2xl font-black leading-10">
              &ldquo;{memorial.memorialMessage}&rdquo;
            </p>
          </section>
        ) : null}

        {memorial?.responsibleParties.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-[0.12em]">
              Responsible party
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {memorial.responsibleParties.map((party) => (
                <li
                  className="border border-border bg-card p-4 text-lg font-black uppercase text-card-foreground"
                  key={party.name ?? "unknown"}
                >
                  {party.name ?? "Unspecified"}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {memorial?.hasCourtEvidenceConsent ? (
          <section className="space-y-3 border border-border bg-card p-5 text-card-foreground">
            <h2 className="text-xl font-black uppercase tracking-[0.12em]">
              Evidence package
            </h2>
            <p className="font-bold leading-7 text-muted-foreground">
              At least one submitter has consented to use this plaintiff as
              evidence in{" "}
              <Link
                className="underline underline-offset-4"
                href={ROUTES.humanityVGovernment}
              >
                {humanityVGovernmentLink.label}
              </Link>{" "}
              or a future legal proceeding.
            </p>
            <a
              className={defaultButtonClassName}
              download={`${person.handle ?? person.id}-evidence-package.json`}
              href={`/api/people/${person.handle ?? person.id}/evidence-package`}
            >
              Download evidence package
            </a>
          </section>
        ) : null}

        <section className="border border-border bg-card p-5 text-card-foreground">
          <p className="font-bold leading-7 text-muted-foreground">
            This plaintiff was registered as evidence in{" "}
            <Link
              className="underline underline-offset-4"
              href={ROUTES.humanityVGovernment}
            >
              {humanityVGovernmentLink.label}
            </Link>
            . The claim is simple: <WelfareClaim /> They spent the repair
            money on war.
          </p>
          <Link
            className={`${defaultButtonClassName} mt-4`}
            href={ROUTES.plaintiffs}
          >
            Register another plaintiff
          </Link>
        </section>
      </div>
    </main>
  );
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const [representedData, data] = await Promise.all([
    userId
      ? getRepresentedPersonProfileData(id)
      : getCachedRepresentedPersonProfileData(id),
    userId
      ? getPersonTaskProfileData(id, userId)
      : getCachedPersonTaskProfileData(id),
  ]);

  if (representedData && (!data || !shouldUseCampaignProfile(data.person))) {
    return <RepresentedPersonProfile data={representedData} />;
  }

  if (!data) {
    notFound();
  }

  const hdrs = await headers();
  const requestOrigin = getRequestSiteOrigin({
    host: hdrs.get("host"),
    forwardedHost: hdrs.get("x-forwarded-host"),
    forwardedProto: hdrs.get("x-forwarded-proto"),
  });
  const visitorStatus = await getVisitorTreatyStatus(userId);
  const { openTasks, person, verifiedTasks } = data;
  const fallbackInitials = getFallbackInitials(person.displayName);
  const treatyVote = getVoteBySlug(person, TREATY_REFERENDUM_SLUG);
  const courtVote = getVoteBySlug(person, DECLARATION_SLUG);
  const recruitedCount = person.user?._count.referendumReferrals ?? 0;
  const plaintiffCount = person.user?._count.createdCourtCaseParties ?? 0;
  const signatureCount = (treatyVote ? 1 : 0) + recruitedCount;
  const hoursPrevented =
    VOTER_SUFFERING_HOURS_PREVENTED.value * signatureCount;
  const profileReferralUrl = person.user
    ? buildUserReferralUrl(
        { handle: person.handle, referralCode: person.user.referralCode },
        requestOrigin,
      )
    : `${requestOrigin}${ROUTES.vote}`;
  const visitorReferralUrl = session?.user
    ? buildUserReferralUrl(session.user, requestOrigin)
    : null;
  const shouldShowVisitorReferral =
    visitorStatus.hasSignedTreaty && Boolean(visitorReferralUrl);
  const signatureRows = person.referendumVotes;
  const activityRows = [
    {
      label: "Treaty signed",
      value: treatyVote
        ? (formatIsoDate(treatyVote.createdAt) ?? "Yes")
        : "Not public",
    },
    {
      label: "Court signed",
      value: courtVote
        ? (formatIsoDate(courtVote.createdAt) ?? "Yes")
        : "Not public",
    },
    {
      label: "Plaintiffs registered",
      value: formatHumanCount(plaintiffCount),
    },
    {
      label: "Humans recruited",
      value: formatHumanCount(recruitedCount),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col px-4 pb-16 pt-6 sm:pt-10">
        <header className="flex flex-col gap-4 border-b-2 border-foreground pb-6 sm:flex-row sm:items-center">
          <Avatar className="h-28 w-28 shrink-0 border-2 border-foreground bg-background sm:h-32 sm:w-32">
            {person.image ? (
              <Avatar.Image alt={person.displayName} src={person.image} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-black uppercase text-foreground">
                {fallbackInitials || "?"}
              </div>
            )}
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-4xl font-black uppercase leading-none [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
              {person.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-black uppercase leading-6 tracking-[0.12em] text-muted-foreground">
              {getTrustSignal(person)}
            </p>
          </div>
        </header>

        <section className="border-b-2 border-foreground py-6">
          <SufferingPreventedMetric
            className="items-start px-0 py-0 text-left hover:no-underline"
            hoursPrevented={hoursPrevented}
            label="Hours of suffering prevented"
            name={person.displayName}
            valueClassName="text-5xl sm:text-6xl md:text-7xl"
          />
        </section>

        <section className="border-b-2 border-foreground py-6">
          {shouldShowVisitorReferral && visitorReferralUrl ? (
            <div className="space-y-4">
              <a
                className={`${primaryButtonClassName} w-full sm:w-auto`}
                href={buildForwardReferralHref(visitorReferralUrl)}
              >
                Forward My Referral
              </a>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Your referral URL
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <p className="min-h-12 break-all border border-foreground bg-background px-3 py-3 text-sm font-bold">
                    {visitorReferralUrl}
                  </p>
                  <CopyLinkButton
                    className="min-h-12 justify-center rounded-none border border-foreground bg-background px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-foreground hover:text-background hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-none"
                    copiedLabel="Copied"
                    idleLabel="Copy"
                    url={visitorReferralUrl}
                  />
                </div>
              </div>
            </div>
          ) : (
            <a
              className={`${primaryButtonClassName} w-full sm:w-auto`}
              href={profileReferralUrl}
            >
              Sign the Treaty
            </a>
          )}
        </section>

        <section className="grid gap-3 border-b-2 border-foreground py-6 sm:grid-cols-4">
          {activityRows.map((row) => (
            <div className="border border-foreground p-4" key={row.label}>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums">
                {row.value}
              </p>
            </div>
          ))}
        </section>

        <section className="border-b-2 border-foreground py-8">
          <h2 className="text-2xl font-black uppercase tracking-[0.08em] [font-family:var(--v0-font-libre-baskerville)]">
            Public Signatures
          </h2>
          {signatureRows.length > 0 ? (
            <ul className="mt-4 divide-y divide-foreground border border-foreground">
              {signatureRows.map((vote) => (
                <li
                  className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={vote.id}
                >
                  <Link
                    className="font-black underline-offset-4 hover:underline"
                    href={`${ROUTES.referendum}/${vote.referendum.slug}`}
                  >
                    {vote.referendum.title}
                  </Link>
                  <span className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">
                    {formatIsoDate(vote.createdAt) ?? "Signed"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-bold text-muted-foreground">
              No public referendum signatures yet.
            </p>
          )}
        </section>

        <PublicProfileTaskSection
          completedTasks={verifiedTasks}
          openTasks={openTasks}
          ownerName={person.displayName}
        />
      </div>
    </div>
  );
}
