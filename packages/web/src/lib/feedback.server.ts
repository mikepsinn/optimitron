import { TaskCategory, type Prisma } from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import { createTask } from "@/lib/tasks.server";
import { getWishoniaUserId } from "@/lib/wishonia.server";

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

  const task = await createTask(owner.creatorUserId, {
    assigneePersonId: owner.assigneePersonId,
    category: TaskCategory.OTHER,
    description: buildFeedbackTaskDescription({
      contactEmail,
      message,
      pageUrl,
      submitterEmail,
      submitterUserId,
    }),
    estimatedEffortHours: 0.25,
    interestTags: ["feedback", "site improvement", "war and disease"],
    isPublic: false,
    roleTitle: owner.assigneePersonId ? "Feedback triage" : null,
    skillTags: ["triage", "copy", "product"],
    title: makeTitle(message),
  });

  await prisma.task.update({
    where: { id: task.id },
    data: { contextJson: metadata },
  });

  return {
    taskId: task.id,
  };
}
