import Link from "next/link";
import { fmtRaw } from "@optimitron/data/parameters";
import { HelpCircle } from "lucide-react";
import { Avatar } from "@/components/retroui/Avatar";
import { ImpactExplainer } from "@/components/shared/ImpactExplainer";
import type { PublicSignersPage } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  getUserDisplayAvatar,
  getUserDisplayHref,
  getUserDisplayName,
} from "@/lib/user-display";

interface SignatoriesLeaderboardProps {
  publicSigners: PublicSignersPage;
  /**
   * Route path used for pagination links (e.g. "/", "/treaty"). The component
   * appends `?signersPage=N#signatories`. Defaults to "/".
   */
  pagePathname?: string;
}

export function SignatoriesLeaderboard({
  publicSigners,
  pagePathname = "/",
}: SignatoriesLeaderboardProps) {
  const { currentUserSigner, signers, totalCount, page, pageSize, totalPages } = publicSigners;
  if (totalCount === 0) {
    return null;
  }

  const leaderboardSigners = currentUserSigner
    ? [currentUserSigner, ...signers.filter((entry) => entry.user.id !== currentUserSigner.user.id)].slice(
        0,
        pageSize,
      )
    : signers;

  return (
    <section id="signatories" className="mt-16 border-t-2 border-foreground pt-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 space-y-4 text-center">
          <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl md:text-5xl">
            The People Who Ended War and Disease
          </h2>
          <p className="mx-auto max-w-3xl text-center text-lg leading-9 text-[var(--treaty-ink-soft)] [font-family:var(--v0-font-libre-baskerville)] sm:text-[1.2rem]">
            War is a barbaric mass cruelty like slavery. It will be allowed to continue until enough people are brave enough to publicly state that it is morally wrong and incredibly stupid. These are those people.
          </p>
        </div>

        <div className="overflow-hidden border-2 border-foreground bg-background text-foreground">
          <div className="hidden border-b-2 border-foreground px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.8fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] sm:gap-4">
            <span>✍️ SIGNATORY</span>
            <ImpactExplainer
              className="inline-flex items-center justify-end gap-1 rounded-sm text-right text-inherit hover:text-foreground"
              label="Explain inverse kills impact math"
              showFullAnalysisLink={false}
            >
              <span>💀 INVERSE KILLS</span>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </ImpactExplainer>
            <ImpactExplainer
              className="inline-flex items-center justify-end gap-1 rounded-sm text-right text-inherit hover:text-foreground"
              label="Explain hours of suffering prevented impact math"
              showFullAnalysisLink={false}
            >
              <span>⏳ HOURS OF SUFFERING PREVENTED</span>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </ImpactExplainer>
            <span className="text-right">👥 VOTERS RECRUITED</span>
          </div>

          <ol>
            {leaderboardSigners.map((entry) => (
              <SignatoryRow
                key={entry.id}
                entry={entry}
                highlighted={currentUserSigner?.user.id === entry.user.id}
                editHref={currentUserSigner?.user.id === entry.user.id ? ROUTES.profile : undefined}
              />
            ))}
          </ol>
        </div>

        {totalPages > 1 ? (
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
  entry: PublicSignersPage["signers"][number];
  highlighted?: boolean;
  editHref?: string;
}) {
  const name = getUserDisplayName(entry.user);
  const avatar = getUserDisplayAvatar(entry.user);
  const href = getUserDisplayHref(entry.user);
  const initials = name
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
          <p className="truncate text-sm font-black text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:text-lg">
            {name}
          </p>
          {editHref ? (
            <Link
              href={editHref}
              className="inline-flex items-center rounded-full border border-foreground bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-muted"
            >
              Edit Profile
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );

  const inner = (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 pt-4 pb-0 transition-colors sm:grid sm:grid-cols-[minmax(0,1.8fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] sm:items-center sm:gap-4 sm:px-5 sm:py-4",
        href && !editHref && "hover:bg-background",
        highlighted && "bg-background",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {href && !editHref ? (
          <Link href={href} className="flex min-w-0 items-center gap-3 hover:underline">
            {identity}
          </Link>
        ) : (
          identity
        )}
      </div>

      <div className="-mx-4 grid grid-cols-3 border-t-2 border-foreground sm:mx-0 sm:contents sm:border-t-0">
        <ImpactExplainer
          className="inline-flex min-h-[4.75rem] w-full items-center justify-center border-r-2 border-foreground bg-background px-2 py-2 text-center text-[10px] font-black uppercase leading-tight tracking-[0.08em] text-foreground hover:bg-background sm:min-h-0 sm:justify-end sm:rounded-sm sm:border-0 sm:bg-transparent sm:px-1 sm:py-0.5 sm:text-right sm:text-lg sm:tracking-normal sm:hover:underline"
          label={`Explain inverse kills impact math for ${name}`}
          showFullAnalysisLink={false}
        >
          <span className="sm:hidden">💀 {fmtRaw(entry.livesSaved)} Inverse Kills</span>
          <span className="hidden sm:inline">{fmtRaw(entry.livesSaved)}</span>
        </ImpactExplainer>
        <ImpactExplainer
          className="inline-flex min-h-[4.75rem] w-full items-center justify-center border-r-2 border-foreground bg-background px-2 py-2 text-center text-[10px] font-black uppercase leading-tight tracking-[0.08em] text-foreground hover:bg-background sm:min-h-0 sm:justify-end sm:rounded-sm sm:border-0 sm:bg-transparent sm:px-1 sm:py-0.5 sm:text-right sm:text-lg sm:tracking-normal sm:hover:underline"
          label={`Explain hours of suffering prevented impact math for ${name}`}
          showFullAnalysisLink={false}
        >
          <span className="sm:hidden">⏳ {fmtRaw(entry.hoursPrevented)} Hours of SUffering Prevented</span>
          <span className="hidden sm:inline">{fmtRaw(entry.hoursPrevented)}</span>
        </ImpactExplainer>
        <div className="inline-flex min-h-[4.75rem] w-full items-center justify-center bg-background px-2 py-2 text-center text-[10px] font-black uppercase leading-tight tracking-[0.08em] text-foreground sm:min-h-0 sm:block sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-right sm:text-lg sm:tracking-normal">
          <span className="sm:hidden">👥 {entry.referredYesCount.toLocaleString()} Voters Recruited</span>
          <span className="hidden sm:inline">{entry.referredYesCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <li className="border-t-2 border-foreground first:border-t-0">
      {inner}
    </li>
  );
}
