import type { Metadata } from "next";
import { PersonLifeStatus } from "@optimitron/db/enums";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { YEARS_PER_AVERTED_DEATH } from "@/components/tasks/task-row";
import { Avatar } from "@/components/retroui/Avatar";
import { isPublicOfficialPerson } from "@/lib/public-officials";
import {
  aggregateTaskDelayStats,
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";
import { getPersonTaskProfileData } from "@/lib/tasks.server";
import { authOptions } from "@/lib/auth";
import { peopleLink, ROUTES } from "@/lib/routes";
import {
  getRepresentedPersonProfileData,
  type RepresentedPersonProfileData,
} from "@/lib/represented-people.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const representedData = await getRepresentedPersonProfileData(id);

  if (representedData) {
    const isDeceased =
      representedData.person.lifeStatus === PersonLifeStatus.DECEASED;
    const condition = representedData.memorial?.conditionLabel ?? null;
    const lag = representedData.memorial?.efficacyLag ?? null;
    const baseDescription =
      representedData.vote.publicComment ??
      representedData.memorial?.memorialMessage ??
      `${representedData.person.displayName} was added by someone who represented them on the 1% Treaty.`;
    const description = lag
      ? `${baseDescription} ${lag.interventionName} was approved ${lag.approvalDate.getUTCFullYear()}.`
      : condition && isDeceased
        ? `${representedData.person.displayName} died of ${condition}. ${baseDescription}`
        : baseDescription;
    return {
      title: `${representedData.person.displayName} | ${peopleLink.label}`,
      description,
      openGraph: {
        title: representedData.person.displayName,
        description,
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title: representedData.person.displayName,
        description,
      },
    };
  }

  const data = await getPersonTaskProfileData(id, null);

  if (!data) {
    return {
      title: "Person | Optimitron",
    };
  }

  const isOfficial = isPublicOfficialPerson(data.person);

  return {
    title: `${data.person.displayName} | Optimitron`,
    description: isOfficial
      ? `${data.person.displayName}'s employee performance review.`
      : `${data.person.displayName}'s public task profile.`,
  };
}

function getFallbackInitials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getRepresentedLifeStatusLabel(status: PersonLifeStatus) {
  if (status === PersonLifeStatus.DECEASED) {
    return "Plaintiff who can no longer sign";
  }
  if (status === PersonLifeStatus.LIVING) {
    return "Plaintiff represented by another human";
  }
  return "Plaintiff in Humanity v. Government";
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
    vote,
  } = data;
  const fallbackInitials = getFallbackInitials(person.displayName);
  const relationship = formatRelationship(relationshipType);
  const birthDate = formatDate(person.birthDate);
  const deathDate = formatDate(person.deathDate);
  const voteComment =
    vote.publicComment && vote.publicComment !== memorial?.memorialMessage
      ? vote.publicComment
      : null;
  const summaryCards = [
    { label: "Registered by", value: representedBy },
    relationship ? { label: "Relationship", value: relationship } : null,
    { label: "Case", value: "Humanity v. Government" },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:py-14">
        <nav className="text-sm font-black uppercase tracking-[0.14em]">
          <Link className="underline underline-offset-4" href={ROUTES.people}>
            {peopleLink.label}
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

        {voteComment ? (
          <section className="border-y border-border py-6">
            <p className="text-2xl font-black leading-10">
              &ldquo;{voteComment}&rdquo;
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
              evidence in Humanity v. Government or a future legal proceeding.
            </p>
            <a
              className="inline-block border border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-background"
              download={`${person.handle ?? person.id}-evidence-package.json`}
              href={`/api/people/${person.handle ?? person.id}/evidence-package`}
            >
              Download evidence package
            </a>
          </section>
        ) : null}

        <section className="border border-border bg-card p-5 text-card-foreground">
          <p className="font-bold leading-7 text-muted-foreground">
            This plaintiff was registered as evidence in Humanity v. Government.
            The claim is simple: governments were hired to promote the general
            welfare and spent the repair money on war.
          </p>
          <Link
            className="mt-4 inline-flex min-h-12 items-center border border-foreground bg-foreground px-5 text-sm font-black uppercase tracking-[0.14em] text-background"
            href={ROUTES.people}
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
  const representedData = await getRepresentedPersonProfileData(id);

  if (representedData) {
    return <RepresentedPersonProfile data={representedData} />;
  }

  const data = await getPersonTaskProfileData(id, userId);

  if (!data) {
    notFound();
  }

  const { openTasks, person, verifiedTasks } = data;
  const fallbackInitials = getFallbackInitials(person.displayName);
  const openSummary = aggregateTaskDelayStats(openTasks);

  const openTasksTyped = openTasks as unknown as TaskCardTask[];
  const verifiedTyped = verifiedTasks as unknown as TaskCardTask[];

  const netEconomicImpact = verifiedTyped.reduce((sum, task) => {
    const v = task.impact?.selectedFrame?.expectedEconomicValueUsdBase;
    return v != null ? sum + v : sum;
  }, 0);
  const netLivesSaved = verifiedTyped.reduce((sum, task) => {
    const d = task.impact?.selectedFrame?.expectedDalysAvertedBase;
    return d != null ? sum + d / YEARS_PER_AVERTED_DEATH : sum;
  }, 0);

  const hasAnyTasks = openTasks.length > 0 || verifiedTyped.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
        <header className="space-y-4">
          <nav className="text-sm font-bold">
            <Link className="underline underline-offset-4" href={ROUTES.tasks}>
              Tasks
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{person.displayName}</span>
          </nav>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shrink-0 border-2 border-foreground bg-muted">
              <Avatar.Image
                alt={person.displayName}
                src={person.image ?? undefined}
              />
              <Avatar.Fallback className="bg-foreground font-black text-background">
                {fallbackInitials || "?"}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                {person.displayName}
              </h1>
              {person.currentAffiliation ? (
                <p className="text-sm font-bold text-muted-foreground">
                  {person.currentAffiliation}
                </p>
              ) : null}
              {isPublicOfficialPerson(person) ? (
                <p className="text-xs font-bold text-muted-foreground">
                  Job: Promote General Welfare (i.e. maximize median health and
                  wealth)
                </p>
              ) : null}
            </div>
          </div>
          {person.bio?.trim() ? (
            <p className="max-w-4xl text-sm font-bold text-muted-foreground">
              {person.bio}
            </p>
          ) : null}
        </header>

        {/* Stats — overdue clock + net completed impact */}
        {hasAnyTasks ? (
          <section className="space-y-2">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Employee Performance
            </h2>
            <div className="grid gap-3 border-2 border-foreground bg-background p-4 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Overdue Tasks
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {openTasks.length.toLocaleString("en-US")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  DALYs Lost From Delay
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCompactCount(openSummary.currentHumanLivesLost)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Economic Loss From Delay
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCompactCurrency(
                    openSummary.currentEconomicValueUsdLost,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Net Lives Saved
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCompactCount(netLivesSaved)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Net $ Saved
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCompactCurrency(netEconomicImpact)}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {openTasksTyped.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Overdue Tasks
            </h2>
            <SortableTaskList
              tasks={openTasksTyped}
              variant="signer"
              hideAssignee
            />
          </section>
        ) : null}

        {verifiedTyped.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Completed Tasks
            </h2>
            <SortableTaskList
              tasks={verifiedTyped}
              variant="completed"
              defaultSortKey="verifiedAt"
              defaultSortDir="desc"
              hideAssignee
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
