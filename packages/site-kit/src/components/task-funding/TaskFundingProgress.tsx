import { TaskFundingTargetStatus } from "@optimitron/db";
import {
  formatRelativeTime,
  getTaskFundingBackerWall,
  getTaskFundingStatus,
  type TaskFundingStatus,
} from "../../lib/task-funding/status.server";

export type FundingStatusType = TaskFundingStatus;

export interface TaskFundingProgressProps {
  taskId: string;
  status?: FundingStatusType;
  showBreakdown?: boolean;
  showUnitBreakdown?: boolean;
}

function formatUsdCents(cents: bigint) {
  if (cents === 0n) return "$0";

  const isNegative = cents < 0n;
  const absoluteCents = isNegative ? -cents : cents;
  const dollars = Number(absoluteCents) / 100;
  const prefix = isNegative ? "-" : "";

  if (absoluteCents >= 100_000_000_000n) {
    return `${prefix}${new Intl.NumberFormat("en-US", {
      currency: "USD",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 1,
      notation: "compact",
      style: "currency",
    }).format(dollars)}`;
  }

  return `${prefix}${new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: absoluteCents % 100n === 0n ? 0 : 2,
    style: "currency",
  }).format(dollars)}`;
}

function formatPercent(percent: number) {
  if (Number.isInteger(percent)) return `${percent}%`;
  return `${percent.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatQuantity(value: { toString(): string }) {
  return value.toString().replace(/\.0+$/, "");
}

function pluralizeSupporters(count: number) {
  return count === 1 ? "1 supporter" : `${count} supporters`;
}
// User-facing labels for TaskFundingTargetStatus. Without this the Status box
// renders the raw enum ("THRESHOLD_MET"), underscore and all.
const FUNDING_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  THRESHOLD_MET: "Threshold met",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function formatFundingStatus(status: string) {
  return FUNDING_STATUS_LABEL[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export async function TaskFundingProgress({
  taskId,
  status,
  showBreakdown = false,
  showUnitBreakdown = false,
}: TaskFundingProgressProps) {
  const [fundingStatus, backers] = await Promise.all([
    status ?? getTaskFundingStatus(taskId),
    getTaskFundingBackerWall(taskId),
  ]);
  const now = new Date();
  const thresholdMet =
    fundingStatus.status === TaskFundingTargetStatus.THRESHOLD_MET;

  return (
    <section className="space-y-5 border-2 border-foreground bg-background p-5 font-bold text-foreground sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="font-black text-3xl leading-tight sm:text-5xl">
            {formatUsdCents(fundingStatus.committedUsdCents)} of{" "}
            {formatUsdCents(fundingStatus.targetUsdCents)} paid or pledged
          </p>
          <p className="text-base font-black">
            {formatUsdCents(fundingStatus.remainingUsdCents)} remaining -{" "}
            {formatPercent(fundingStatus.percentToTarget)}
          </p>
        </div>
        {thresholdMet ? (
          <span className="inline-flex border-2 border-foreground px-3 py-2 text-xs font-black uppercase">
            Threshold met
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 text-sm font-black uppercase sm:grid-cols-2">
        <div className="border-2 border-foreground p-3">
          <span className="block text-muted-foreground">Status</span>
          <span>{formatFundingStatus(fundingStatus.status)}</span>
        </div>
        <div className="border-2 border-foreground p-3">
          <span className="block text-muted-foreground">Supporters</span>
          <span>{pluralizeSupporters(fundingStatus.pledgerCount)}</span>
        </div>
      </div>

      {backers.length > 0 ? (
        <ul
          className="space-y-1 text-sm font-bold"
          data-task-funding-backer-wall
        >
          {backers.map((backer, index) => (
            <li key={`${backer.name}-${backer.at.toISOString()}-${index}`}>
              {backer.name} — {backer.kind} —{" "}
              <span data-volatile="backer age">
                {formatRelativeTime(now, backer.at)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {showBreakdown ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="border-2 border-foreground p-3">
            <dt className="font-black uppercase text-muted-foreground">
              Individuals
            </dt>
            <dd className="text-2xl font-black">{fundingStatus.individualCount}</dd>
          </div>
          <div className="border-2 border-foreground p-3">
            <dt className="font-black uppercase text-muted-foreground">
              Organizations
            </dt>
            <dd className="text-2xl font-black">
              {fundingStatus.organizationCount}
            </dd>
          </div>
        </dl>
      ) : null}

      {showUnitBreakdown ? (
        <div className="space-y-2">
          <h3 className="text-sm font-black uppercase">Unit breakdown</h3>
          {fundingStatus.unitBreakdown.length > 0 ? (
            <ul className="space-y-2">
              {fundingStatus.unitBreakdown.map((unit) => (
                <li
                  className="grid gap-2 border-2 border-foreground p-3 text-sm font-bold sm:grid-cols-[1fr_auto_auto]"
                  key={unit.unitKey}
                >
                  <span className="font-black">{unit.unitKey}</span>
                  <span>{formatQuantity(unit.totalQuantity)} units</span>
                  <span>
                    {formatUsdCents(unit.totalCommittedCents)} paid or pledged
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-2 border-foreground p-3 text-sm font-bold">
              No task funding yet.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
