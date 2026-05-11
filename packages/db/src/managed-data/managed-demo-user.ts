import type { PrismaClient } from "../generated/prisma/client.js";

// Demo user — product-facing tour/onboarding account.
// Synced on every `pnpm db:sync:managed-data --apply`.
// The legacy email migration (demo@optimitron.org → demo@thinkbynumbers.org)
// and the raw-SQL "upsert failed" fallback from the old seed version are
// intentionally dropped — legacy email is long migrated, and raw-SQL inside
// a catch is the kind of error-swallowing this codebase bans (see
// feedback_dont_swallow_errors).

export const DEMO_EMAIL = "demo@thinkbynumbers.org";

// Pre-hashed bcrypt(12) of "demo1234". Hardcoded so the demo password
// stays stable across environments without us shipping the plaintext.
const DEMO_PASSWORD_HASH =
  "$2b$12$Hy27qJOTykSezth61xRCJ..sMPVvzWxs9wZEEsEsYn9o3GaUYkGCa";

export async function syncManagedDemoUser(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ upserted: boolean; dryRun: boolean }> {
  if (!options.apply) return { upserted: false, dryRun: true };

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      password: DEMO_PASSWORD_HASH,
      emailVerified: new Date(),
    },
    create: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD_HASH,
      emailVerified: new Date(),
      referralCode: "DEMO",
    },
  });

  // Person owns the public-display fields (handle / displayName / image).
  const person = await prisma.person.upsert({
    where: { email: DEMO_EMAIL },
    update: { displayName: "Demo User", handle: "demo" },
    create: { email: DEMO_EMAIL, displayName: "Demo User", handle: "demo" },
  });

  if (user.personId !== person.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { personId: person.id },
    });
  }

  return { upserted: true, dryRun: false };
}

export function formatManagedDemoUserResult(
  result: { upserted: boolean; dryRun: boolean },
): string {
  if (result.dryRun) return "Demo user: would sync (dry-run)";
  return result.upserted ? "Demo user: synced" : "Demo user: unchanged";
}
