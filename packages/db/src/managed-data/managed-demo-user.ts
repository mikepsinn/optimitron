// Demo user fixture — product-facing tour/onboarding account.
//
// Migrated from `prisma/seed.ts`'s `seedDemoUser()` into managed-data so
// the `pnpm db:sync:managed-data --apply` deploy step keeps the account
// live in every environment (prod, preview, CI, local). The legacy email
// migration branch (`demo@optimitron.org` → `demo@thinkbynumbers.org`)
// and the raw-SQL fallback from the seed version are intentionally NOT
// carried over — by now the legacy email has long been migrated, and
// raw-SQL inside an "upsert failed" catch is the kind of error-
// swallowing that this codebase otherwise bans (see
// feedback_dont_swallow_errors).

export const DEMO_EMAIL = "demo@thinkbynumbers.org";
// Pre-hashed bcrypt(12) of "demo1234". Hardcoded so the demo password
// stays stable across environments without us having to ship the
// plaintext anywhere.
const DEMO_PASSWORD_HASH =
  "$2b$12$Hy27qJOTykSezth61xRCJ..sMPVvzWxs9wZEEsEsYn9o3GaUYkGCa";

export interface ManagedDemoUserClient {
  user: {
    upsert(args: unknown): Promise<{ id: string; personId: string | null }>;
    update(args: unknown): Promise<{ id: string }>;
  };
  person: {
    upsert(args: unknown): Promise<{ id: string }>;
  };
}

export interface SyncManagedDemoUserOptions {
  apply: boolean;
}

export interface SyncManagedDemoUserResult {
  upserted: boolean;
}

export async function syncManagedDemoUser(
  client: ManagedDemoUserClient,
  options: SyncManagedDemoUserOptions,
): Promise<SyncManagedDemoUserResult> {
  if (!options.apply) return { upserted: true };

  const user = await client.user.upsert({
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
  const person = await client.person.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      displayName: "Demo User",
      handle: "demo",
    },
    create: {
      email: DEMO_EMAIL,
      displayName: "Demo User",
      handle: "demo",
    },
  });

  if (user.personId !== person.id) {
    await client.user.update({
      where: { id: user.id },
      data: { personId: person.id },
    });
  }

  return { upserted: true };
}

export function formatManagedDemoUserResult(
  result: SyncManagedDemoUserResult,
): string {
  return result.upserted ? "Demo user: synced" : "Demo user: unchanged";
}
