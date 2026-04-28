import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { recordReferralAttributionForUser } from "@/lib/referral.server";
import { postTaskCommentAndNotify } from "@/lib/tasks/task-comment-notifications.server";
import {
  buildWishoniaWelcomeComment,
  ensureUserTreatyTask,
} from "@/lib/tasks/user-treaty-task.server";

interface PostSigninSyncInput {
  userId: string;
  name?: string | null;
  newsletterSubscribed?: boolean;
  referralCode?: string | null;
  shareAttemptId?: string | null;
}

export async function applyPostSigninSync({
  userId,
  name,
  newsletterSubscribed,
  referralCode,
  shareAttemptId,
}: PostSigninSyncInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      newsletterSubscribed: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const trimmedName = name?.trim() || null;
  const updateData: { name?: string; newsletterSubscribed?: boolean } = {};

  if (trimmedName && !user.name) {
    updateData.name = trimmedName;
  }

  if (
    typeof newsletterSubscribed === "boolean" &&
    newsletterSubscribed !== user.newsletterSubscribed
  ) {
    updateData.newsletterSubscribed = newsletterSubscribed;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  const person = await ensurePersonForUser(userId);

  const treatyTask = await ensureUserTreatyTask({
    personId: person.id,
    userId,
  });

  if (treatyTask.created) {
    const welcome = buildWishoniaWelcomeComment();
    await postTaskCommentAndNotify({
      authorNameOverride: welcome.authorNameOverride,
      kind: welcome.kind,
      message: welcome.message,
      source: welcome.source,
      taskId: treatyTask.taskId,
    });
  }

  const referralRecorded = await recordReferralAttributionForUser(
    userId,
    referralCode,
    shareAttemptId,
  );

  return {
    referralRecorded,
    userUpdated: Object.keys(updateData).length > 0,
  };
}
