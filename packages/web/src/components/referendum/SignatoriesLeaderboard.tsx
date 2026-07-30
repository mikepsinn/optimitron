import Link from "next/link";
import { defaultButtonClassName } from "@/components/ui/default-button";
import { fmtRaw } from "@optimitron/data/parameters";
import { HelpCircle } from "lucide-react";
import { Avatar } from "@/components/retroui/Avatar";
import { VoteCounterSplit } from "@/components/referendum/VoteCounterSplit";
import { SignatoryVisibilityPanel } from "@/components/referendum/SignatoryVisibilityPanel";
import { ImpactExplainer } from "@/components/shared/ImpactExplainer";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { formatNumberShort } from "@/lib/formatters";
import type {
  PublicSignatoriesPage,
  PublicSignatoryEntry,
} from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR } from "@/lib/treaty-share-flow-parameters";
import { cn } from "@/lib/utils";
import {
  getUserDisplayAvatar,
  getUserDisplayHref,
  getUserDisplayName,
} from "@/lib/user-display";

interface SignatoriesLeaderboardProps {
  className?: string;
  publicSignatories: PublicSignatoriesPage | null;
  limit?: number;
  showEmptyState?: boolean;
  showIntro?: boolean;
  /**
   * Route path used for pagination links (e.g. "/", "/treaty"). The component
   * appends `?signersPage=N#signatories`. Defaults to "/".
   */
  pagePathname?: string;
  /**
   * Optional vote-count split rendered above the leaderboard header. Pass when
   * you want the PRD-mandated Living/Memorial/Total split alongside the ranked
   * list. Omit to keep the leaderboard standalone.
   */
  voteCounterSplit?: {
    liveVotes: number;
    memorialVotes: number;
    representedVotes?: number;
  };
}

export function SufferingPreventedMetric({
  className,
  hoursPrevented,
  label,
  name,
  compactOnMobile = false,
  showLabel = true,
  valueClassName,
}: {
  compactOnMobile?: boolean;
  className?: string;
  hoursPrevented: number;
  label?: string;
  name: string;
  showLabel?: boolean;
  valueClassName?: string;
}) {
  const fullValue = fmtRaw(hoursPrevented);
  const compactValue = formatNumberShort(hoursPrevented, {
    significantDigits: 3,
  });

  return (
    <ImpactExplainer
      className={cn(
        "flex min-w-[7rem] flex-col items-end justify-center px-1 py-0.5 text-right text-foreground hover:underline",
        className,
      )}
      label={`Explain hours of suffering prevented impact math for ${name}`}
      showFullAnalysisLink={false}
    >
      <span
        className={cn(
          "text-xl font-black uppercase tabular-nums leading-none sm:text-2xl",
          valueClassName,
        )}
      >
        {compactOnMobile ? (
          <>
            <span className="sm:hidden">{compactValue}</span>
            <span className="hidden sm:inline">{fullValue}</span>
          </>
        ) : (
          fullValue
        )}
      </span>
      {showLabel ? (
        <span className="mt-1 max-w-[8rem] text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-muted-foreground sm:max-w-none sm:text-[11px]">
          {label ?? "Hours of suffering prevented"}
        </span>
      ) : null}
    </ImpactExplainer>
  );
}

export function SignatoriesLeaderboard({
  className,
  publicSignatories,
  limit,
  pagePathname = "/",
  showEmptyState = false,
  showIntro = true,
  voteCounterSplit,
}: SignatoriesLeaderboardProps) {
  const currentUserSigner = publicSignatories?.currentUserSigner ?? null;
  const currentUserStatus = publicSignatories?.currentUserStatus ?? null;
  const signatories = publicSignatories?.signatories ?? [];
  const totalCount = publicSignatories?.totalCount ?? 0;
  const page = publicSignatories?.page ?? 1;
  const totalPages = publicSignatories?.totalPages ?? 1;
  const displayedSignatories =
    limit === undefined ? signatories : signatories.slice(0, limit);

  if (displayedSignatories.length === 0 && !currentUserStatus) {
    if (showEmptyState) {
      return <SignatoriesEmptyState />;
    }
    return null;
  }

  return (
    <section id="signatories" className={cn("mt-16 pt-12", className)}>
      <div className="mx-auto max-w-4xl">
        {showIntro ? (
          <div className="mb-8 space-y-4 text-center">
            <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl md:text-5xl">
              The People Who Ended War and Disease
            </h2>
            <p className="mx-auto max-w-3xl text-center text-lg leading-9 text-[var(--treaty-ink-soft)] [font-family:var(--v0-font-libre-baskerville)] sm:text-[1.2rem]">
              Allowing billions of people to suffer and die from disease so
              humanity can preserve its{" "}
              <ParameterValue
                className="font-black text-[var(--treaty-ink)]"
                figures={3}
                param={FLOW_NUCLEAR_WINTER_OVERKILL_FACTOR}
              />
              -apocalypse mass-murder capacity is a conscious act of barbaric
              mass cruelty. Like slavery, it will be allowed to continue until
              enough people are brave enough to publicly state that it is
              morally wrong and incredibly stupid. These are those people.
            </p>
            {voteCounterSplit ? (
              <VoteCounterSplit
                className="mx-auto max-w-md text-left"
                liveVotes={voteCounterSplit.liveVotes}
                linkMemorialToPeople
                memorialVotes={voteCounterSplit.memorialVotes}
                representedVotes={voteCounterSplit.representedVotes}
                showMemorialIcon={false}
              />
            ) : null}
          </div>
        ) : null}

        {currentUserStatus ? (
          <SignatoryVisibilityPanel status={currentUserStatus} />
        ) : null}

        {totalCount > 0 ? (
          <div className="overflow-hidden border-2 border-foreground bg-background text-foreground">
            <div className="grid grid-cols-1 gap-2 border-b-2 border-foreground px-4 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:tracking-[0.14em]">
              <span>Signatory</span>
              <ImpactExplainer
                className="inline-flex max-w-[13rem] items-start gap-1 text-left text-inherit hover:text-foreground sm:max-w-none sm:items-center sm:justify-end sm:text-right"
                label="Explain hours of suffering prevented impact math"
                showFullAnalysisLink={false}
              >
                <span className="whitespace-normal leading-tight">
                  HOURS OF SUFFERING PREVENTED
                </span>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </ImpactExplainer>
            </div>

            <ol>
              {displayedSignatories.map((entry) => (
                <SignatoryRow
                  key={entry.id}
                  entry={entry}
                  highlighted={
                    entry.kind === "human" &&
                    currentUserSigner?.user.id === entry.user.id
                  }
                  editHref={
                    entry.kind === "human" &&
                    currentUserSigner?.user.id === entry.user.id
                      ? ROUTES.profile
                      : undefined
                  }
                />
              ))}
            </ol>
          </div>
        ) : (
          <SignatoriesEmptyState />
        )}

        {limit === undefined && totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm font-black uppercase text-foreground">
            {page > 1 ? (
              <Link
                href={`${pagePathname}?signersPage=${page - 1}#signatories`}
                className="border-2 border-foreground bg-background px-3 py-2 transition-colors hover:bg-background"
              >
                ← Prev
              </Link>
            ) : (
              <span className="border-2 border-foreground bg-background px-3 py-2 text-muted-foreground">
                ← Prev
              </span>
            )}
            <span className="border-2 border-foreground bg-background px-3 py-2">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`${pagePathname}?signersPage=${page + 1}#signatories`}
                className="border-2 border-foreground bg-background px-3 py-2 transition-colors hover:bg-background"
              >
                Next →
              </Link>
            ) : (
              <span className="border-2 border-foreground bg-background px-3 py-2 text-muted-foreground">
                Next →
              </span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SignatoryRow({
  entry,
  highlighted = false,
  editHref,
}: {
  entry: PublicSignatoryEntry;
  highlighted?: boolean;
  editHref?: string;
}) {
  const isHuman = entry.kind === "human";
  const name = isHuman
    ? getUserDisplayName(entry.user)
    : entry.organization.name;
  const avatar = isHuman
    ? getUserDisplayAvatar(entry.user)
    : entry.organization.squareLogoUrl;
  const href = isHuman
    ? getUserDisplayHref(entry.user)
    : getSafeHttpUrl(entry.organization.website);
  const donationHref = isHuman
    ? null
    : getSafeHttpUrl(entry.organization.donationUrl);
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const identity = (
    <>
      <Avatar className="h-11 w-11 shrink-0 border-2 border-foreground bg-background sm:h-12 sm:w-12">
        {avatar ? <Avatar.Image alt={name} src={avatar} /> : null}
        <Avatar.Fallback className="bg-muted text-xs font-black uppercase text-foreground">
          {initials}
        </Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            #{entry.rank}
          </span>
          {href && !editHref && !isHuman ? (
            <a
              href={href}
              rel="noreferrer"
              className="truncate text-sm font-black text-foreground underline-offset-4 hover:underline [font-family:var(--v0-font-libre-baskerville)] sm:text-lg"
            >
              {name}
            </a>
          ) : (
            <p className="truncate text-sm font-black text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-lg">
              {name}
            </p>
          )}
          {editHref ? (
            <Link
              href={editHref}
              className={`${defaultButtonClassName} min-h-8 px-2 py-0.5 text-[10px]`}
            >
              Edit Profile
            </Link>
          ) : null}
        </div>
        {donationHref ? (
          <a
            href={donationHref}
            rel="noreferrer"
            className="mt-1 inline-block text-xs font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Donate to {name}
          </a>
        ) : null}
      </div>
    </>
  );

  const inner = (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-4",
        href && !editHref && "hover:bg-background",
        highlighted && "bg-background",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {href && !editHref && isHuman ? (
          <Link
            href={href}
            className="flex min-w-0 items-center gap-3 hover:underline"
          >
            {identity}
          </Link>
        ) : (
          identity
        )}
      </div>

      <SufferingPreventedMetric
        className="min-w-[4.75rem] sm:min-w-[7rem]"
        compactOnMobile
        hoursPrevented={entry.hoursPrevented}
        name={name}
        showLabel={false}
        valueClassName="text-lg sm:text-2xl"
      />
    </div>
  );

  return (
    <li className="border-t-2 border-foreground first:border-t-0">{inner}</li>
  );
}

function SignatoriesEmptyState() {
  return (
    <div className="border-2 border-foreground bg-background p-8 text-center text-foreground">
      <p className="text-lg font-black">No public signatories yet.</p>
      <p className="mt-2 text-sm font-bold text-muted-foreground">
        A treaty without signatories is paperwork. Fix that.
      </p>
    </div>
  );
}

function getSafeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
