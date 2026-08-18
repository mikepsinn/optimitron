import { ensureNearbyFlyerHangTasks } from "@/lib/flyer-hang/server";
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
  /// First URL the user landed on (with full query string for UTM /
  /// referral / campaign attribution). Captured by the client into
  /// localStorage on first page load and posted here at first signin.
  /// Stored as `User.signupLandingUrl`, first-signin-wins. The site
  /// variant is derivable from the URL's host via `getSiteFromHost` —
  /// no separate normalized column.
  signupLandingUrl?: string | null;
}

export async function applyPostSigninSync({
  userId,
  name,
  newsletterSubscribed,
  referralCode,
  shareAttemptId,
  signupLandingUrl,
}: PostSigninSyncInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      newsletterSubscribed: true,
      signupLandingUrl: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const trimmedName = name?.trim() || null;
  const updateData: {
    newsletterSubscribed?: boolean;
    signupLandingUrl?: string;
  } = {};

  if (
    typeof newsletterSubscribed === "boolean" &&
    newsletterSubscribed !== user.newsletterSubscribed
  ) {
    updateData.newsletterSubscribed = newsletterSubscribed;
  }

  // First-signin-wins: only set signupLandingUrl when the user doesn't
  // already have one. Subsequent signins from different URLs don't
  // overwrite the origin.
  if (signupLandingUrl && !user.signupLandingUrl) {
    updateData.signupLandingUrl = signupLandingUrl;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // Person owns displayName. Forward the signin-form name so a freshly
  // created Person picks it up. Existing Persons keep whatever displayName
  // they already have — name updates flow through the profile editor.
  const person = await ensurePersonForUser(userId, {
    displayName: trimmedName,
  });

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
    personId: person.id,
    referralRecorded,
    userUpdated: Object.keys(updateData).length > 0,
  };
}

/**
 * Best-effort flyer hang inventory seed from saved/IP geo. Split out of
 * applyPostSigninSync so the route handler can run it via Next's after()
 * instead of awaiting it inline: Overpass can take up to 20s to answer
 * (see fetchOverpassFlyerHangPlaces's AbortSignal.timeout), and every
 * signin was blocking on that before returning a response. Never fail
 * signin if Overpass or task upserts error — the /poster page can retry
 * with browser geolocation.
 */
export async function seedNearbyFlyerHangTasksAfterSignin(
  userId: string,
  personId: string,
) {
  const locatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      city: true,
      countryCode: true,
      latitude: true,
      longitude: true,
      regionCode: true,
    },
  });
  if (
    locatedUser?.latitude == null ||
    locatedUser.longitude == null ||
    !Number.isFinite(locatedUser.latitude) ||
    !Number.isFinite(locatedUser.longitude)
  ) {
    return;
  }
  try {
    await ensureNearbyFlyerHangTasks({
      city: locatedUser.city,
      countryCode: locatedUser.countryCode,
      createdByUserId: userId,
      latitude: locatedUser.latitude,
      longitude: locatedUser.longitude,
      personId,
      regionCode: locatedUser.regionCode,
      userId,
    });
  } catch (error) {
    console.error("[FLYER HANG] Failed to seed nearby hang tasks", userId, error);
  }
}
