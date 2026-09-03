/**
 * Site feedback intake.
 *
 * Ported from Optimitron's `src/lib/feedback.server.ts`. A submission becomes a
 * private task under the Optimitron engineering branch, so feedback lands in
 * the same queue whichever site it was sent from.
 *
 * Optimitron builds the task through its generic `createTask`, which resolves a
 * parent, a claim policy, and an assignee notification for every caller. This
 * intake has one fixed shape — private, explicit parent, first-admin assignee —
 * so it writes the resolved row directly, the way the other site-kit task
 * writers do. The one behavior that does not carry over is the assignee email
 * `createTask` sends: the task still shows up in the assignee's queue.
 */

import {
  TaskCategory,
  TaskClaimPolicy,
  TaskStatus,
  type Prisma,
} from "@optimitron/db";
import { WISHONIA_EMAIL } from "@optimitron/db/system-identities";
import { OPTIMITRON_DEV_TASK_ID } from "@optimitron/db/task-keys";
import { prisma } from "./prisma";

const MAX_FEEDBACK_LENGTH = 8_000;
const MAX_URL_LENGTH = 1_000;
const MAX_EMAIL_LENGTH = 254;
const FEEDBACK_TASK_TITLE_PREFIX = "Review site feedback:";
const FEEDBACK_GLOBAL_BURST_LIMIT = 20;
const FEEDBACK_GLOBAL_BURST_WINDOW_MS = 10 * 60 * 1000;
export const FEEDBACK_HONEYPOT_FIELD = "companyWebsite";

type FeedbackRejectionCode = "honeypot" | "rate_limited";

export class FeedbackRejectedError extends Error {
  readonly code: FeedbackRejectionCode;

  constructor(code: FeedbackRejectionCode, message: string) {
    super(message);
    this.name = "FeedbackRejectedError";
    this.code = code;
  }
}

export function isFeedbackRejectedError(
  error: unknown,
): error is FeedbackRejectedError {
  return error instanceof FeedbackRejectedError;
}

export interface CreateFeedbackTaskInput {
  antiSpam?: {
    honeypot?: string | null;
  };
  contactEmail?: string | null;
  message: string;
  pageUrl?: string | null;
  submitterEmail?: string | null;
  submitterUserId?: string | null;
}

function clean(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function makeTitle(message: string) {
  const firstLine = message.replace(/\s+/g, " ").trim().slice(0, 72);
  return `${FEEDBACK_TASK_TITLE_PREFIX} ${firstLine || "No summary"}`;
}

function cleanEmail(value: string | null | undefined) {
  return clean(value, MAX_EMAIL_LENGTH);
}

function cleanHttpUrl(value: string | null | undefined) {
  const cleaned = clean(value, MAX_URL_LENGTH);
  if (!cleaned) return null;

  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function assertHoneypotIsEmpty(input: CreateFeedbackTaskInput) {
  const honeypot = clean(input.antiSpam?.honeypot, 500);
  if (honeypot) {
    throw new FeedbackRejectedError("honeypot", "Feedback accepted.");
  }
}

/**
 * Wishonia is the system user that owns work nobody else claimed. Cached in
 * process because the row never changes.
 */
let cachedWishoniaUserId: string | null = null;

async function getWishoniaUserId(): Promise<string> {
  if (cachedWishoniaUserId) return cachedWishoniaUserId;

  const user = await prisma.user.findUnique({
    where: { email: WISHONIA_EMAIL },
    select: { id: true },
  });

  if (!user) {
    throw new Error(
      "Wishonia user not seeded. Run: pnpm db:sync:managed-data -- --apply",
    );
  }

  cachedWishoniaUserId = user.id;
  return user.id;
}

async function getFeedbackTaskOwner() {
  const admin = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      isAdmin: true,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      personId: true,
    },
  });

  if (admin) {
    return {
      assigneePersonId: admin.personId,
      creatorUserId: admin.id,
    };
  }

  return {
    assigneePersonId: null,
    creatorUserId: await getWishoniaUserId(),
  };
}

async function assertFeedbackWithinRateLimits(now = new Date()) {
  const cutoff = new Date(now.getTime() - FEEDBACK_GLOBAL_BURST_WINDOW_MS);
  const recentFeedbackTasks = await prisma.task.count({
    where: {
      createdAt: { gte: cutoff },
      deletedAt: null,
      isPublic: false,
      title: { startsWith: FEEDBACK_TASK_TITLE_PREFIX },
    },
  });

  if (recentFeedbackTasks >= FEEDBACK_GLOBAL_BURST_LIMIT) {
    throw new FeedbackRejectedError(
      "rate_limited",
      "Feedback is temporarily rate limited.",
    );
  }
}

function buildFeedbackTaskDescription(input: {
  contactEmail: string | null;
  message: string;
  pageUrl: string | null;
  submitterEmail: string | null;
  submitterUserId: string | null;
}) {
  return [
    "A human sent feedback about how to better coordinate humanity to end war and disease.",
    "",
    "Feedback:",
    input.message,
    "",
    input.pageUrl ? `Page URL: ${input.pageUrl}` : null,
    input.contactEmail ? `Contact email: ${input.contactEmail}` : null,
    input.submitterEmail ? `Signed-in email: ${input.submitterEmail}` : null,
    input.submitterUserId
      ? `Signed-in user ID: ${input.submitterUserId}`
      : null,
    "",
    "Triage:",
    "- If valid, turn it into the smallest useful site/task/email improvement.",
    "- If it is irritation caused by our own copy or email behavior, fix the irritating thing.",
    "- If they asked us to stop bothering them, handle that before doing anything clever.",
  ]
    .filter((line): line is string => line != null)
    .join("\n");
}

export async function createFeedbackTask(input: CreateFeedbackTaskInput) {
  assertHoneypotIsEmpty(input);

  const message = clean(input.message, MAX_FEEDBACK_LENGTH);
  if (!message || message.length < 3) {
    throw new Error("Feedback is required.");
  }
  await assertFeedbackWithinRateLimits();

  const contactEmail = cleanEmail(input.contactEmail);
  const contactEmailNormalized = contactEmail?.toLowerCase() ?? null;
  const submitterEmail = cleanEmail(input.submitterEmail);
  const pageUrl = cleanHttpUrl(input.pageUrl);
  const submitterUserId = clean(input.submitterUserId, 128);
  const owner = await getFeedbackTaskOwner();
  const metadata = {
    contactEmail,
    contactEmailNormalized,
    pageUrl,
    source: "feedback_page",
    submitterEmail,
    submitterUserId,
  } satisfies Prisma.InputJsonObject;

  const task = await prisma.task.create({
    data: {
      assigneePersonId: owner.assigneePersonId,
      category: TaskCategory.OTHER,
      // An assigned task is claimable only by its assignee; an unassigned one
      // falls back to the single-claimer default, matching `createTask`.
      claimPolicy: owner.assigneePersonId
        ? TaskClaimPolicy.ASSIGNED_ONLY
        : TaskClaimPolicy.OPEN_SINGLE,
      contextJson: metadata,
      createdByUserId: owner.creatorUserId,
      description: buildFeedbackTaskDescription({
        contactEmail,
        message,
        pageUrl,
        submitterEmail,
        submitterUserId,
      }),
      estimatedEffortHours: 0.25,
      interestTags: ["feedback", "site improvement", "war and disease"],
      // Product feedback belongs in the engineering branch, not the Optimize
      // Earth root and not the feedback owner's personal queue (OPT-TASK-06).
      // An explicit parent also makes the task private.
      isPublic: false,
      parentTaskId: OPTIMITRON_DEV_TASK_ID,
      roleTitle: owner.assigneePersonId ? "Feedback triage" : null,
      skillTags: ["triage", "copy", "product"],
      status: TaskStatus.ACTIVE,
      title: makeTitle(message),
    },
    select: { id: true },
  });

  return {
    taskId: task.id,
  };
}
