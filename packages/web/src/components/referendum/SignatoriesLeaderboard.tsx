import Link from "next/link";
import { fmtRaw, VOTER_LIVES_SAVED } from "@optimitron/data/parameters";
import type { PublicSignersPage } from "@/lib/referendum-site.server";
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
  const { signers, totalCount, page, totalPages } = publicSigners;
  if (totalCount === 0) {
    return null;
  }

  const baseLivesCollective = totalCount * VOTER_LIVES_SAVED.value;

  return (
    <section id="signatories" className="mt-16 border-t-2 border-foreground pt-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            Signatories
          </h2>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {totalCount.toLocaleString()} humans personally saving {fmtRaw(baseLivesCollective)} lives.
          </p>
        </div>

        <ol className="space-y-3">
          {signers.map((entry) => (
            <SignatoryRow key={entry.id} entry={entry} />
          ))}
        </ol>

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm font-black uppercase">
            {page > 1 ? (
              <Link
                href={`${pagePathname}?signersPage=${page - 1}#signatories`}
                className="hover:underline"
              >
                ← Prev
              </Link>
            ) : (
              <span className="opacity-30">← Prev</span>
            )}
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`${pagePathname}?signersPage=${page + 1}#signatories`}
                className="hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span className="opacity-30">Next →</span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function rankBadgeColor(rank: number): string {
  if (rank === 1) return "bg-brutal-pink text-brutal-pink-foreground";
  if (rank === 2) return "bg-brutal-cyan text-brutal-cyan-foreground";
  if (rank === 3) return "bg-brutal-yellow text-brutal-yellow-foreground";
  return "bg-foreground text-background";
}

function SignatoryRow({
  entry,
}: {
  entry: PublicSignersPage["signers"][number];
}) {
  const name = getUserDisplayName(entry.user);
  const avatar = getUserDisplayAvatar(entry.user);
  const href = getUserDisplayHref(entry.user);
  const initial = name.charAt(0).toUpperCase() || "?";

  const inner = (
    <div className="flex items-center gap-3 border-2 border-foreground bg-background p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <span
        className={`inline-flex h-10 w-10 flex-none items-center justify-center border-2 border-foreground text-sm font-black uppercase ${rankBadgeColor(entry.rank)}`}
      >
        #{entry.rank}
      </span>
      <span className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden border-2 border-foreground bg-muted text-base font-black uppercase">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={name} src={avatar} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black">{name}</p>
        <p className="mt-0.5 text-xs font-bold text-muted-foreground">
          <span className="text-foreground">{fmtRaw(entry.livesSaved)}</span> lives saved
          <span className="mx-2 opacity-40">·</span>
          <span className="text-foreground">{fmtRaw(entry.hoursPrevented)}</span> hours prevented
        </p>
        {entry.referredYesCount > 0 ? (
          <p className="mt-1 text-xs font-black uppercase text-brutal-pink">
            +{entry.referredYesCount} signers referred
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <li>{href ? <Link href={href}>{inner}</Link> : inner}</li>
  );
}
