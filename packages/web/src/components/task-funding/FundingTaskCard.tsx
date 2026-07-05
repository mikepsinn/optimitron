import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatPercent,
  formatRatio,
  formatUsd,
  formatUsdCents,
} from "@/lib/task-funding/format";
import type { getTaskFundingStatus } from "@/lib/task-funding/status.server";
import { getTaskPath } from "@/lib/routes";

type TaskFundingStatusResult = Awaited<ReturnType<typeof getTaskFundingStatus>>;

export interface FundingTaskCardProps {
  /** Optional one-line pitch shown under the title (task impactStatement). */
  blurb?: string | null;
  denominatorCents: bigint;
  expectedValueUsd: number;
  /** Extra action button rendered beside the fund button (e.g. a vote link). */
  extraAction?: ReactNode;
  fundButtonLabel?: string;
  funding: TaskFundingStatusResult | null;
  fundingSource: "target" | "compensation";
  /** 1-based rank badge; omitted hides the badge column. */
  index?: number;
  score: number;
  taskId: string;
  title: string;
}

export function FundingTaskCard({
  blurb,
  denominatorCents,
  expectedValueUsd,
  extraAction,
  fundButtonLabel = "Fund task",
  funding,
  fundingSource,
  index,
  score,
  taskId,
  title,
}: FundingTaskCardProps) {
  const percent =
    funding && funding.targetUsdCents > 0n
      ? Math.min(100, funding.percentToTarget)
      : 0;
  const fundingHref = `${getTaskPath(taskId)}#funding`;

  return (
    <article
      className={
        index === undefined
          ? "grid gap-4 border border-foreground p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          : "grid gap-4 border border-foreground p-4 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
      }
    >
      {index === undefined ? null : (
        <div className="flex size-12 items-center justify-center border border-foreground text-lg font-black">
          {index}
        </div>
      )}
      <div className="min-w-0 space-y-4">
        <div>
          <h3 className="text-xl font-black leading-tight">
            <Link
              className="underline-offset-4 hover:underline"
              href={fundingHref}
            >
              {title}
            </Link>
          </h3>
          {blurb ? (
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              {blurb}
            </p>
          ) : null}
          <dl className="mt-3 grid gap-2 text-sm font-bold text-muted-foreground sm:grid-cols-3">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em]">
                Return per $1
              </dt>
              <dd className="text-foreground">{formatRatio(score)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em]">
                Task value
              </dt>
              <dd className="text-foreground">{formatUsd(expectedValueUsd)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.12em]">
                {fundingSource === "target" ? "Price" : "Worker payout"}
              </dt>
              <dd className="text-foreground">
                {formatUsdCents(denominatorCents)}
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <div className="h-2 border border-foreground">
            <div
              className="h-full bg-foreground"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            {funding
              ? funding.committedUsdCents > 0n
                ? `${formatUsdCents(funding.committedUsdCents)} committed - ${formatPercent(percent)}`
                : "Opening day. Be the first."
              : "Pays a verified worker after completion"}
          </p>
        </div>
      </div>
      <div
        className={
          index === undefined
            ? "flex flex-wrap items-start gap-2 lg:justify-end"
            : "flex flex-wrap items-start gap-2 sm:col-start-2 lg:col-start-auto lg:justify-end"
        }
      >
        <Link
          className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          href={fundingHref}
        >
          {fundButtonLabel}
        </Link>
        {extraAction}
      </div>
    </article>
  );
}
