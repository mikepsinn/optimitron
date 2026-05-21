import type { ReactNode } from "react";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";

export interface TaskFundingPublicSupportersProps {
  taskId: string;
  limit?: number;
  status?: "ACTIVE" | "ALL";
  emptyState?: ReactNode;
}

function clampLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) return 20;
  return Math.max(0, Math.min(100, Math.trunc(limit ?? 20)));
}

function formatUsdCents(cents: bigint) {
  if (cents === 0n) return "$0";

  const dollars = Number(cents) / 100;
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: cents % 100n === 0n ? 0 : 2,
    style: "currency",
  }).format(dollars);
}

function getSupporterName(name: string | null) {
  return name?.trim() || "Public supporter";
}

export async function TaskFundingPublicSupporters({
  taskId,
  limit,
  emptyState,
}: TaskFundingPublicSupportersProps) {
  const fundingStatus = await getTaskFundingStatus(taskId, {
    includeSupporters: true,
    limit: clampLimit(limit),
  });
  const supporters = fundingStatus.publicSupporters ?? [];

  if (supporters.length === 0) {
    return (
      <div className="border-2 border-foreground bg-background p-4 font-bold text-foreground">
        {emptyState ?? "No public supporters yet."}
      </div>
    );
  }

  return (
    <section className="border-2 border-foreground bg-background p-4 font-bold text-foreground sm:p-6">
      <ul
        className={
          supporters.length > 4
            ? "grid gap-3 sm:grid-cols-2"
            : "space-y-3"
        }
      >
        {supporters.map((supporter, index) => (
          <li
            className="border-2 border-foreground p-3"
            data-task-funding-supporter
            key={`${supporter.publicNameSnapshot ?? "supporter"}-${supporter.createdAt.toISOString()}-${index}`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-black">
                  {getSupporterName(supporter.publicNameSnapshot)}
                </p>
                <p className="text-xs font-black uppercase text-muted-foreground">
                  {supporter.pledgerKind === "ORGANIZATION"
                    ? "Organization"
                    : "Individual"}
                </p>
              </div>
              <p className="font-black">
                {formatUsdCents(supporter.committedAmountCents)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
