import type { Metadata } from "next";
import Link from "next/link";
import {
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskStatus,
} from "@optimitron/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { TaskAssignee } from "@/components/tasks/task-assignee";
import { type TaskCardTask } from "@/components/tasks/task-card";
import { TaskCommentFeed } from "@/components/tasks/task-comment-feed";
import { TaskDescription } from "@/components/tasks/task-description";
import { TaskHeroStats } from "@/components/tasks/task-hero-stats";
import { TaskMetadataTags } from "@/components/tasks/task-metadata-tags";
import { TaskSectionNav } from "@/components/tasks/task-section-nav";
import { getUserDisplayLabel } from "@/lib/user-display";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { TaskCompleteForm } from "@/components/tasks/TaskCompleteForm";
import { TaskMilestoneEditor } from "@/components/tasks/TaskMilestoneEditor";
import { TaskShareButtons } from "@/components/tasks/TaskShareButtons";
import { TaskVerifyForm } from "@/components/tasks/TaskVerifyForm";
import { TaskAssigneeCard } from "@/components/tasks/blocks/TaskAssigneeCard";
import { TaskBlockerCard } from "@/components/tasks/blocks/TaskBlockerCard";
import { TaskContextList } from "@/components/tasks/blocks/TaskContextList";
import { TaskCostOfDelay } from "@/components/tasks/blocks/TaskCostOfDelay";
import { TaskCurrentActivities } from "@/components/tasks/blocks/TaskCurrentActivities";
import { TaskDifficultyStrip } from "@/components/tasks/blocks/TaskDifficultyStrip";
import { TaskOverdueClock } from "@/components/tasks/blocks/TaskOverdueClock";
import { TaskPerformanceReview } from "@/components/tasks/blocks/TaskPerformanceReview";
import { TaskRemindEmployee } from "@/components/tasks/blocks/TaskRemindEmployee";
import { TaskUnlocks } from "@/components/tasks/blocks/TaskUnlocks";
import { TaskWhileYouRead } from "@/components/tasks/blocks/TaskWhileYouRead";
import { Button } from "@/components/retroui/Button";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { BrutalCard } from "@/components/ui/brutal-card";
import { authOptions } from "@/lib/auth";
import {
  buildTaskShareText,
  formatCompactCount,
  formatCompactCurrency,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getSignInPath, tasksLink, ROUTES } from "@/lib/routes";
import { canTaskAcceptMoreClaims } from "@/lib/tasks/rank-tasks";
import { readTaskContext } from "@/lib/tasks/task-context";
import { getTaskAncestors, getTaskDetailData } from "@/lib/tasks.server";
import {
  getTaskActivityTimeline,
  getTaskCommentFeed,
} from "@/lib/tasks/task-comments.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import { getWishoniaUserId } from "@/lib/wishonia.server";

function getClaimPolicyLabel(policy: TaskClaimPolicy) {
  switch (policy) {
    case TaskClaimPolicy.ASSIGNED_ONLY:
      return "assigned";
    case TaskClaimPolicy.OPEN_SINGLE:
      return "single-active";
    case TaskClaimPolicy.OPEN_MANY:
      return "open-many";
  }
}

function formatDueDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMilestoneStatusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getTaskDetailData(id, null);

  if (!data) {
    return {
      title: "Task Detail | Optimitron",
    };
  }

  const { task } = data;
  const delayStats = getTaskDelayStats(task);
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const description = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });

  return {
    title: `${task.title} | ${tasksLink.label} | Optimitron`,
    description,
    openGraph: {
      title: task.title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: task.title,
      description,
    },
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user.id ?? null;
  const [data, commentFeed, activityTimeline, wishoniaUserId, ancestors] = await Promise.all([
    getTaskDetailData(id, userId),
    getTaskCommentFeed({ taskId: id, sort: "new", limit: 100, currentUserId: userId }),
    getTaskActivityTimeline(id, 50),
    getWishoniaUserId().catch(() => null),
    getTaskAncestors(id),
  ]);

  if (!data) {
    notFound();
  }

  const { task, viewer, viewerClaim } = data;
  const hasOtherPersonAssignee =
    task.assigneePerson != null && task.assigneePerson.id !== viewer?.personId;
  const canShowClaimButton = !hasOtherPersonAssignee;
  const canClaim = canTaskAcceptMoreClaims({
    activeClaimCount: task.activeClaimCount,
    claimPolicy: task.claimPolicy,
    difficulty: task.difficulty,
    estimatedEffortHours: task.estimatedEffortHours,
    interestTags: task.interestTags,
    maxClaims: task.maxClaims,
    skillTags: task.skillTags,
    status: task.status,
  });
  const assignedToViewer =
    viewer?.personId != null && task.assigneePerson?.id === viewer.personId;
  const signInHref = getSignInPath(`${ROUTES.tasks}/${task.id}`);
  const reviewableClaims = task.claims.filter(
    (claim) => claim.status === TaskClaimStatus.COMPLETED,
  );
  const delayStats = getTaskDelayStats(task);
  const context = readTaskContext(task.contextJson);
  const targetLabel =
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? task.title;
  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const completedMilestoneCount = task.milestones.filter(
    (milestone) => milestone.status === "COMPLETED" || milestone.status === "VERIFIED",
  ).length;
  const provenanceArtifacts =
    task.currentImpactEstimateSet?.sourceArtifacts?.length
      ? task.currentImpactEstimateSet.sourceArtifacts
      : task.sourceArtifacts;

  // Per-second rate hints for live counters — computed once from delay stats.
  const delayDalysPerDay = task.impact?.selectedFrame?.delayDalysLostPerDayBase ?? null;
  const delayEconPerDay =
    task.impact?.selectedFrame?.delayEconomicValueUsdLostPerDayBase ?? null;
  const ratePerSecond = {
    deaths: delayDalysPerDay != null ? delayDalysPerDay / 86400 / 40 : null,
    usd: delayEconPerDay != null ? delayEconPerDay / 86400 : null,
  };

  // Compute total deaths from delay as DALYs-per-day × days / 40 years-per-death.
  // Falls back to delayStats.currentHumanLivesLost if the seeder populated the
  // explicit lives metric (it generally doesn't for signer tasks).
  const computedDeathsFromDelay =
    delayDalysPerDay != null && delayStats.currentDelayDays > 0
      ? (delayDalysPerDay * delayStats.currentDelayDays) / 40
      : null;
  const deathsFromDelay =
    delayStats.currentHumanLivesLost != null && delayStats.currentHumanLivesLost > 0
      ? delayStats.currentHumanLivesLost
      : computedDeathsFromDelay;

  // Reminder template tokens resolved server-side.
  const personHandle = task.assigneePerson?.handle ?? null;
  const reminderTokens: Record<string, string | number | null> = {
    handle: personHandle ?? targetLabel,
    name: targetLabel,
    daysOverdue: delayStats.currentDelayDays.toLocaleString(),
    deathsLocked: formatCompactCount(deathsFromDelay ?? 0),
    moneyDestroyed: formatCompactCurrency(delayStats.currentEconomicValueUsdLost ?? 0),
    sufferingHours: formatCompactCount(delayStats.currentSufferingHoursLost ?? 0),
    salaryUsd:
      context.assigneeProfile?.salaryUsdPerYear != null
        ? formatCompactCurrency(context.assigneeProfile.salaryUsdPerYear)
        : "",
    budgetUsd:
      context.assigneeProfile?.budgetUsdPerYear != null
        ? formatCompactCurrency(context.assigneeProfile.budgetUsdPerYear)
        : "",
    taskTitle: task.title,
    taskUrl: `/tasks/${task.id}`,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-black uppercase">
          <Link className="underline underline-offset-4" href={ROUTES.tasks}>
            Tasks
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-2">
              <span>/</span>
              <Link
                className="underline underline-offset-4"
                href={`/tasks/${ancestor.id}`}
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="text-muted-foreground">{task.title}</span>
        </nav>

        <TaskSectionNav
          links={[
            { id: "overview", label: "Overview" },
            ...(task.childTasks.length > 0
              ? [{ id: "subtasks", label: "Subtasks", count: task.childTasks.length }]
              : []),
            {
              id: "discussion",
              label: "Discussion",
              count: commentFeed.comments.filter((c) => !c.deletedAt).length,
            },
          ]}
        />

        <section id="overview" className="scroll-mt-32 space-y-4">
          <TaskMetadataTags
            category={task.category}
            status={task.status}
            delayStats={delayStats}
            dueAt={task.dueAt}
          />
          <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
            {task.title}
          </h1>
          <TaskHeroStats
            effortHours={task.estimatedEffortHours}
            dueAt={task.dueAt}
            attributionShare={
              context.assigneeProfile?.budgetUsdPerYear != null
                ? context.assigneeProfile.budgetUsdPerYear / 2_720_000_000_000
                : 1
            }
          />
          <div className="max-w-5xl">
            <TaskDescription markdown={task.description} />
          </div>
          {task.isPublic ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Send reminder:
              </span>
              <TaskShareButtons
                taskId={task.id}
                shareText={shareText}
                taskTitle={task.title}
                variant="icon"
              />
            </div>
          ) : null}
        </section>

        <TaskBlockerCard context={context} />
        <TaskAssigneeCard
          assigneePerson={task.assigneePerson}
          assigneeOrganization={task.assigneeOrganization}
          context={context}
        />
        <TaskDifficultyStrip taskTitle={task.title} context={context} />
        <TaskOverdueClock dueAt={task.dueAt} />
        <TaskCostOfDelay
          context={context}
          delayStats={delayStats}
          ratePerSecond={ratePerSecond}
          tokens={reminderTokens}
        />
        <TaskUnlocks context={context} />
        <TaskPerformanceReview context={context} />
        <TaskRemindEmployee
          reminder={context.reminder}
          assigneeProfile={context.assigneeProfile}
          tokens={reminderTokens}
        />
        <TaskContextList context={context} tokens={reminderTokens} />
        <TaskCurrentActivities context={context} />
        <TaskWhileYouRead
          deathsPerSecond={ratePerSecond.deaths}
          usdPerSecond={ratePerSecond.usd}
        />

        {/* Claim / action card — existing generic flow */}
        <BrutalCard bgColor="background" padding="lg">
          <div className="space-y-6">
            <TaskAssignee
              person={task.assigneePerson}
              organization={task.assigneeOrganization}
              roleTitle={task.roleTitle}
              affiliationSnapshot={task.assigneeAffiliationSnapshot}
            />
            <div className="flex flex-wrap items-center gap-3 border-t-2 border-foreground/20 pt-4">
              {task.status !== TaskStatus.VERIFIED && canShowClaimButton ? (
                <TaskClaimButton
                  canClaim={canClaim}
                  signedIn={Boolean(userId)}
                  signInHref={signInHref}
                  taskId={task.id}
                  viewerHasClaim={task.viewerHasClaim}
                />
              ) : task.status !== TaskStatus.VERIFIED && hasOtherPersonAssignee ? (
                <p className="text-sm font-bold">
                  Assigned to {task.assigneePerson?.displayName}. If that&apos;s
                  you, sign in with your verified account to mark this complete.
                </p>
              ) : null}
              {!userId ? (
                <Button asChild className="font-black uppercase" variant="outline">
                  <Link href={signInHref}>Sign In</Link>
                </Button>
              ) : null}
              {viewerClaim ? (
                <span className="text-xs font-black uppercase text-brutal-pink">
                  Your claim: {viewerClaim.status.toLowerCase()}
                </span>
              ) : null}
            </div>
            {viewerClaim &&
            (viewerClaim.status === TaskClaimStatus.CLAIMED ||
              viewerClaim.status === TaskClaimStatus.IN_PROGRESS) ? (
              <TaskCompleteForm taskId={task.id} />
            ) : null}
          </div>
        </BrutalCard>

        {task.milestones.length > 0 ? (
          <BrutalCard bgColor="cyan" padding="lg">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase text-brutal-pink">
                    Milestone Tracker
                  </p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {completedMilestoneCount} of {task.milestones.length} milestones reached
                  </p>
                </div>
                <ArcadeTag>{`${completedMilestoneCount}/${task.milestones.length}`}</ArcadeTag>
              </div>
              <div className="space-y-4">
                {task.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="border-4 border-foreground bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-black uppercase">{milestone.title}</p>
                        {milestone.description ? (
                          <p className="text-sm font-bold text-muted-foreground">
                            {milestone.description}
                          </p>
                        ) : null}
                      </div>
                      <ArcadeTag>{getMilestoneStatusLabel(milestone.status)}</ArcadeTag>
                    </div>
                    {milestone.evidenceNote ? (
                      <p className="mt-3 text-sm font-bold">{milestone.evidenceNote}</p>
                    ) : null}
                    {milestone.evidenceUrl ? (
                      <Link
                        className="mt-2 inline-block text-sm font-black uppercase underline underline-offset-4"
                        href={milestone.evidenceUrl}
                        target="_blank"
                      >
                        Open Evidence
                      </Link>
                    ) : null}
                    {viewer?.isAdmin ? (
                      <TaskMilestoneEditor
                        defaultEvidenceNote={milestone.evidenceNote}
                        defaultEvidenceUrl={milestone.evidenceUrl}
                        defaultStatus={milestone.status}
                        milestoneId={milestone.id}
                        taskId={task.id}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </BrutalCard>
        ) : null}

        {task.sourceUrl || provenanceArtifacts.length > 0 ? (
          <BrutalCard bgColor="background" padding="lg">
            <div className="space-y-3">
              <p className="text-sm font-black uppercase text-brutal-pink">Sources</p>
              {task.sourceUrl ? (
                <Link
                  className="inline-block text-sm font-bold underline underline-offset-4"
                  href={task.sourceUrl}
                  target="_blank"
                >
                  Open primary source
                </Link>
              ) : null}
              {provenanceArtifacts.length > 0 ? (
                <div className="space-y-2">
                  {provenanceArtifacts.map((artifactEntry) =>
                    artifactEntry.sourceArtifact.sourceUrl ? (
                      <Link
                        key={artifactEntry.sourceArtifact.id}
                        className="block text-sm font-bold underline underline-offset-4"
                        href={artifactEntry.sourceArtifact.sourceUrl}
                        target="_blank"
                      >
                        {artifactEntry.sourceArtifact.title ?? artifactEntry.sourceArtifact.sourceKey}
                      </Link>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          </BrutalCard>
        ) : null}

        {viewer?.isAdmin &&
        task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY &&
        task.status !== TaskStatus.VERIFIED ? (
          <BrutalCard bgColor="cyan" padding="lg">
            <div className="space-y-4">
              <p className="text-sm font-black uppercase text-brutal-pink">
                Curator Verification
              </p>
              <TaskVerifyForm
                defaultEvidence={task.completionEvidence}
                helperText="For assigned-only public tasks, paste the public evidence used to mark the task complete."
                submitLabel="Verify Assigned Task"
                taskId={task.id}
              />
            </div>
          </BrutalCard>
        ) : null}

        {viewer?.isAdmin && reviewableClaims.length > 0 ? (
          <BrutalCard bgColor="green" padding="lg">
            <div className="space-y-6">
              <p className="text-sm font-black uppercase text-brutal-pink">
                Pending Claim Reviews
              </p>
              {reviewableClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="space-y-3 border-t-4 border-primary pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-lg font-black uppercase">
                    {getUserDisplayLabel(claim.user) || claim.userId}
                  </p>
                  {claim.completionEvidence ? (
                    <p className="text-sm font-bold text-muted-foreground">
                      {claim.completionEvidence}
                    </p>
                  ) : null}
                  <TaskVerifyForm
                    claimId={claim.id}
                    defaultEvidence={claim.verificationNote}
                    helperText="Add an optional verification note, then mark the claim verified."
                    submitLabel="Verify Claim"
                    taskId={task.id}
                  />
                </div>
              ))}
            </div>
          </BrutalCard>
        ) : null}

        {task.childTasks.length > 0 ? (
          <section id="subtasks" className="scroll-mt-32 space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Subtasks ({task.childTasks.length})
            </h2>
            <SortableTaskList
              tasks={task.childTasks as unknown as TaskCardTask[]}
              defaultSortKey={
                task.id === TREATY_PARENT_TASK_ID ? "assigneeBudget" : "deathsLockedIn"
              }
              defaultSortDir="desc"
              variant={task.id === TREATY_PARENT_TASK_ID ? "signer" : "default"}
            />
          </section>
        ) : null}

        <section id="discussion" className="scroll-mt-32">
          <TaskCommentFeed
          taskId={task.id}
          initialComments={commentFeed.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
            editedAt: c.editedAt instanceof Date ? c.editedAt.toISOString() : c.editedAt,
            deletedAt: c.deletedAt instanceof Date ? c.deletedAt.toISOString() : c.deletedAt,
          }))}
          initialActivities={activityTimeline.map((a) => ({
            ...a,
            createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
          }))}
          currentUserId={userId}
          wishoniaUserId={wishoniaUserId}
          signInHref={signInHref}
        />
        </section>
      </div>
    </div>
  );
}
