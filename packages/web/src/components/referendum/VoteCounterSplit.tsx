import Link from "next/link";
import { formatCount } from "@/lib/format-count";
import { ROUTES } from "@/lib/routes";

interface VoteCounterSplitProps {
  /** Memorial-vote count: deceased people whose representatives "voted" for them. */
  memorialVotes: number;
  /** Living official YES votes (people who clicked the button themselves). */
  liveVotes: number;
  /**
   * Optional represented-but-living count (people couldn't click the button
   * themselves but their proxy voted). When present, renders a fourth row.
   */
  representedVotes?: number;
  /**
   * If true, wrap the memorial line in a Link to /people so people can scroll
   * through the Invisible Graveyard. Default false to keep the component
   * passive when memorial linkage isn't desired.
   */
  linkMemorialToPeople?: boolean;
  className?: string;
}

/**
 * Vote counter rendered in the PRD-mandated split format (TODO.md:1213-1217).
 *
 *   Living votes:     12,847
 *   Memorial votes:    3,291  👻
 *   Total voices:     16,138
 *
 * The ghost emoji is required next to the memorial line — PRD: "The ghost
 * emoji is not optional. WISHONIA insists." Use this anywhere a campaign
 * total is surfaced so the dead remain visible alongside the living.
 */
export function VoteCounterSplit({
  className = "",
  liveVotes,
  linkMemorialToPeople = false,
  memorialVotes,
  representedVotes,
}: VoteCounterSplitProps) {
  const total = liveVotes + memorialVotes + (representedVotes ?? 0);

  const memorialLine = (
    <span className="font-bold">
      {formatCount(memorialVotes)}{" "}
      <span aria-hidden="true">👻</span>
    </span>
  );

  return (
    <dl
      className={`grid gap-2 border border-border bg-card p-4 text-card-foreground ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <dt className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Living votes
        </dt>
        <dd className="text-2xl font-black tabular-nums">{formatCount(liveVotes)}</dd>
      </div>
      {representedVotes !== undefined ? (
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <dt className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            Represented humans
          </dt>
          <dd className="text-2xl font-black tabular-nums">
            {formatCount(representedVotes)}
          </dd>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <dt className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Memorial votes
        </dt>
        <dd className="text-2xl font-black tabular-nums">
          {linkMemorialToPeople ? (
            <Link className="underline-offset-4 hover:underline" href={ROUTES.people}>
              {memorialLine}
            </Link>
          ) : (
            memorialLine
          )}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-1">
        <dt className="text-xs font-black uppercase tracking-[0.16em]">
          Total voices
        </dt>
        <dd className="text-3xl font-black tabular-nums">{formatCount(total)}</dd>
      </div>
    </dl>
  );
}
