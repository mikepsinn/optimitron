import { headers } from "next/headers";
import type { ReactNode } from "react";
import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard";
import { GovernmentLeaderboard } from "@/components/shared/GovernmentLeaderboard";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import { getRouteMetadata } from "@/lib/metadata";
import { getReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { scoreboardLink } from "@/lib/routes";
import { getSiteConfig, getSiteFromHeaders } from "@/lib/site";

export const metadata = getRouteMetadata(scoreboardLink);

const politicianScorecards = POLITICIAN_SCORECARDS.map((politician) => ({
  bioguideId: politician.id.toUpperCase(),
  name: politician.name,
  party: politician.party,
  state: politician.district ?? "",
  chamber: politician.chamber ?? "",
  militaryDollarsVotedFor: politician.destructiveDollarsVotedFor,
  clinicalTrialDollarsVotedFor: politician.clinicalTrialDollarsVotedFor,
  ratio: politician.militaryToTrialsRatio,
}));

export default async function ScoreboardPage() {
  const hdrs = await headers();
  const requestSite = getSiteFromHeaders(hdrs);
  const signatorySite = requestSite.primaryReferendumSlug
    ? requestSite
    : getSiteConfig("warOnDisease");
  const referendumData = await getReferendumSiteHomeData(signatorySite);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-12 space-y-4 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
          Humanity&apos;s Scoreboard
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Who Is Winning and Losing
        </h1>
        <p className="mx-auto max-w-3xl text-lg font-bold leading-8 text-muted-foreground">
          The worst governments, the worst politicians, and the humans
          collecting signatures for the 1% Treaty. Civilization is easier to
          debug when the table has names.
        </p>
      </section>

      <ScoreboardSection
        title="Worst Governments"
        description="Ranked by military spending per dollar of government clinical trial funding. Higher is worse. This is not subtle."
      >
        <GovernmentLeaderboard limit={10} compact />
      </ScoreboardSection>

      <ScoreboardSection
        title="Worst Politicians"
        description="The same ranking from the Optimitron landing page: dollars each representative voted toward weapons for every dollar toward testing medicines."
      >
        <PoliticianScorecardTable
          scorecards={politicianScorecards}
          systemWideRatio={SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO}
          limit={10}
          rankModeLabels={{
            worst: "Worst Politicians",
            leastBad: "Least Bad Politicians",
          }}
        />
      </ScoreboardSection>

      <ScoreboardSection
        title="Signature Leaderboard"
        description="Top signatories by verified treaty signatures attributed to them. This is the part where the species notices it has thumbs."
      >
        <SignatoriesLeaderboard
          className="mt-0 pt-0"
          limit={10}
          pagePathname={scoreboardLink.href}
          publicSignatories={referendumData?.publicSignatories ?? null}
          showEmptyState
          showIntro={false}
        />
      </ScoreboardSection>
    </div>
  );
}

function ScoreboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-14 border-t-2 border-foreground pt-10 last:mb-0">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-base font-bold leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
