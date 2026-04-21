import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { ReferendumSiteHome } from "@/components/site/ReferendumSiteHome";
import { authOptions } from "@/lib/auth";
import { getSiteMetadata } from "@/lib/metadata";
import { getReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { getSiteFromHost } from "@/lib/site";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowToWinSection } from "@/components/landing/HowToWinSection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { LandingFAQSection } from "@/components/landing/LandingFAQSection";
import { TLDRSection } from "@/components/landing/TLDRSection";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { InvisibleGraveyardSection } from "@/components/landing/InvisibleGraveyardSection";
import { WishocracyPreview } from "@/components/landing/WishocracyPreview";
import { PleaseSelectAnEarthSection } from "@/components/landing/PleaseSelectAnEarthSection";
import { DecisionMatrixSection } from "@/components/landing/DecisionMatrixSection";
import { GovernmentReportCardPreview } from "@/components/landing/GovernmentReportCardPreview";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { OutcomeLabelsSection } from "@/components/dfda/OutcomeLabelsSection";
import { ComparativeEffectivenessSection } from "@/components/dfda/ComparativeEffectivenessSection";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { OptimalPolicyPreview } from "@/components/landing/OptimalPolicyPreview";
import { OptimizedGovernanceSection } from "@/components/landing/OptimizedGovernanceSection";
import { PostVoteReminders } from "@/components/landing/PostVoteReminders";
import { ArmorySection } from "@/components/landing/ArmorySection";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import { getTaskDetailData } from "@/lib/tasks.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import { TAGLINES } from "@/lib/messaging";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));

  if (site.primaryReferendumSlug) {
    const content = getReferendumSiteContent(site.contentKey);
    return getSiteMetadata(site, content.metadata.home, "/");
  }

  return {
    title: "Optimitron — The Earth Optimization Game",
    description: `${TAGLINES.gameObjective} ${TAGLINES.everyPlayerWins}`,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Optimitron — The Earth Optimization Game",
      description: TAGLINES.gameObjective,
      type: "website",
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  if (site.primaryReferendumSlug) {
    const resolvedParams = (await searchParams) ?? {};
    const rawPage = resolvedParams.signersPage;
    const signersPageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
    const signersPage = signersPageParam
      ? Math.max(1, parseInt(signersPageParam, 10) || 1)
      : 1;
    const session = await getServerSession(authOptions);
    const data = await getReferendumSiteHomeData(site, {
      signersPage,
      currentUserId: session?.user?.id ?? null,
    });
    if (!data) {
      return (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-black uppercase">{site.name}</h1>
          <p className="mt-4 font-bold text-muted-foreground">
            Referendum not found.
          </p>
        </section>
      );
    }

    return <ReferendumSiteHome data={data} />;
  }

  const treatyParentTask = await getTaskDetailData(TREATY_PARENT_TASK_ID, null);
  const lateEmployeeProgramTask =
    (treatyParentTask?.task ?? null) as TaskCardTask | null;
  const lateEmployeeTasks = (treatyParentTask?.task.childTasks ??
    []) as unknown as TaskCardTask[];

  return (
    <div>
      {/* ── 1. Hero — Game name + objective ── */}
      <HeroSection />

      {/* ── 2. Demo Video — show don't tell ── */}
      <DemoVideoSection />

      {/* ── 3. TLDR — It's 2 buttons, tell your friends, done ── */}
      <TLDRSection />

      {/* ── 4. Vote — The core game action ── */}
      <TreatyVoteSection />

      {/* ── 4b. President Management System — reminder composer ── */}
      <SectionContainer bgColor="yellow" padding="lg">
        <Container size="lg">
          <div className="text-center">
            <TasksRootIntro />
            <div className="mx-auto mt-8 max-w-2xl text-left">
              <PostVoteReminders />
            </div>
          </div>
          {lateEmployeeProgramTask ? (
            <div className="mt-12">
              <ProgramTaskSection
                task={lateEmployeeProgramTask}
                subtasks={lateEmployeeTasks}
                subtasksTitle={
                  lateEmployeeTasks.length > 0
                    ? `↳ ${lateEmployeeTasks.length} employees have overdue tasks`
                    : undefined
                }
              />
            </div>
          ) : null}
        </Container>
      </SectionContainer>

      {/* ── 5. Scoreboard — 2 numbers, that's the game ── */}
      <HowToWinSection />

      {/* ── 6. What Happens If Nobody Plays — Stakes ── */}
      <WhyPlaySection />

      {/* ── 7. Every Policy Graded A-F — causal inference demo ── */}
      <OptimalPolicyPreview />

      {/* ── 9. Wishocracy — allocate your budget ── */}
      <WishocracyPreview />

      {/* ── 10. The Invisible Graveyard — boss reveal ── */}
      <InvisibleGraveyardSection />

      {/* ── 11. Outcome Labels — what dFDA produces ── */}
      <OutcomeLabelsSection />

      {/* ── 12. Treatment Rankings — interactive demo ── */}
      <ComparativeEffectivenessSection />

      {/* ── 13. Please Select an Earth — world select screen ── */}
      <PleaseSelectAnEarthSection />

      {/* ── 14. Decision Matrix — dominant strategy proof ── */}
      <DecisionMatrixSection />

      {/* ── 15. Worst Players: Governments ── */}
      <GovernmentReportCardPreview />

      {/* ── 16. Worst Players: Politicians ── */}
      <SectionContainer bgColor="foreground" borderPosition="top" padding="lg">
        <Container>
          <SectionHeader
            title="Worst Players: Politicians"
            subtitle="How your representatives actually vote vs what you actually wanted. The receipts."
            size="lg"
            className="text-background [&_p]:text-background"
          />
          <PoliticianScorecardTable
            scorecards={POLITICIAN_SCORECARDS.map((p) => ({
              bioguideId: p.id.toUpperCase(),
              name: p.name,
              party: p.party,
              state: p.district ?? "",
              chamber: p.chamber ?? "",
              militaryDollarsVotedFor: p.destructiveDollarsVotedFor,
              clinicalTrialDollarsVotedFor: p.clinicalTrialDollarsVotedFor,
              ratio: p.militaryToTrialsRatio,
            }))}
            systemWideRatio={SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO}
            limit={10}
          />
          <div className="mt-8 text-center">
            <GameCTA href="/governments/US/politicians" variant="cyan">
              See All Politicians
            </GameCTA>
          </div>
        </Container>
      </SectionContainer>

      {/* ── 17. Optimized Governance — the agencies ── */}
      <OptimizedGovernanceSection />

      {/* ── 18. The Armory — player tools ── */}
      <ArmorySection />

      {/* ── 19. Frequently Asked Objections ── */}
      <LandingFAQSection />

      {/* ── 20. Final CTA — countdown + ticker ── */}
      <FinalCTASection />
    </div>
  );
}
