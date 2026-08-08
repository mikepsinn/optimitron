import {
  PrismaClient,
  PersonLifeStatus,
  ReferendumKind,
  ReferendumStatus,
  TREATY_REFERENDUM_SLUG,
} from "@optimitron/db"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { execSync } from "child_process"
import "./test-env" // Load test environment variables
import { assertLocalDatabase } from "@/lib/db-safety"

// Note: Using console.log/warn/error in test utilities instead of logger
// to avoid circular dependencies and keep test setup simple

let prisma: PrismaClient | null = null
let pool: Pool | null = null

/**
 * Get or create a Prisma client instance for testing
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL is not set. Make sure .env.test is loaded correctly.'
      )
    }

    // CRITICAL SAFETY CHECK: Prevent tests from running against production
    assertLocalDatabase(dbUrl, { operation: "Test database access" })

    // Prisma 7: Create PostgreSQL pool and adapter
    // Add connection timeout to prevent hanging
    const urlWithTimeout = dbUrl.includes('?')
      ? `${dbUrl}&connect_timeout=2`
      : `${dbUrl}?connect_timeout=2`

    pool = new Pool({ connectionString: urlWithTimeout })
    const adapter = new PrismaPg(pool)

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "test" ? [] : ["query", "info", "warn", "error"],
    })
  }
  return prisma
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const prisma = getPrismaClient()
    await prisma.$executeRaw`SELECT 1`
    return true
  } catch (error) {
    console.debug("Database not available:", error)
    return false
  }
}

/**
 * Setup test database - run migrations
 * Throws error if database is not available or is production database
 */
export async function setupTestDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Make sure .env.test is loaded correctly.')
  }

  // CRITICAL SAFETY CHECK: Prevent migrations against production
  assertLocalDatabase(dbUrl, { operation: "Test database migration" })

  // Check if database is available first
  const dbAvailable = await isDatabaseAvailable()
  if (!dbAvailable) {
    throw new Error("Test database not available. Please start PostgreSQL.")
  }

  console.log("Setting up test database...")

  // Run Prisma migrations
  execSync("pnpm prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
    stdio: "pipe", // Suppress output
  })

  console.log("✅ Test database setup complete")
}

/**
 * Clean mutable app data between tests.
 * Leaves Referendum rows (treaty seed) so vote helpers keep working.
 */
export async function cleanDatabase() {
  const prisma = getPrismaClient()

  const tables = [
    "EmailLog",
    "Notification",
    "Activity",
    "Badge",
    "SocialAccount",
    "ReferralInvitation",
    "ReferendumVote",
    "OrganizationMember",
    "OrganizationName",
    "Session",
    "Account",
    "Person",
    "User",
    "Organization",
  ]

  const failedTables: string[] = []

  // Try to disable foreign key checks (may not work on all databases)
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`)
  } catch (error) {
    console.debug("Could not disable foreign key checks:", error)
  }

  // Delete all data from tables (in reverse order to handle foreign keys)
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`)
    } catch (deleteError) {
      // If DELETE fails, try TRUNCATE
      console.debug(`DELETE failed for ${table}, trying TRUNCATE:`, deleteError)
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
      } catch (truncateError) {
        // Table cleanup failed - this might be OK if table doesn't exist
        console.warn(`Could not clear table ${table}:`, truncateError)
        failedTables.push(table)
      }
    }
  }

  // Try to re-enable foreign key checks
  try {
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`)
  } catch (error) {
    console.debug("Could not re-enable foreign key checks:", error)
  }

  // If we couldn't clean critical tables, throw to prevent test pollution
  if (failedTables.length > 0) {
    throw new Error(`Failed to clean tables: ${failedTables.join(', ')}. This could lead to test pollution.`)
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
  if (pool) {
    await pool.end()
    pool = null
  }
}

/**
 * Ensure the 1% Treaty referendum exists for vote tests.
 */
export async function ensureTreatyReferendum() {
  const prisma = getPrismaClient()

  return prisma.referendum.upsert({
    where: { slug: TREATY_REFERENDUM_SLUG },
    update: {
      deletedAt: null,
      status: ReferendumStatus.ACTIVE,
    },
    create: {
      slug: TREATY_REFERENDUM_SLUG,
      title: "1% Treaty",
      question: "Should we adopt the 1% Treaty? (test fixture)",
      description: "Test referendum fixture",
      kind: ReferendumKind.TREATY,
      status: ReferendumStatus.ACTIVE,
    },
  })
}

/**
 * Seed test data aligned with Optimitron schema (User has no name; votes use Person).
 */
export async function seedTestData() {
  const prisma = getPrismaClient()

  const referendum = await ensureTreatyReferendum()

  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      password: "$2a$10$K7L1OJ0TfPKg5W3gqWFzOemFz7B9xDhKGqzvZ/FqBhGZWgHVqr/Eu", // password: "password123"
      referralCode: "TEST123",
      emailVerified: new Date(),
    },
  })

  const testPerson = await prisma.person.create({
    data: {
      displayName: "Test User",
      email: "test@example.com",
      createdByUserId: testUser.id,
      sourceRef: `test:user:${testUser.id}`,
      lifeStatus: PersonLifeStatus.LIVING,
      isPublic: true,
    },
  })

  await prisma.user.update({
    where: { id: testUser.id },
    data: { personId: testPerson.id },
  })

  const testOrg = await prisma.organization.create({
    data: {
      name: "Test Organization",
      slug: "test-organization",
      description: "Test organization for testing",
      type: "NONPROFIT",
      contactEmail: "test@testorg.com",
    },
  })

  return {
    testUser: { ...testUser, personId: testPerson.id },
    testPerson,
    testOrg,
    referendum,
  }
}
