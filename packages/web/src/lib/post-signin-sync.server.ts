import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { recordReferralAttributionForUser } from "@/lib/referral.server";
import {
  buildTriggerContext,
  fireTaskTriggersForEvent,
} from "@/lib/triggers";
import { ensureUserTreatyTask } from "@/lib/tasks/user-treaty-task.server";

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

  // The HMT root task description IS the welcome — it's the Promotion
  // content (CONGRATULATIONS, Humanity Manager, KPIs, compensation,
  // vesting), seeded by user-onboarding:treaty. No separate welcome
  // comment is posted. We considered an escalating Wishonia nudge for
  // lapsed users but skipped it — see the seed driver header for the
  // deliverability rationale; the trigger framework supports adding it
  // later as a single trigger row with no code change.
  await ensureUserTreatyTask({
    personId: person.id,
    userId,
  });

  const referralRecorded = await recordReferralAttributionForUser(
    userId,
    referralCode,
    shareAttemptId,
  );

  // Fire user.signup so any AI-authored TaskTrigger blueprints layered on
  // top of the baseline onboarding tree get a chance to spawn additional
  // tasks, communications, or verifications. The baseline tree itself was
  // already materialized by ensureUserTreatyTask above; the seeded
  // user-onboarding:treaty trigger is idempotent (Task upsert by taskKey)
  // so re-spawning the same set is a no-op.
  await fireTaskTriggersForEvent(
    "user.signup",
    buildTriggerContext({
      user: { id: userId, personId: person.id, name: trimmedName ?? null },
    }),
    { actorUserId: userId },
  );

  return {
    referralRecorded,
    userUpdated: Object.keys(updateData).length > 0,
  };
}
