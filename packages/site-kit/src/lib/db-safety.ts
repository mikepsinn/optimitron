/**
 * Database safety guards.
 *
 * Use `assertLocalDatabase` before any destructive operation (migration reset,
 * table truncate, schema diff-and-push) to ensure the connection string points
 * at a local Postgres, not a production Neon instance.
 *
 * This module has zero runtime dependencies so it can be imported from
 * scripts, tests, and library code alike.
 */

export class ProductionDatabaseAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProductionDatabaseAccessError"
  }
}

export interface AssertLocalDatabaseOptions {
  /** Context shown in the error message — e.g. "Tests", "Migration reset". */
  operation?: string
}

/**
 * Throws if the provided connection string looks like a production database.
 *
 * Rejects:
 * - URLs containing `neon.tech`, `.neon.`, or `neondb`
 * - URLs with `sslmode=require` where the host isn't localhost
 * - Any URL whose host isn't `localhost` or `127.0.0.1`
 *
 * This is deliberately conservative. We'd rather throw on a weird-but-safe URL
 * than silently run a destructive operation on the wrong database.
 */
export function assertLocalDatabase(
  url: string | undefined | null,
  options: AssertLocalDatabaseOptions = {}
): void {
  const op = options.operation ?? "This operation"

  if (!url) {
    throw new ProductionDatabaseAccessError(
      `🚨 ${op} requires DATABASE_URL, but it's not set. Refusing to proceed.`
    )
  }

  // Neon indicators
  if (url.includes("neon.tech") || url.includes(".neon.") || url.includes("neondb")) {
    throw new ProductionDatabaseAccessError(
      `🚨 SAFETY CHECK FAILED: ${op} attempted against production Neon database!\n` +
        `DATABASE_URL contains Neon production indicators (neon.tech / neondb).\n` +
        `This operation is only allowed on local Postgres.\n` +
        `Current URL: ${url.substring(0, 30)}...`
    )
  }

  // Remote SSL = almost certainly prod
  if (url.includes("sslmode=require") && !url.includes("localhost")) {
    throw new ProductionDatabaseAccessError(
      `🚨 SAFETY CHECK FAILED: ${op} attempted against remote SSL database!\n` +
        `DATABASE_URL has sslmode=require and isn't localhost.\n` +
        `Current URL: ${url.substring(0, 30)}...`
    )
  }

  // Final fallback: require localhost or 127.0.0.1
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new ProductionDatabaseAccessError(
      `🚨 SAFETY CHECK FAILED: ${op} must use a localhost database!\n` +
        `DATABASE_URL does not contain "localhost" or "127.0.0.1".\n` +
        `Current URL: ${url.substring(0, 30)}...`
    )
  }
}

/**
 * Returns true if the URL points at a local database.
 * Non-throwing variant for places that want to branch on environment.
 */
export function isLocalDatabaseUrl(url: string | undefined | null): boolean {
  if (!url) return false
  try {
    assertLocalDatabase(url)
    return true
  } catch {
    return false
  }
}
