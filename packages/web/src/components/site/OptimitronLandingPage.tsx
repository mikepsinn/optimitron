import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { ComparativeEffectivenessSection } from "@/components/dfda/ComparativeEffectivenessSection";
import { OutcomeLabelsSection } from "@/components/dfda/OutcomeLabelsSection";
import { ArmorySection } from "@/components/landing/ArmorySection";
import { DecisionMatrixSection } from "@/components/landing/DecisionMatrixSection";
import { DemoVideoSection } from "@/components/landing/DemoVideoSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { GovernmentReportCardPreview } from "@/components/landing/GovernmentReportCardPreview";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowToWinSection } from "@/components/landing/HowToWinSection";
import { InvisibleGraveyardSection } from "@/components/landing/InvisibleGraveyardSection";
import { OptimalPolicyPreview } from "@/components/landing/OptimalPolicyPreview";
import { OptimizedGovernanceSection } from "@/components/landing/OptimizedGovernanceSection";
import { PleaseSelectAnEarthSection } from "@/components/landing/PleaseSelectAnEarthSection";
import { PostVoteReminders } from "@/components/landing/PostVoteReminders";
import { TLDRSection } from "@/components/landing/TLDRSection";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { WishocracyPreview } from "@/components/landing/WishocracyPreview";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";

interface OptimitronLandingPageProps {
  lateEmployeeProgramTask: TaskCardTask | null;
  lateEmployeeTasks: TaskCardTask[];
}

export function OptimitronLandingPage({
  lateEmployeeProgramTask,
  lateEmployeeTasks,
}: OptimitronLandingPageProps) {
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

      {/* ── 19. Final CTA — countdown + ticker ── */}
      <FinalCTASection />
    </div>
  );
}
