import Link from "next/link";
import { BrutalCard } from "@/components/ui/brutal-card";
import { formatCompactCurrency } from "@/lib/tasks/accountability";
import type { TaskContext } from "@/lib/tasks/task-context";

interface TaskPerformanceReviewProps {
  context: TaskContext;
}

const TONE_CLASS: Record<string, string> = {
  red: "bg-brutal-red text-brutal-red-foreground",
  green: "bg-brutal-green text-brutal-green-foreground",
  cyan: "bg-background text-foreground",
  pink: "bg-foreground text-background",
  yellow: "bg-background text-foreground",
};

export function TaskPerformanceReview({ context }: TaskPerformanceReviewProps) {
  const review = context.performanceReview;
  if (!review) return null;

  const maxBar =
    review.comparisonBars?.reduce(
      (max, bar) => Math.max(max, Math.abs(bar.valueUsd)),
      0,
    ) ?? 0;

  return (
    <BrutalCard bgColor="background" padding="lg">
      <div className="space-y-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground">
          Performance Review
        </p>

        {review.comparisonBars && review.comparisonBars.length > 0 ? (
          <div className="space-y-2">
            {review.comparisonBars.map((bar) => {
              const width = maxBar > 0 ? (Math.abs(bar.valueUsd) / maxBar) * 100 : 0;
              return (
                <div key={bar.label} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm font-black uppercase">
                    <span>{bar.label}</span>
                    <span>{formatCompactCurrency(bar.valueUsd)}</span>
                  </div>
                  <div className="h-4 border-2 border-foreground bg-background">
                    <div
                      className={`h-full ${TONE_CLASS[bar.color] ?? "bg-foreground"}`}
                      style={{ width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {review.ratio ? (
          <p className="text-lg font-black uppercase">
            Ratio: {review.ratio.left.toLocaleString()} : {review.ratio.right.toLocaleString()}{" "}
            <span className="text-sm font-bold text-muted-foreground">
              ({review.ratio.label})
            </span>
          </p>
        ) : null}

        {review.perCitizen && review.perCitizen.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs font-black uppercase text-muted-foreground">Per citizen</p>
            <ul className="space-y-1 text-sm font-bold">
              {review.perCitizen.map((row) => (
                <li key={row.label}>
                  {formatCompactCurrency(row.valueUsd)}/yr {row.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {review.narrative ? (
          <p className="text-sm font-bold">{review.narrative}</p>
        ) : null}

        {review.firedFromWendys != null ? (
          <div className="flex flex-wrap gap-4 text-sm font-bold">
            {review.firedFromWendys != null ? (
              <p>
                Would be fired from Wendy&apos;s:{" "}
                <span className="font-black uppercase">
                  {review.firedFromWendys ? "Yes" : "No"}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        {review.scorecardUrl ? (
          <Link
            className="inline-block text-xs font-black uppercase underline underline-offset-4"
            href={review.scorecardUrl}
          >
            View Full Scorecard →
          </Link>
        ) : null}
      </div>
    </BrutalCard>
  );
}
