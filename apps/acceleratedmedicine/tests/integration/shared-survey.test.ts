import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import {
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
} from "@optimitron/db"
import { POST } from "../../app/api/votes/sync/route"
import { GET } from "../../app/api/survey/profile/route"
import { POST as postTrialAbundance } from "../../../trialabundancesurvey/app/api/votes/sync/route"
import { prisma } from "../../lib/prisma"
import { createAuthAdapter } from "@optimitron/site-kit/lib/auth-adapter"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.hoisted(() => {
  vi.stubEnv("NEXTAUTH_SECRET", "shared-survey-local-integration-secret")
  vi.stubEnv("NEXTAUTH_URL", "http://localhost:3001")
  vi.stubEnv("OUTBOUND_EMAIL_MODE", "off")
  vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", "acceleratedmedicine.org")
})

let userId: string
let email: string
const input = {
  submissionKey: randomUUID(),
  patientAccessAnswer: "YES", selfFundedAccessAnswer: "ABSTAIN",
  militaryAllocationPercent: 35,
  sourceUrl: "https://acceleratedmedicine.org/survey",
  timestamp: "2026-09-02T12:00:00.000Z",
  participant: {
    countryCode: "US", regionCode: "Missouri", role: "patient-or-caregiver",
    story: "Local integration test", updates: false,
  },
}
const createdReferendums: string[] = []

function submit(body = input, handler = POST) {
  return handler(new Request("http://localhost/api/votes/sync", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }))
}

beforeAll(async () => {
  for (const slug of [TRIAL_ABUNDANCE_REFERENDUM_SLUG, TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG]) {
    if (!await prisma.referendum.findUnique({ where: { slug } })) {
      const referendum = await prisma.referendum.create({ data: { slug, title: slug, question: "Test question" } })
      createdReferendums.push(referendum.id)
    }
  }
})

beforeEach(async () => {
  email = `shared-survey-test-${randomUUID()}@example.invalid`
  const user = await createAuthAdapter().createUser!({ email, emailVerified: new Date("2026-09-02T12:00:00Z"), name: "Survey test" })
  userId = user.id
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId, email }, expires: "2099-01-01" })
})

afterEach(async () => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  await prisma.formResponse.deleteMany({ where: { submission: { respondentUserId: userId } } })
  await prisma.formSubmission.deleteMany({ where: { respondentUserId: userId } })
  await prisma.referendumVote.deleteMany({ where: { userId } })
  await prisma.wishocraticAllocation.deleteMany({ where: { userId } })
  await prisma.activity.deleteMany({ where: { userId } })
  if (user?.personId) await prisma.subject.deleteMany({ where: { personId: user.personId } })
  await prisma.user.delete({ where: { id: userId } })
  if (user?.personId) await prisma.person.delete({ where: { id: user.personId } })
})

afterAll(async () => {
  await prisma.referendum.deleteMany({ where: { id: { in: createdReferendums } } })
  await prisma.$disconnect()
  vi.unstubAllEnvs()
})

describe("both survey routes with PostgreSQL", () => {
  it("records one first-response activity when both apps submit different drafts concurrently", async () => {
    const results = await Promise.all([
      submit(input, POST),
      submit({ ...input, submissionKey: randomUUID() }, postTrialAbundance),
    ])
    expect(results.map((result) => result.status)).toEqual([200, 200])
    expect(await prisma.formSubmission.count({ where: { respondentUserId: userId } })).toBe(2)
    expect(await prisma.referendumVote.count({ where: { userId } })).toBe(2)
    expect(await prisma.activity.count({ where: { userId, type: "VOTED_REFERENDUM" } })).toBe(1)
  })

  it("rejects anonymous submissions on both sites without any database response", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    for (const handler of [POST, postTrialAbundance]) {
      expect((await submit(input, handler)).status).toBe(401)
    }
    expect(await prisma.formSubmission.count({ where: { respondentUserId: userId } })).toBe(0)
  })

  it("saves answers, consent and profile together; retries preserve the original submission", async () => {
    expect((await submit()).status).toBe(200)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { person: true } })
    expect(user).toMatchObject({ countryCode: "US", regionCode: "Missouri", newsletterSubscribed: false })
    expect(user.person?.countryCode).toBe("US")
    const submission = await prisma.formSubmission.findFirstOrThrow({
      where: { respondentUserId: userId, idempotencyKey: input.submissionKey },
      include: { subject: true, responses: { include: { field: true } } },
    })
    expect(submission.subject?.personId).toBe(user.personId)
    expect(submission.submittedAt).toBeInstanceOf(Date)
    expect(Object.fromEntries(submission.responses.map((response) => [response.field.key, response.valueJson])))
      .toMatchObject({ ...input.participant, email, patientAccessAnswer: "YES", selfFundedAccessAnswer: "ABSTAIN", militaryAllocationPercent: 35 })
    expect(await prisma.referendumVote.count({ where: { userId } })).toBe(2)
    expect(await prisma.wishocraticAllocation.findFirst({ where: { userId } }))
      .toMatchObject({ allocationA: 35, allocationB: 65 })
    expect(await (await GET()).json()).toEqual({ countryCode: "US", regionCode: "Missouri", role: "patient-or-caregiver" })

    // A new response changes the reusable profile; replaying an old request must not undo it.
    const changed = { ...input, submissionKey: randomUUID(), participant: { ...input.participant, countryCode: "CA", regionCode: "Ontario", updates: true } }
    expect((await submit(changed, postTrialAbundance)).status).toBe(200)
    const retries = await Promise.all([submit(), submit(input, postTrialAbundance)])
    expect(retries.map((response) => response.status)).toEqual([200, 200])
    expect(await prisma.formSubmission.count({ where: { respondentUserId: userId } })).toBe(2)
    expect(await prisma.user.findUnique({ where: { id: userId } }))
      .toMatchObject({ countryCode: "CA", regionCode: "Ontario", newsletterSubscribed: false })
    // Invalid details must not change either the profile or existing votes.
    expect((await submit({ ...input, submissionKey: randomUUID(), patientAccessAnswer: "NO", participant: { ...input.participant, regionCode: "" } })).status).toBe(400)
    expect(await prisma.user.findUnique({ where: { id: userId } })).toMatchObject({ countryCode: "CA" })
    const vote = await prisma.referendumVote.findFirst({ where: { userId, referendum: { slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG } } })
    expect(vote?.answer).toBe("YES")
  })
})
