/**
 * DB smoke for brand apps against shared Optimitron Postgres.
 *
 * Verifies:
 * 1. DB reachable
 * 2. Referendum slug one-percent-treaty exists (or upserts a minimal ACTIVE row for CI)
 * 3. Can create User + Person + ReferendumVote and read it back
 * 4. Cleans up smoke rows
 *
 * Usage (from monorepo root):
 *   pnpm db:deploy
 *   pnpm smoke:warondisease-db
 *
 * Requires DATABASE_URL (same DB for web + all brand apps — do not use per-app DBs).
 */
import { PrismaPg } from "@prisma/adapter-pg"
import {
  PrismaClient,
  ReferendumKind,
  ReferendumStatus,
  VotePosition,
  TREATY_REFERENDUM_SLUG,
  PersonLifeStatus,
} from "@optimitron/db"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

function ok(msg: string) {
  console.log(`✓ ${msg}`)
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

async function ensureTreatyReferendum() {
  const existing = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
  })
  if (existing && !existing.deletedAt) {
    ok(`Referendum "${TREATY_REFERENDUM_SLUG}" present (${existing.status})`)
    return existing
  }

  const created = await prisma.referendum.upsert({
    where: { slug: TREATY_REFERENDUM_SLUG },
    update: {
      deletedAt: null,
      status: ReferendumStatus.ACTIVE,
    },
    create: {
      slug: TREATY_REFERENDUM_SLUG,
      title: "1% Treaty",
      question: "Should we adopt the 1% Treaty? (smoke fixture)",
      description: "Smoke-test referendum — prefer managed seed in full environments",
      kind: ReferendumKind.TREATY,
      status: ReferendumStatus.ACTIVE,
    },
  })
  ok(`Referendum "${TREATY_REFERENDUM_SLUG}" upserted for smoke`)
  return created
}

async function main() {
  console.log("warondisease treaty DB smoke")
  console.log(`DATABASE_URL host/db: ${databaseUrl.replace(/:[^:@/]+@/, ":***@")}`)

  await prisma.$queryRaw`SELECT 1`
  ok("Postgres reachable")

  const referendum = await ensureTreatyReferendum()

  const smokeEmail = `smoke-treaty-${Date.now()}@example.test`
  const user = await prisma.user.create({
    data: {
      email: smokeEmail,
    },
  })
  ok(`User ${user.id}`)

  const person = await prisma.person.create({
    data: {
      displayName: "Smoke Voter",
      email: smokeEmail,
      createdByUserId: user.id,
      sourceRef: `smoke:user:${user.id}`,
      // DB trigger: SELF votes require a living person
      lifeStatus: PersonLifeStatus.LIVING,
    },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { personId: person.id },
  })
  ok(`Person ${person.id}`)

  const vote = await prisma.referendumVote.upsert({
    where: {
      referendumId_personId: {
        referendumId: referendum.id,
        personId: person.id,
      },
    },
    update: { answer: VotePosition.YES, deletedAt: null },
    create: {
      userId: user.id,
      personId: person.id,
      referendumId: referendum.id,
      answer: VotePosition.YES,
    },
  })
  ok(`ReferendumVote ${vote.id} answer=${vote.answer}`)

  const found = await prisma.referendumVote.findFirst({
    where: {
      userId: user.id,
      referendumId: referendum.id,
      deletedAt: null,
    },
  })
  if (!found) fail("Could not re-read ReferendumVote")
  ok("Vote readable by userId + referendumId")

  await prisma.referendumVote.delete({ where: { id: vote.id } })
  await prisma.user.update({ where: { id: user.id }, data: { personId: null } })
  await prisma.person.delete({ where: { id: person.id } })
  await prisma.user.delete({ where: { id: user.id } })
  ok("Smoke rows cleaned up")

  console.log("smoke passed")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
