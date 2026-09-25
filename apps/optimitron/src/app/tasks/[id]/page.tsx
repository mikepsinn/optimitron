import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ExternalActionRequestStatus,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskCompensationCadence,
  TaskCompensationKind,
  TaskStatus,
} from "@optimitron/db";
import { getServerSession } from "next-auth";
import { TaskFundingCheckoutForm } from "@/components/task-funding/TaskFundingCheckoutForm";
import { TaskFundingProgress } from "@/components/task-funding/TaskFundingProgress";
import { DocumentReviewManagerPanel } from "@/components/tasks/document-review-manager-panel";
import { DocumentReviewReviewerPanel } from "@/components/tasks/document-review-reviewer-panel";
import { type TaskCardTask } from "@/components/tasks/task-card";
import { TaskCommentFeed } from "@/components/tasks/task-comment-feed";
import { TaskDescription } from "@/components/tasks/task-description";
import { TaskImpactTraceDisclosure } from "@/components/tasks/task-impact-trace-disclosure";
import { TaskManagementControls } from "@/components/tasks/TaskManagementControls";
import { TaskDocumentsList } from "@/components/documents/task-documents-list";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import { StripeConnectStatusPanel } from "@/components/tasks/StripeConnectStatusPanel";
import { TaskClaimButton } from "@/components/tasks/TaskClaimButton";
import { TaskCompleteForm } from "@/components/tasks/TaskCompleteForm";
import { TaskDeleteButton } from "@/components/tasks/TaskDeleteButton";
import { TaskDependenciesSection } from "@/components/tasks/TaskDependenciesSection";
import {
  TaskExternalActionApprovals,
  type ApprovableStatus,
} from "@/components/tasks/TaskExternalActionApprovals";
import { TaskShareButtons } from "@/components/tasks/TaskShareButtons";
import { TaskVerifyForm } from "@/components/tasks/TaskVerifyForm";
import { getUserDisplayLabel } from "@/lib/user-display";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildTaskShareText,
  formatCompactCount,
  formatCompactCurrency,
  formatDelayDuration,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { getSignInPath, getTaskPath, tasksLink, ROUTES } from "@/lib/routes";
import { canTaskAcceptMoreClaims } from "@/lib/tasks/rank-tasks";
import { getPersonHref } from "@/lib/person-href";
import {
  canCompleteSelfTask,
  getTaskAncestors,
  getTaskDetailData,
} from "@/lib/tasks.server";
import {
  getTaskActivityTimeline,
  getTaskCommentFeed,
} from "@/lib/tasks/task-comments.server";
import { getTaskFundingStatus } from "@/lib/task-funding/status.server";
import { getDocumentReviewPageData } from "@/lib/tasks/document-review-ui.server";
import { normalizeTaskCommunicationEndpointUrl } from "@/lib/tasks/task-communication-endpoints.server";
import { OUTBOUND_MESSAGE_OPERATION } from "@/lib/email/outbound-message-approval.server";
import { listExternalActionRequestsForHuman } from "@/lib/tasks/external-action.server";
import { TREATY_PARENT_TASK_ID } from "@/lib/tasks/task-keys";
import {
  canUserManageTask,
  TASK_NOT_FOUND_MESSAGE,
} from "@/lib/tasks/task-visibility.server";
import { getStripeConnectStatus } from "@/lib/stripe-connect.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";

// The feed/timeline helpers throw the shared "Task not found" for tasks the
// viewer can't see. The page already renders TaskAccessGate when `data` is
// null, so swallow ONLY that specific throw into an empty feed — any other
// rejection (DB error, bug in assertUserCanViewTask) should surface as a 500
// instead of a silent, indistinguishable "no comments yet".
const EMPTY_COMMENT_FEED = { comments: [], nextCursor: null, total: 0 };

function isTaskNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === TASK_NOT_FOUND_MESSAGE;
}

async function getPublicTaskPageData(id: string) {
  const [data, commentFeed, activityTimeline, ancestors] = await Promise.all([
    getTaskDetailData(id, null),
    getTaskCommentFeed({
      taskId: id,
      sort: "new",
      limit: 100,
      currentUserId: null,
    }).catch((error) => {
      if (isTaskNotFoundError(error)) return EMPTY_COMMENT_FEED;
      throw error;
    }),
    getTaskActivityTimeline(id, 50, null).catch((error) => {
      if (isTaskNotFoundError(error)) return [];
      throw error;
    }),
    getTaskAncestors(id, null),
  ]);

  return { data, commentFeed, activityTimeline, ancestors };
}

const TASK_DATE_TIME_ZONE = "UTC";

function getDisplayDate(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDueDate(value: Date | string | null | undefined) {
  const date = getDisplayDate(value);
  if (date == null) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: TASK_DATE_TIME_ZONE,
    year: "numeric",
  });
}

function formatEffortHours(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  if (value === 0) {
    return "0 minutes";
  }
  if (value < 1) {
    const minutes = Math.max(1, Math.round(value * 60));
    return `${minutes.toLocaleString("en-US")} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const rounded = Number(value.toFixed(value >= 10 ? 0 : 1));
  return `${rounded.toLocaleString("en-US")} ${rounded === 1 ? "hour" : "hours"}`;
}

// User-facing copy for the viewer's own claim status. Replaces a previous
// `formatEnumLabel(TaskClaimStatus.X)` which leaked raw enum labels
// ("Claimed", "In Progress") into user copy and prefixed with the system
// term "Your claim:". Phrasings are Vonnegut-plain.
const VIEWER_CLAIM_STATE_LABEL: Record<string, string> = {
  CLAIMED: "You picked this up.",
  IN_PROGRESS: "You're working on this.",
  COMPLETED: "You marked it done. Awaiting verification.",
  VERIFIED: "Done. Verified.",
  REJECTED: "Your work needs revision.",
  ABANDONED: "You stepped away.",
};

function getEndpointHref(
  endpoint:
    | {
        email?: string | null;
        url?: string | null;
      }
    | null
    | undefined,
) {
  if (!endpoint) {
    return null;
  }

  if (endpoint.url) {
    return normalizeTaskCommunicationEndpointUrl(endpoint.url);
  }

  if (endpoint.email) {
    return `mailto:${endpoint.email}`;
  }

  return null;
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:");
}

function getAssigneeLabel(task: {
  assigneeOrganization?: { name: string } | null;
  assigneePerson?: { displayName: string } | null;
}) {
  return (
    task.assigneePerson?.displayName ?? task.assigneeOrganization?.name ?? null
  );
}

function getAssigneeHref(task: {
  assigneePerson?: { id: string; handle?: string | null } | null;
}) {
  return task.assigneePerson ? getPersonHref(task.assigneePerson) : null;
}

function isFixedStripePaidTask(task: {
  compensationCadence?: TaskCompensationCadence | null;
  compensationKind: TaskCompensationKind;
  compensationMaxAmountMinorUnits?: bigint | null;
  compensationPaymentRails: string[];
}) {
  if (
    task.compensationKind !== TaskCompensationKind.PAID &&
    task.compensationKind !== TaskCompensationKind.BOUNTY
  ) {
    return false;
  }
  if (
    task.compensationCadence != null &&
    task.compensationCadence !== TaskCompensationCadence.FIXED
  ) {
    return false;
  }
  if (
    !task.compensationMaxAmountMinorUnits ||
    task.compensationMaxAmountMinorUnits <= 0n
  ) {
    return false;
  }
  if (task.compensationPaymentRails.length === 0) {
    return true;
  }
  return task.compensationPaymentRails.some((rail) => {
    const normalized = rail.trim().toLowerCase();
    return normalized === "stripe" || normalized === "stripe_connect";
  });
}

function getDefaultFundingAmountCents(input: {
  compensationMaxAmountMinorUnits?: bigint | null;
  remainingUsdCents?: bigint | null;
}) {
  const candidates = [
    input.remainingUsdCents,
    input.compensationMaxAmountMinorUnits,
    2500n,
  ].filter((value): value is bigint => Boolean(value && value > 0n));
  const cents = candidates[0] ?? 2500n;
  return Math.max(100, Math.min(Number(cents), 25_000));
}

function ActionLink({
  children,
  href,
  primary = false,
}: {
  children: ReactNode;
  href: string;
  primary?: boolean;
}) {
  const external = isExternalHref(href);
  const className = primary
    ? "inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
    : "inline-flex min-h-10 items-center justify-center border border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background";

  if (external) {
    return (
      <a
        className={className}
        href={href}
        rel="noreferrer"
        target={href.startsWith("mailto:") ? undefined : "_blank"}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function TaskAccessGate({
  signedIn,
  signInHref,
  viewerEmail,
}: {
  signedIn: boolean;
  signInHref: string;
  /** Empty string when the session has no email; the aside is omitted. */
  viewerEmail: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12 sm:px-6">
        <section className="w-full space-y-4 border-2 border-foreground p-6 sm:p-8">
          {signedIn ? (
            <>
              <h1 className="text-xl font-semibold leading-snug sm:text-2xl">
                You don&apos;t have access to this task
              </h1>
              <p className="text-[15px] leading-[1.6]">
                It&apos;s private, or it doesn&apos;t exist. If someone sent you
                this link, ask them to make the task public or assign it to you
                {viewerEmail ? (
                  <>
                    {" "}
                    — you&apos;re signed in as{" "}
                    <span className="font-black">{viewerEmail}</span>
                  </>
                ) : null}
                .
              </p>
              <Link
                className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                href={ROUTES.tasks}
              >
                Browse public tasks
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold leading-snug sm:text-2xl">
                Sign in to see this task
              </h1>
              <p className="text-[15px] leading-[1.6]">
                This task is private, or it doesn&apos;t exist. If it&apos;s
                yours or assigned to you, sign in and you&apos;ll land right
                back here.
              </p>
              <Link
                className="inline-flex min-h-10 items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
                href={signInHref}
              >
                Sign In
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getTaskDetailData(id, null);

  if (!data) {
    // Private and nonexistent tasks share one generic, noindexed shell so the
    // URL never reveals whether a private task exists.
    return {
      title: "Task Detail | Optimitron",
      robots: { index: false, follow: false },
    };
  }

  const { task } = data;
  const delayStats = getTaskDelayStats(task);
  const targetLabel =
    task.assigneePerson?.displayName ??
    task.assigneeOrganization?.name ??
    task.title;
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
    robots: { index: true, follow: true },
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
  const publicPageData = userId ? null : await getPublicTaskPageData(id);
  const [
    data,
    commentFeed,
    activityTimeline,
    wishoniaUserId,
    ancestors,
    viewerIsAdmin,
    documentReviewPageData,
  ] = userId
    ? await Promise.all([
        getTaskDetailData(id, userId),
        getTaskCommentFeed({
          taskId: id,
          sort: "new",
          limit: 100,
          currentUserId: userId,
        }).catch((error) => {
          if (isTaskNotFoundError(error)) return EMPTY_COMMENT_FEED;
          throw error;
        }),
        getTaskActivityTimeline(id, 50, userId).catch((error) => {
          if (isTaskNotFoundError(error)) return [];
          throw error;
        }),
        getWishoniaUserId().catch(() => null),
        getTaskAncestors(id, userId),
        prisma.user
          .findUnique({ where: { id: userId }, select: { isAdmin: true } })
          .then((u) => u?.isAdmin ?? false),
        getDocumentReviewPageData(id, userId),
      ])
    : [
        publicPageData?.data ?? null,
        publicPageData?.commentFeed ?? { comments: [], total: 0 },
        publicPageData?.activityTimeline ?? [],
        await getWishoniaUserId().catch(() => null),
        publicPageData?.ancestors ?? [],
        false,
        null,
      ];

  if (!data) {
    // Not a bare 404: a viewer without access needs a way forward, and private
    // tasks must stay indistinguishable from nonexistent ones. Both states
    // render this same gate for any id, so nothing leaks. Signed-out viewers
    // sign in and land back here; signed-in viewers learn how to ask for
    // access. Accessibility rules live in getTaskVisibilityWhere.
    return (
      <TaskAccessGate
        signedIn={Boolean(userId)}
        signInHref={getSignInPath(`${ROUTES.tasks}/${id}`)}
        viewerEmail={session?.user?.email ?? ""}
      />
    );
  }

  const { task, viewer, viewerClaim } = data;
  const isAssignedDocumentReviewer =
    documentReviewPageData?.panel.mode === "REVIEWER";
  const showDocumentReviewManager =
    documentReviewPageData?.panel.mode === "MANAGER" &&
    documentReviewPageData.setup != null &&
    (documentReviewPageData.setup.documents.length > 0 ||
      documentReviewPageData.panel.proposals.length > 0 ||
      documentReviewPageData.panel.reviews.length > 0);
  const hasOtherPersonAssignee =
    task.assigneePerson != null && task.assigneePerson.id !== viewer?.personId;
  const canShowClaimButton =
    !hasOtherPersonAssignee && !isAssignedDocumentReviewer;
  const canClaim = canTaskAcceptMoreClaims({
    activeClaimCount: task.activeClaimCount,
    claimPolicy: task.claimPolicy,
    estimatedEffortHours: task.estimatedEffortHours,
    interestTags: task.interestTags,
    maxClaims: task.maxClaims,
    skillTags: task.skillTags,
    status: task.status,
  });
  const signInHref = getSignInPath(`${ROUTES.tasks}/${task.id}`);
  const reviewableClaims = task.claims.filter(
    (claim) => claim.status === TaskClaimStatus.COMPLETED,
  );
  const viewerHasReleasableClaim =
    viewerClaim?.status === TaskClaimStatus.CLAIMED ||
    viewerClaim?.status === TaskClaimStatus.IN_PROGRESS;
  const viewerCanCompleteClaim =
    viewerHasReleasableClaim && task.status === TaskStatus.ACTIVE;
  const shouldCheckSelfCompletion =
    Boolean(userId) &&
    !viewerHasReleasableClaim &&
    !task.isPublic &&
    task.status === TaskStatus.ACTIVE &&
    !showDocumentReviewManager &&
    !isAssignedDocumentReviewer;
  const delayStats = getTaskDelayStats(task);
  const targetLabel = getAssigneeLabel(task) ?? task.title;
  const shareText = buildTaskShareText({
    currentDelayDays: delayStats.currentDelayDays,
    currentEconomicValueUsdLost: delayStats.currentEconomicValueUsdLost,
    currentHumanLivesLost: delayStats.currentHumanLivesLost,
    currentSufferingHoursLost: delayStats.currentSufferingHoursLost,
    targetLabel,
    taskTitle: task.title,
  });
  const primaryEndpoint = task.communicationEndpoints[0] ?? null;
  const primaryHref = getEndpointHref(primaryEndpoint);
  const assigneeHref = getAssigneeHref(task);
  const assigneeLabel = getAssigneeLabel(task);
  const dueLabel = formatDueDate(task.dueAt);
  const effortLabel = formatEffortHours(task.estimatedEffortHours);
  const showTaskFunding = task.isPublic && task.status === TaskStatus.ACTIVE;
  const isPaidTask = isFixedStripePaidTask(task);
  const [
    canManageTask,
    fundingStatus,
    stripeConnectStatus,
    canShowSelfCompletion,
    externalActionRequests,
  ] = await Promise.all([
    userId ? canUserManageTask(task.id, userId) : Promise.resolve(false),
    task.isPublic
      ? getTaskFundingStatus(task.id).catch(() => null)
      : Promise.resolve(null),
    isPaidTask && userId
      ? getStripeConnectStatus(userId).catch(() => null)
      : Promise.resolve(null),
    shouldCheckSelfCompletion && userId
      ? canCompleteSelfTask(task.id, userId)
      : Promise.resolve(false),
    userId
      ? listExternalActionRequestsForHuman({
          actorUserId: userId,
          operation: OUTBOUND_MESSAGE_OPERATION,
          statuses: [
            ExternalActionRequestStatus.PENDING,
            ExternalActionRequestStatus.APPROVED,
          ],
          taskId: task.id,
        })
      : Promise.resolve([]),
  ]);
  const requiresPayoutSetup =
    isPaidTask &&
    !task.viewerHasClaim &&
    (!userId || !stripeConnectStatus?.transferReady);
  const defaultFundingAmountCents = getDefaultFundingAmountCents({
    compensationMaxAmountMinorUnits: task.compensationMaxAmountMinorUnits,
    remainingUsdCents: fundingStatus?.remainingUsdCents ?? null,
  });
  // deriveImpactRatios clamps a missing cash cost to $0.0001 to stay finite,
  // which turns per-dollar ratios into nonsense ($114T per $1). Only feed the
  // checkout form ratios computed from a real positive cost.
  const fundingFrameCashCostUsd =
    task.impact.selectedFrame?.estimatedCashCostUsdBase ?? null;
  const hasRealFundingCost =
    fundingFrameCashCostUsd != null && fundingFrameCashCostUsd > 0;
  const outboundApprovals = externalActionRequests.filter(
    (request): request is typeof request & { status: ApprovableStatus } =>
      (request.status === ExternalActionRequestStatus.PENDING ||
        request.status === ExternalActionRequestStatus.APPROVED) &&
      request.expiresAt > new Date(),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link
            className="text-foreground underline underline-offset-4"
            href={ROUTES.tasks}
          >
            Tasks
          </Link>
          {(isAssignedDocumentReviewer ? [] : ancestors).map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-2">
              <span>/</span>
              <Link
                className="text-foreground underline underline-offset-4"
                href={getTaskPath(ancestor.id)}
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span>{task.title}</span>
        </nav>

        <header className="border-b border-foreground pb-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {delayStats.isOverdue ? "Overdue task" : "Task"}
              {task.isPublic ? "" : " · Private"}
            </p>
            <h1 className="max-w-4xl text-xl font-semibold leading-snug sm:text-2xl">
              {task.title}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {assigneeLabel ? (
                <span>
                  Assigned to{" "}
                  {assigneeHref ? (
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href={assigneeHref}
                    >
                      {assigneeLabel}
                    </Link>
                  ) : (
                    <span className="text-foreground">{assigneeLabel}</span>
                  )}
                </span>
              ) : null}
              {task.roleTitle ? <span>{task.roleTitle}</span> : null}
              {task.assigneeAffiliationSnapshot ? (
                <span>{task.assigneeAffiliationSnapshot}</span>
              ) : null}
              {dueLabel ? <span>Due {dueLabel}</span> : null}
              {effortLabel ? <span>~{effortLabel}</span> : null}
              {delayStats.isOverdue ? (
                <span className="font-black text-foreground">
                  {formatDelayDuration(delayStats.currentDelayDays)} overdue
                </span>
              ) : null}
            </div>
          </div>

          <section
            aria-label="Task actions"
            className="mt-6 flex flex-wrap items-center gap-2"
          >
            {primaryHref ? (
              <ActionLink href={primaryHref} primary>
                {primaryEndpoint?.label ?? "Open task link"}
              </ActionLink>
            ) : null}
            {task.status !== TaskStatus.VERIFIED &&
            canShowClaimButton &&
            (canClaim || task.viewerHasClaim) ? (
              <TaskClaimButton
                canClaim={canClaim}
                requiresPayoutSetup={requiresPayoutSetup}
                signedIn={Boolean(userId)}
                signInHref={signInHref}
                taskId={task.id}
                viewerHasClaim={task.viewerHasClaim}
              />
            ) : null}
            {task.isPublic ? (
              <TaskShareButtons
                shareText={shareText}
                taskId={task.id}
                taskTitle={task.title}
                variant="icon"
              />
            ) : null}
            {userId &&
            (viewer?.isAdmin || (!task.isPublic && canManageTask)) ? (
              <TaskDeleteButton taskId={task.id} taskTitle={task.title} />
            ) : null}
          </section>

          {canManageTask &&
          !isAssignedDocumentReviewer &&
          (task.status === TaskStatus.DRAFT ||
            task.status === TaskStatus.ACTIVE) ? (
            <TaskManagementControls
              canAddStep={task.ownerOrganizationId == null}
              canArchive={
                task.activeClaimCount === 0 &&
                task.activeChildTaskCount === 0 &&
                task.activeExecutionAttemptCount === 0
              }
              description={task.description}
              dueAt={getDisplayDate(task.dueAt)?.toISOString() ?? null}
              estimatedEffortHours={task.estimatedEffortHours}
              taskId={task.id}
              title={task.title}
            />
          ) : null}

          {viewerClaim ? (
            <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
              {VIEWER_CLAIM_STATE_LABEL[viewerClaim.status] ?? ""}
            </p>
          ) : null}

          {viewerHasReleasableClaim || canShowSelfCompletion ? (
            <div className="mt-5">
              <TaskCompleteForm
                canComplete={viewerCanCompleteClaim || canShowSelfCompletion}
                canRelease={viewerHasReleasableClaim}
                taskId={task.id}
              />
            </div>
          ) : null}
        </header>

        <TaskExternalActionApprovals approvals={outboundApprovals} />

        {showDocumentReviewManager &&
        documentReviewPageData?.panel.mode === "MANAGER" &&
        documentReviewPageData.setup ? (
          <DocumentReviewManagerPanel
            panel={documentReviewPageData.panel}
            setup={documentReviewPageData.setup}
          />
        ) : documentReviewPageData?.panel.mode === "REVIEWER" ? (
          <DocumentReviewReviewerPanel panel={documentReviewPageData.panel} />
        ) : null}

        {/* Delay-cost stats — kept (motivational, not duplicated in
            header). Owner/Progress/Time-needed/Area/Completed/Updates were
            previously listed in a verbose `<dl>` enterprise-CRM sidebar
            that duplicated the header (Due date) and added field-label
            chrome users don't act on. Per TODO line 224: keep title +
            assignee + due date + primary action + markdown body +
            comments, drop the rest. */}
        {(delayStats.currentHumanLivesLost != null &&
          delayStats.currentHumanLivesLost > 0) ||
        (delayStats.currentEconomicValueUsdLost != null &&
          delayStats.currentEconomicValueUsdLost > 0) ? (
          <section
            aria-label="Delay cost"
            className="flex flex-wrap gap-x-8 gap-y-2 border-b border-foreground py-4 text-sm font-bold"
          >
            {delayStats.currentHumanLivesLost != null &&
            delayStats.currentHumanLivesLost > 0 ? (
              <span>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Deaths from delay
                </span>{" "}
                <span className="ml-1 text-foreground">
                  {formatCompactCount(delayStats.currentHumanLivesLost)}
                </span>
              </span>
            ) : null}
            {delayStats.currentEconomicValueUsdLost != null &&
            delayStats.currentEconomicValueUsdLost > 0 ? (
              <span>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                  Wasted by delay
                </span>{" "}
                <span className="ml-1 text-foreground">
                  {formatCompactCurrency(
                    delayStats.currentEconomicValueUsdLost,
                  )}
                </span>
              </span>
            ) : null}
          </section>
        ) : null}

        {task.impact.currentSet ? (
          <TaskImpactTraceDisclosure taskId={task.id} />
        ) : null}

        {showTaskFunding ? (
          <section
            id="funding"
            className="scroll-mt-24 border-b border-foreground py-6"
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">Fund this task</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Your money stays pinned to this exact work and pays the
                    worker the second a claim is verified. Nothing proven,
                    nothing paid.
                  </p>
                </div>
                {fundingStatus ? (
                  <TaskFundingProgress
                    status={fundingStatus}
                    taskId={task.id}
                  />
                ) : (
                  <div className="border border-foreground p-4 text-sm font-bold">
                    No funding target yet. The first payment creates one.
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {isPaidTask ? (
                  <StripeConnectStatusPanel
                    signedIn={Boolean(userId)}
                    signInHref={signInHref}
                  />
                ) : null}
                <TaskFundingCheckoutForm
                  costPerDalyUsd={
                    hasRealFundingCost ? task.impact.costPerDalyUsd : null
                  }
                  defaultAmountCents={defaultFundingAmountCents}
                  expectedValuePerDollar={
                    hasRealFundingCost
                      ? task.impact.expectedValuePerDollar
                      : null
                  }
                  signedIn={Boolean(userId)}
                  signInHref={signInHref}
                  taskId={task.id}
                />
              </div>
            </div>
          </section>
        ) : null}

        {!isAssignedDocumentReviewer ? (
          <>
            <section className="border-b border-foreground py-6">
              <article className="min-w-0">
                <TaskDescription markdown={task.description} />
              </article>
            </section>

            <TaskDocumentsList taskId={task.id} userId={userId} />

            <TaskDependenciesSection task={task} viewer={viewer} />
          </>
        ) : null}

        {!isAssignedDocumentReviewer &&
        viewer?.isAdmin &&
        task.claimPolicy === TaskClaimPolicy.ASSIGNED_ONLY &&
        task.status !== TaskStatus.VERIFIED ? (
          <details className="border-b border-foreground py-5">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Admin verification
            </summary>
            <div className="mt-4">
              <TaskVerifyForm
                defaultEvidence={task.completionEvidence}
                helperText="For assigned-only public tasks, paste the public evidence used to mark the task complete."
                submitLabel="Verify assigned task"
                taskId={task.id}
              />
            </div>
          </details>
        ) : null}

        {!isAssignedDocumentReviewer &&
        viewer?.isAdmin &&
        reviewableClaims.length > 0 ? (
          <details className="border-b border-foreground py-5">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.12em] text-foreground">
              Pending claim reviews ({reviewableClaims.length})
            </summary>
            <div className="mt-4 space-y-6">
              {reviewableClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="space-y-3 border-t border-foreground pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-base font-black">
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
                    submitLabel="Verify claim"
                    taskId={task.id}
                  />
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {!isAssignedDocumentReviewer && task.childTasks.length > 0 ? (
          <section id="subtasks" className="border-b border-foreground py-8">
            <h2 className="mb-4 text-base font-semibold">
              Subtasks ({task.childTasks.length})
            </h2>
            <SortableTaskList
              tasks={task.childTasks as unknown as TaskCardTask[]}
              defaultSortKey={
                task.id === TREATY_PARENT_TASK_ID
                  ? "assigneeBudget"
                  : "deathsLockedIn"
              }
              defaultSortDir="desc"
              variant={task.id === TREATY_PARENT_TASK_ID ? "signer" : "default"}
            />
          </section>
        ) : null}

        <section id="discussion" className="py-8">
          <TaskCommentFeed
            taskId={task.id}
            initialComments={commentFeed.comments.map((c) => ({
              ...c,
              createdAt:
                c.createdAt instanceof Date
                  ? c.createdAt.toISOString()
                  : c.createdAt,
              editedAt:
                c.editedAt instanceof Date
                  ? c.editedAt.toISOString()
                  : c.editedAt,
              deletedAt:
                c.deletedAt instanceof Date
                  ? c.deletedAt.toISOString()
                  : c.deletedAt,
            }))}
            initialActivities={activityTimeline.map((a) => ({
              ...a,
              createdAt:
                a.createdAt instanceof Date
                  ? a.createdAt.toISOString()
                  : a.createdAt,
            }))}
            currentUserId={userId}
            currentUserIsAdmin={viewerIsAdmin}
            wishoniaUserId={wishoniaUserId}
            signInHref={signInHref}
            heading={
              showDocumentReviewManager || isAssignedDocumentReviewer
                ? "Discussion"
                : undefined
            }
          />
        </section>
      </div>
    </main>
  );
}
