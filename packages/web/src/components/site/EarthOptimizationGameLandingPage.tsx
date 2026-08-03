import {
  POLITICIAN_SCORECARDS,
  SYSTEM_WIDE_MILITARY_TO_TRIALS_RATIO,
} from "@optimitron/data/datasets/us-politician-scorecards";
import { Suspense } from "react";
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
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { TLDRSection } from "@/components/landing/TLDRSection";
import TreatyVoteSection from "@/components/landing/TreatyVoteSection";
import { WhyPlaySection } from "@/components/landing/WhyPlaySection";
import { WishocracyPreview } from "@/components/landing/WishocracyPreview";
import { MachineDiagram } from "@/components/eos-retro/MachineDiagram";
import "@/components/eos-retro/eos-retro.css";
import { PoliticianScorecardTable } from "@/components/shared/PoliticianScorecardTable";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import type { TaskCardTask } from "@/components/tasks/task-card";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import { Container } from "@/components/ui/container";
import { GameCTA } from "@/components/ui/game-cta";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { ROUTES } from "@/lib/routes";
import { getTaskDetailData } from "@/lib/tasks.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";

function toTaskCardTask(task: TaskCardTask): TaskCardTask {
  return {
    activeClaimCount: task.activeClaimCount,
    assigneeAffiliationSnapshot: task.assigneeAffiliationSnapshot,
    assigneeOrganization: task.assigneeOrganization
      ? {
          contactEmail: task.assigneeOrganization.contactEmail,
          id: task.assigneeOrganization.id,
          name: task.assigneeOrganization.name,
          slug: task.assigneeOrganization.slug,
          squareLogoUrl: task.assigneeOrganization.squareLogoUrl,
          type: task.assigneeOrganization.type,
          website: task.assigneeOrganization.website,
        }
      : null,
    assigneePerson: task.assigneePerson
      ? {
          countryCode: task.assigneePerson.countryCode,
          currentAffiliation: task.assigneePerson.currentAffiliation,
          displayName: task.assigneePerson.displayName,
          handle: task.assigneePerson.handle,
          id: task.assigneePerson.id,
          image: task.assigneePerson.image,
          isPublicFigure: task.assigneePerson.isPublicFigure,
          sourceRef: task.assigneePerson.sourceRef,
        }
      : null,
    category: task.category,
    claimPolicy: task.claimPolicy,
    communicationEndpoints: task.communicationEndpoints?.map((endpoint) => ({
      email: endpoint.email,
      id: endpoint.id,
      instructions: endpoint.instructions,
      isPrimary: endpoint.isPrimary,
      kind: endpoint.kind,
      label: endpoint.label,
      priority: endpoint.priority,
      url: endpoint.url,
    })),
    completedAt: task.completedAt,
    contextJson: task.contextJson,
    currentImpactEstimateSet: task.currentImpactEstimateSet
      ? { assumptionsJson: task.currentImpactEstimateSet.assumptionsJson }
      : null,
    description: task.description,
    dueAt: task.dueAt,
    estimatedEffortHours: task.estimatedEffortHours,
    id: task.id,
    impact: task.impact
      ? {
          costPerDalyUsd: task.impact.costPerDalyUsd,
          selectedFrame: task.impact.selectedFrame,
          selectedMetrics: task.impact.selectedMetrics,
        }
      : undefined,
    interestTags: task.interestTags,
    isPublic: task.isPublic,
    maxClaims: task.maxClaims,
    parentTask: task.parentTask
      ? { id: task.parentTask.id, title: task.parentTask.title }
      : null,
    primaryEndpoint: task.primaryEndpoint
      ? {
          email: task.primaryEndpoint.email,
          instructions: task.primaryEndpoint.instructions,
          kind: task.primaryEndpoint.kind,
          label: task.primaryEndpoint.label,
          url: task.primaryEndpoint.url,
        }
      : null,
    recommendationScore: task.recommendationScore,
    roleTitle: task.roleTitle,
    skillTags: task.skillTags,
    sortOrder: task.sortOrder,
    sourceUrl: task.sourceUrl,
    status: task.status,
    taskKey: task.taskKey,
    title: task.title,
    verifiedAt: task.verifiedAt,
    viewerHasClaim: task.viewerHasClaim,
  };
}

async function PresidentManagementSection() {
  const treatyParentTask = await getTaskDetailData(
    TREATY_PARENT_TASK_ID,
    null,
  ).catch((error: unknown) => {
    console.error("Unable to load the optional president task section", error);
    return null;
  });
  const rawProgramTask = (treatyParentTask?.task ?? null) as
    | (TaskCardTask & { childTasks?: TaskCardTask[] })
    | null;
  const lateEmployeeProgramTask = rawProgramTask
    ? toTaskCardTask(rawProgramTask)
    : null;
  const allLateEmployeeTasks = rawProgramTask?.childTasks ?? [];
  const lateEmployeeTasks = allLateEmployeeTasks.map(toTaskCardTask);

  return (
    <SectionContainer bgColor="background" borderPosition="both" padding="lg">
      <Container size="lg">
        <div className="text-center">
          <TasksRootIntro headingLevel="h2" />
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <TreatyReminderComposer />
          </div>
        </div>
        {lateEmployeeProgramTask ? (
          <div className="mt-12">
            <ProgramTaskSection
              task={lateEmployeeProgramTask}
              subtasks={lateEmployeeTasks}
              subtasksTitle={
                allLateEmployeeTasks.length > 0
                  ? `↳ ${allLateEmployeeTasks.length} employees have overdue tasks`
                  : undefined
              }
            />
          </div>
        ) : null}
      </Container>
    </SectionContainer>
  );
}

const exampleLeafTasks = [
  {
    executor: "Any eligible voter",
    task: "Vote for the 1% Treaty",
  },
  {
    executor: "Someone who already voted",
    task: "Recruit two more voters",
  },
  {
    executor: "Authorized governments only",
    task: "Ratify the treaty",
  },
] as const;

function EarthOptimizationTaskSystemSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="both"
      id="decentralized-to-do-list"
      padding="lg"
    >
      <Container size="lg">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              The decentralized to-do list for humanity
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
              One planet. One task tree.
            </h2>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8">
              Optimitron starts with the two outcomes that count: median healthy
              life expectancy and median real after-tax income. It decomposes
              every mission until each leaf is work a human or AI agent can
              actually finish.
            </p>
            <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
              Blocked, unavailable, or impossible work stays out of the
              actionable queue. Legally required deadlines go first. Everything
              else is ranked by expected value per hour and routed to a capable
              executor.
            </p>
            <div className="mt-8">
              <GameCTA href={ROUTES.tasksTree} variant="outline">
                Open the task tree
              </GameCTA>
            </div>
          </div>

          <div
            className="border border-foreground"
            aria-label="Example task decomposition"
          >
            <div className="bg-foreground px-5 py-4 text-background">
              <p className="text-xs font-black uppercase tracking-[0.16em]">
                Root goal
              </p>
              <p className="mt-1 text-2xl font-black uppercase">
                Optimize Earth
              </p>
            </div>
            <div className="ml-5 border-l border-foreground sm:ml-8">
              {[
                ["Outcome", "Make the median human healthier and wealthier"],
                ["Mission", "End war and disease"],
                ["Program", "Pass the 1% Treaty"],
              ].map(([label, title]) => (
                <div
                  className="grid gap-1 border-b border-foreground/20 px-5 py-4 sm:grid-cols-[6rem_1fr]"
                  key={label}
                >
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </span>
                  <span className="font-black uppercase">{title}</span>
                </div>
              ))}
              <div className="px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Executable leaves
                </p>
                <ul className="mt-3 divide-y divide-foreground/20 border-y border-foreground/20">
                  {exampleLeafTasks.map(({ executor, task }) => (
                    <li
                      className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-baseline"
                      key={task}
                    >
                      <span className="font-bold">{task}</span>
                      <span className="text-sm text-muted-foreground sm:text-right">
                        {executor}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="border-t border-foreground bg-foreground px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-background">
              Deadlines first · then expected value per hour · routed to the
              right executor
            </p>
          </div>
        </div>
      </Container>
    </SectionContainer>
  );
}

function LovingTakeoverSection() {
  return (
    <SectionContainer
      bgColor="background"
      borderPosition="both"
      id="loving-takeover"
      padding="lg"
    >
      <Container size="lg">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            From recommendation to power
          </p>
          <h2 className="mt-4 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            The Loving Takeover
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold leading-8">
            Calculating better laws is not enough. The plan is to buy voting
            shares in the companies whose lobbying writes government budgets,
            use shareholder rights to redirect that lobbying toward
            Optimitron&apos;s highest-value recommendations, and keep the
            shares.
          </p>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-muted-foreground">
            Better policy grows the economy those companies sell into. The value
            increase funds the next turn of the machine. Greed and altruism
            finally point at the same button.
          </p>
        </div>

        <div className="eos-retro mt-12 border border-foreground p-4 sm:p-8">
          <MachineDiagram fitWidth />
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <GameCTA href="/tasks/loving-takeover#funding">
            Fund the Loving Takeover
          </GameCTA>
          <GameCTA
            external
            href="https://manual.warondisease.org/knowledge/appendix/loving-takeover.html"
            variant="outline"
          >
            Read the analysis
          </GameCTA>
        </div>
      </Container>
    </SectionContainer>
  );
}

export function EarthOptimizationGameLandingPage({
  earthOptimizationServices = false,
}: {
  earthOptimizationServices?: boolean;
}) {
  return (
    <div>
      {/* ── 1. Hero — Game name + objective ── */}
      <HeroSection earthOptimizationServices={earthOptimizationServices} />

      {/* ── 2. Vote — The core game action ── */}
      <TreatyVoteSection />

      {/* ── 3. TLDR — Two buttons, tell your friends, done ── */}
      <TLDRSection />

      {/* ── 4. Scoreboard — two numbers, that's the game ── */}
      <HowToWinSection />

      {/* ── 5. Demo video — show, don't tell ── */}
      <DemoVideoSection />

      {earthOptimizationServices ? (
        <EarthOptimizationTaskSystemSection />
      ) : null}

      {/* ── 6. What happens if nobody plays — stakes ── */}
      <WhyPlaySection />

      {/* ── 7. Every Policy Graded A-F — causal inference demo ── */}
      <OptimalPolicyPreview />

      {/* ── 8. Wishocracy — allocate your budget ── */}
      <WishocracyPreview />

      {/* ── 9. The Invisible Graveyard — treatment bottlenecks ── */}
      <InvisibleGraveyardSection />

      {/* ── 10. Outcome Labels — what dFDA produces ── */}
      <OutcomeLabelsSection />

      {/* ── 11. Treatment Rankings — interactive demo ── */}
      <ComparativeEffectivenessSection />

      {/* ── 12. Please Select an Earth — world select screen ── */}
      <PleaseSelectAnEarthSection />

      {/* ── 13. Decision Matrix — prize claims in either outcome ── */}
      <DecisionMatrixSection />

      {/* ── 14. Worst Players: Governments ── */}
      <GovernmentReportCardPreview />

      {/* ── 15. Worst Players: Politicians ── */}
      <SectionContainer bgColor="foreground" borderPosition="top" padding="lg">
        <Container>
          <SectionHeader
            title="Worst Players: Politicians"
            subtitle="How your representatives actually vote vs what humans actually wanted."
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
            hideControls
          />
          <div className="mt-8 text-center">
            <GameCTA href="/governments/US/politicians" variant="cyan">
              See All Politicians
            </GameCTA>
          </div>
        </Container>
      </SectionContainer>

      {/* ── 16. President Management — streamed after the core game ── */}
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="min-h-24"
            data-visual-state="animating"
          />
        }
      >
        <PresidentManagementSection />
      </Suspense>

      {/* ── 17. Optimized Governance — the agencies ── */}
      <OptimizedGovernanceSection />

      {earthOptimizationServices ? <LovingTakeoverSection /> : null}

      {/* ── 18. The Armory — player tools ── */}
      <ArmorySection />

      {/* ── 19. Final CTA — countdown + ticker ── */}
      <FinalCTASection />
    </div>
  );
}
