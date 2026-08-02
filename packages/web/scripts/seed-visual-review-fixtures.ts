import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ContentVisibility,
  TaskClaimPolicy,
  TaskClaimStatus,
  TaskExecutionAttemptStatus,
  TaskStatus,
} from "@optimitron/db";
import { createDocument, updateDocument } from "@/lib/documents.server";
import { prisma } from "@/lib/prisma";
import { postComment } from "@/lib/tasks/task-comments.server";
import {
  DOCUMENT_PROPOSAL_ARTIFACT_KIND,
  DocumentReviewVerdictSchema,
  readDocumentProposal,
} from "@/lib/tasks/document-review-contracts";
import {
  createDocumentProposal,
  requestDocumentReview,
  submitDocumentReview,
} from "@/lib/tasks/document-review.server";

const DEMO_EMAIL = "demo@thinkbynumbers.org";
const FIXTURE_PREFIX = "visual_document_review_";
const FIXTURE_RUNNER_ENV = "OPTIMITRON_VISUAL_FIXTURE_RUNNER";
// A fixed offset from seed time, not a hardcoded calendar date: once a
// hardcoded date passes, the seeded owner task becomes overdue and the
// task page's "Overdue task" label and delay-cost section change the
// task-management-owner screenshot with no code change.
const MANAGEMENT_DUE_AT = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
const WEB_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const FIXTURE_MANIFEST_PATH = path.resolve(
  WEB_ROOT,
  "output",
  "playwright",
  "visual-fixtures",
  "document-review.json",
);

const ids = {
  activeTask: `${FIXTURE_PREFIX}active_task`,
  fixtureManagerPerson: `${FIXTURE_PREFIX}manager_person`,
  fixtureManagerUser: `${FIXTURE_PREFIX}manager_user`,
  managerTask: `${FIXTURE_PREFIX}manager_task`,
  managementClaimTask: `${FIXTURE_PREFIX}management_claim_task`,
  managementOwnerTask: `${FIXTURE_PREFIX}management_owner_task`,
  staleTask: `${FIXTURE_PREFIX}stale_task`,
};

function assertFixtureRunner() {
  if (process.env[FIXTURE_RUNNER_ENV] !== "1") {
    throw new Error(
      "Visual review fixtures may only be seeded through scripts/run-playwright.mjs visual.",
    );
  }
}

function assertLocalFixtureDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed visual review fixtures.");
  }
  const hostname = new URL(databaseUrl).hostname;
  if (
    !new Set([
      "localhost",
      "127.0.0.1",
      "::1",
      "[::1]",
      "host.docker.internal",
    ]).has(hostname)
  ) {
    throw new Error(
      `Refusing to seed visual review fixtures into non-local database host ${hostname}.`,
    );
  }
}

async function removeFixtureManifest() {
  await rm(FIXTURE_MANIFEST_PATH, { force: true });
}

async function resetVisualReviewFixtures() {
  const deleted = await prisma.$transaction(async (tx) => {
    const fixtureTasks = await tx.task.findMany({
      where: {
        OR: [
          { id: { startsWith: FIXTURE_PREFIX } },
          { taskKey: { contains: FIXTURE_PREFIX } },
        ],
      },
      select: { id: true },
    });
    const taskIds = new Set(fixtureTasks.map((task) => task.id));
    let parentTaskIds = [...taskIds];
    while (parentTaskIds.length > 0) {
      const children = await tx.task.findMany({
        where: { parentTaskId: { in: parentTaskIds } },
        select: { id: true },
      });
      parentTaskIds = children
        .map((task) => task.id)
        .filter((taskId) => !taskIds.has(taskId));
      for (const taskId of parentTaskIds) taskIds.add(taskId);
    }

    const taskIdList = [...taskIds];
    const [documents, artifacts] = await Promise.all([
      tx.document.findMany({
        where: {
          OR: [
            { idempotencyKey: { startsWith: FIXTURE_PREFIX } },
            { taskId: { in: taskIdList } },
          ],
        },
        select: { id: true },
      }),
      tx.taskExecutionArtifact.findMany({
        where: {
          metadataJson: {
            equals: DOCUMENT_PROPOSAL_ARTIFACT_KIND,
            path: ["kind"],
          },
          taskExecutionAttempt: {
            metadata: {
              equals: DOCUMENT_PROPOSAL_ARTIFACT_KIND,
              path: ["kind"],
            },
            status: TaskExecutionAttemptStatus.COMPLETED,
            taskId: { in: taskIdList },
          },
        },
        select: {
          structuredResultJson: true,
          taskExecutionAttempt: { select: { taskId: true } },
        },
      }),
    ]);
    const documentIds = new Set(documents.map((document) => document.id));
    for (const artifact of artifacts) {
      const proposal = readDocumentProposal(artifact.structuredResultJson);
      if (
        !proposal ||
        proposal.authorityTaskId !== artifact.taskExecutionAttempt.taskId ||
        !documentIds.has(proposal.base.documentId) ||
        !proposal.sourceComments.every((comment) => taskIds.has(comment.taskId))
      ) {
        continue;
      }
      documentIds.add(proposal.proposal.documentId);
    }
    const documentIdList = [...documentIds];

    await tx.taskExecutionAttempt.deleteMany({
      where: { taskId: { in: taskIdList } },
    });
    await tx.taskCommentAttachment.deleteMany({
      where: { taskId: { in: taskIdList } },
    });
    const tasks = await tx.task.deleteMany({
      where: { id: { in: taskIdList } },
    });

    await tx.contentAttachment.deleteMany({
      where: { documentId: { in: documentIdList } },
    });
    await tx.document.updateMany({
      where: { id: { in: documentIdList } },
      data: { currentRevisionId: null },
    });
    const removedDocuments = await tx.document.deleteMany({
      where: { id: { in: documentIdList } },
    });

    return { documents: removedDocuments.count, tasks: tasks.count };
  });

  console.log(
    `[visual-review] reset ${deleted.tasks} fixture tasks and ${deleted.documents} fixture documents`,
  );
}

async function ensureFixtureManager() {
  const email = `${FIXTURE_PREFIX}manager@example.test`;
  const person = await prisma.person.upsert({
    where: { id: ids.fixtureManagerPerson },
    update: {
      deletedAt: null,
      displayName: "Ada Reviewer",
      email,
    },
    create: {
      displayName: "Ada Reviewer",
      email,
      id: ids.fixtureManagerPerson,
    },
  });
  const user = await prisma.user.upsert({
    where: { id: ids.fixtureManagerUser },
    update: {
      deletedAt: null,
      email,
      personId: person.id,
    },
    create: {
      email,
      id: ids.fixtureManagerUser,
      personId: person.id,
    },
  });
  return { person, user };
}

async function loadDemoActor() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: {
      id: true,
      isAdmin: true,
      person: { select: { id: true } },
    },
  });
  if (!user?.person) {
    throw new Error(
      `Visual review fixtures require the managed demo user (${DEMO_EMAIL}). Run managed-data sync first.`,
    );
  }
  if (!user.isAdmin) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
  }
  return { person: user.person, user: { id: user.id } };
}

async function seedTaskManagementStates(input: {
  demo: Awaited<ReturnType<typeof loadDemoActor>>;
  fixtureManager: Awaited<ReturnType<typeof ensureFixtureManager>>;
}) {
  const ownerTask = await prisma.task.upsert({
    where: { id: ids.managementOwnerTask },
    update: {
      assigneePersonId: input.demo.person.id,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: input.demo.user.id,
      deletedAt: null,
      description:
        "Confirm the filing checklist, add any missing steps, and archive this task when the checklist is no longer current.",
      dueAt: MANAGEMENT_DUE_AT,
      estimatedEffortHours: 2,
      isPublic: false,
      status: TaskStatus.ACTIVE,
      title: "Finish the EOS filing checklist",
    },
    create: {
      assigneePersonId: input.demo.person.id,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
      createdByUserId: input.demo.user.id,
      description:
        "Confirm the filing checklist, add any missing steps, and archive this task when the checklist is no longer current.",
      dueAt: MANAGEMENT_DUE_AT,
      estimatedEffortHours: 2,
      id: ids.managementOwnerTask,
      isPublic: false,
      status: TaskStatus.ACTIVE,
      title: "Finish the EOS filing checklist",
    },
  });
  const claimTask = await prisma.task.upsert({
    where: { id: ids.managementClaimTask },
    update: {
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      createdByUserId: input.fixtureManager.user.id,
      deletedAt: null,
      description:
        "Check the public filing instructions and leave the exact official source link with your completion note.",
      isPublic: true,
      status: TaskStatus.ACTIVE,
      title: "Verify the EOS filing instructions",
    },
    create: {
      claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
      createdByUserId: input.fixtureManager.user.id,
      description:
        "Check the public filing instructions and leave the exact official source link with your completion note.",
      id: ids.managementClaimTask,
      isPublic: true,
      status: TaskStatus.ACTIVE,
      title: "Verify the EOS filing instructions",
    },
  });
  await prisma.taskClaim.upsert({
    where: {
      taskId_userId: { taskId: claimTask.id, userId: input.demo.user.id },
    },
    update: {
      abandonedAt: null,
      completedAt: null,
      completionEvidence: null,
      deletedAt: null,
      status: TaskClaimStatus.CLAIMED,
      verifiedAt: null,
      verifiedByUserId: null,
    },
    create: {
      status: TaskClaimStatus.CLAIMED,
      taskId: claimTask.id,
      userId: input.demo.user.id,
    },
  });
  return { claimTaskId: claimTask.id, ownerTaskId: ownerTask.id };
}

async function ensureAuthorityTask(input: {
  createdByUserId: string;
  description: string;
  id: string;
  title: string;
}) {
  const data = {
    createdByUserId: input.createdByUserId,
    deletedAt: null,
    description: input.description,
    isPublic: false,
    title: input.title,
  };
  return prisma.task.upsert({
    where: { id: input.id },
    update: data,
    create: { ...data, id: input.id },
  });
}

async function ensureComment(input: {
  authorUserId: string;
  message: string;
  parentCommentId?: string;
  taskId: string;
}) {
  const parentCommentId = input.parentCommentId ?? null;
  const existing = await prisma.taskComment.findFirst({
    where: {
      authorUserId: input.authorUserId,
      deletedAt: null,
      message: input.message,
      parentCommentId,
      taskId: input.taskId,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing;
  return postComment(input);
}

async function seedManagerState(input: {
  demo: Awaited<ReturnType<typeof loadDemoActor>>;
  fixtureManager: Awaited<ReturnType<typeof ensureFixtureManager>>;
}) {
  const task = await ensureAuthorityTask({
    createdByUserId: input.demo.user.id,
    description:
      "Turn public comments into exact text, get an independent review, and record the working version.",
    id: ids.managerTask,
    title: "Approve the Earth Optimization Services charter",
  });
  const document = await createDocument({
    body: [
      "# Purpose",
      "",
      "Earth Optimization Services helps humanity choose and fund work that saves lives and raises real income.",
      "",
      "# Shared ownership",
      "",
      "Every person has an equal right to propose improvements, comment on the governing text, and inspect adopted working versions.",
      "",
      "# Decisions",
      "",
      "Managers may record an internal decision after an independent review.",
    ].join("\n"),
    createdByUserId: input.demo.user.id,
    idempotencyKey: `${FIXTURE_PREFIX}manager_document`,
    taskId: task.id,
    title: "Earth Optimization Services Charter",
    visibility: ContentVisibility.PRIVATE,
  });
  const sourceComment = await ensureComment({
    authorUserId: input.demo.user.id,
    message:
      "Define what adoption does and does not do before counsel reviews this.",
    taskId: task.id,
  });
  await createDocumentProposal(
    task.id,
    {
      baseDocumentRevisionId: document.revision.id,
      body: [
        "# Purpose",
        "",
        "Earth Optimization Services helps humanity choose and fund work that saves lives and raises real income.",
        "",
        "# Shared ownership",
        "",
        "Every person has an equal right to propose improvements, comment on the governing text, and inspect adopted working versions.",
        "",
        "# Decisions",
        "",
        "Managers may record an internal decision after an independent review. Internal adoption selects the working text; it does not sign, file, enact, or publish the document.",
      ].join("\n"),
      sourceCommentIds: [sourceComment.id],
      summary:
        "Clarifies that internal adoption selects working text without creating legal effect.",
      title: "Earth Optimization Services Charter",
    },
    input.demo.user.id,
    { idempotencyKey: `${FIXTURE_PREFIX}manager_proposal` },
  );
  const approvedReview = await requestDocumentReview(
    task.id,
    {
      documentRevisionId: document.revision.id,
      instructions:
        "Check whether the authority boundary and shared-ownership language are clear and internally consistent.",
      reviewerPersonId: input.fixtureManager.person.id,
    },
    input.demo.user.id,
    { idempotencyKey: `${FIXTURE_PREFIX}approved_review` },
  );
  await submitDocumentReview(
    approvedReview.reviewTaskId,
    {
      explanation:
        "Approved. The authority boundary is explicit, and the text does not claim filing or legal effect.",
      verdict: DocumentReviewVerdictSchema.enum.APPROVE,
    },
    input.fixtureManager.user.id,
    { idempotencyKey: `${FIXTURE_PREFIX}approved_response` },
  );
  return task.id;
}

async function seedActiveReviewerState(input: {
  demo: Awaited<ReturnType<typeof loadDemoActor>>;
  fixtureManager: Awaited<ReturnType<typeof ensureFixtureManager>>;
}) {
  const task = await ensureAuthorityTask({
    createdByUserId: input.fixtureManager.user.id,
    description:
      "Ask one independent reviewer to check the exact contribution agreement text.",
    id: ids.activeTask,
    title: "Review the EOS contribution agreement",
  });
  const document = await createDocument({
    body: [
      "# Contribution",
      "",
      "A contribution funds the work package named on its receipt.",
      "",
      "# Work and outcomes",
      "",
      "Payment records funding received. It does not state that the work is complete or that impact has occurred.",
      "",
      "# Corrections",
      "",
      "Refunds, corrections, completion, and measured outcomes are recorded as later addenda. The original receipt remains unchanged.",
    ].join("\n"),
    createdByUserId: input.fixtureManager.user.id,
    idempotencyKey: `${FIXTURE_PREFIX}active_document`,
    taskId: task.id,
    title: "EOS Contribution Agreement",
    visibility: ContentVisibility.PRIVATE,
  });
  const review = await requestDocumentReview(
    task.id,
    {
      documentRevisionId: document.revision.id,
      instructions:
        "Check the payment, refund, and outcome language. Request changes if any sentence could imply guaranteed impact.",
      reviewerPersonId: input.demo.person.id,
    },
    input.fixtureManager.user.id,
    { idempotencyKey: `${FIXTURE_PREFIX}active_review` },
  );
  const question = await ensureComment({
    authorUserId: input.demo.user.id,
    message:
      "Should the refund sentence cover failed work packages as well as cancelled ones?",
    taskId: review.reviewTaskId,
  });
  const reply = await ensureComment({
    authorUserId: input.fixtureManager.user.id,
    message:
      "Yes. Treat that as a requested change if the current sentence is ambiguous.",
    parentCommentId: question.id,
    taskId: review.reviewTaskId,
  });
  await ensureComment({
    authorUserId: input.demo.user.id,
    message:
      "Understood. I’ll separate the payment record from the outcome obligation.",
    parentCommentId: reply.id,
    taskId: review.reviewTaskId,
  });
  return review.reviewTaskId;
}

async function seedStaleReviewerState(input: {
  demo: Awaited<ReturnType<typeof loadDemoActor>>;
  fixtureManager: Awaited<ReturnType<typeof ensureFixtureManager>>;
}) {
  const task = await ensureAuthorityTask({
    createdByUserId: input.fixtureManager.user.id,
    description:
      "Preserve the text that was assigned even when the canonical document changes.",
    id: ids.staleTask,
    title: "Review EOS governance authority",
  });
  const document = await createDocument({
    body: "# Authority\n\nA manager may adopt a working version after one independent review.",
    createdByUserId: input.fixtureManager.user.id,
    idempotencyKey: `${FIXTURE_PREFIX}stale_document`,
    taskId: task.id,
    title: "EOS Governance Authority",
    visibility: ContentVisibility.PRIVATE,
  });
  const pinnedRevision = await prisma.documentRevision.findUniqueOrThrow({
    where: {
      documentId_version: {
        documentId: document.document.id,
        version: 1,
      },
    },
    select: { id: true },
  });
  const review = await requestDocumentReview(
    task.id,
    {
      documentRevisionId: pinnedRevision.id,
      instructions:
        "Confirm whether this authority statement is complete and appropriately limited.",
      reviewerPersonId: input.demo.person.id,
    },
    input.fixtureManager.user.id,
    { idempotencyKey: `${FIXTURE_PREFIX}stale_review` },
  );
  if (document.document.version === 1) {
    await updateDocument({
      body: "# Authority\n\nA manager may adopt a working version only after an independent review, with the decision recorded on the exact version.",
      documentId: document.document.id,
      editorUserId: input.fixtureManager.user.id,
      expectedVersion: 1,
    });
  }
  return review.reviewTaskId;
}

async function main() {
  assertFixtureRunner();
  assertLocalFixtureDatabase();
  await removeFixtureManifest();
  await resetVisualReviewFixtures();
  const [demo, fixtureManager] = await Promise.all([
    loadDemoActor(),
    ensureFixtureManager(),
  ]);
  const managerTaskId = await seedManagerState({ demo, fixtureManager });
  const activeReviewTaskId = await seedActiveReviewerState({
    demo,
    fixtureManager,
  });
  const staleReviewTaskId = await seedStaleReviewerState({
    demo,
    fixtureManager,
  });
  const taskManagement = await seedTaskManagementStates({
    demo,
    fixtureManager,
  });

  await mkdir(path.dirname(FIXTURE_MANIFEST_PATH), { recursive: true });
  await writeFile(
    FIXTURE_MANIFEST_PATH,
    JSON.stringify(
      {
        activeReviewTaskId,
        managerTaskId,
        managementClaimTaskId: taskManagement.claimTaskId,
        managementOwnerTaskId: taskManagement.ownerTaskId,
        staleReviewTaskId,
        version: 1,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`[visual-review] seeded document review fixtures`);
  console.log(`[visual-review] wrote ${FIXTURE_MANIFEST_PATH}`);
}

main()
  .catch(async (error) => {
    await removeFixtureManifest();
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
