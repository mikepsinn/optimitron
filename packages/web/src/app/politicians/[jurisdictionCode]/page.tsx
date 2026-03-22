import type { Metadata } from "next";
import { getLatestAggregateScores } from "@/lib/aggregate-alignment.server";
import { ScoreboardDashboard } from "@/components/scoreboard/ScoreboardDashboard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alignment Scoreboard | Optimitron",
  description:
    "Public scoreboard showing how often your politicians vote the way citizens want. Updated automatically. Excuses not included.",
};

interface ScoreboardPageProps {
  params: Promise<{ jurisdictionCode: string }>;
}

export default async function ScoreboardJurisdictionPage({
  params,
}: ScoreboardPageProps) {
  const { jurisdictionCode } = await params;
  const data = await getLatestAggregateScores(jurisdictionCode);

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="border-4 border-primary bg-background p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
            No Data Yet
          </h1>
          <p className="mt-4 text-base font-bold text-foreground">
            No aggregate scores computed yet for jurisdiction{" "}
            <span className="font-black text-foreground">{jurisdictionCode}</span>.
            Run pairwise comparisons on{" "}
            <Link
              href="/wishocracy"
              className="font-black text-brutal-pink underline hover:text-foreground"
            >
              /wishocracy
            </Link>{" "}
            to generate data.
          </p>
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            Not enough humans have voted yet. Tell your friends. Or your
            enemies. Both count.
          </p>
        </div>
      </div>
    );
  }

  return <ScoreboardDashboard data={data} />;
}
