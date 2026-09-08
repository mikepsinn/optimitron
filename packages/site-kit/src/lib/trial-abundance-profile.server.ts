import { FormSubmissionStatus, Prisma, SubjectType } from "@optimitron/db"
import { prisma } from "./prisma"
import { ensurePersonForUser } from "./person.server"
import type { SurveyProfile } from "./survey-participant"
import {
  getTrialAbundanceProfileFormRevision, TRIAL_ABUNDANCE_FORM_KEY,
  TRIAL_ABUNDANCE_PROFILE_FORM_KEY,
} from "./trial-abundance-submission.server"

export async function getSurveyProfile(userId: string) {
  const [user, submission] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { countryCode: true, regionCode: true } }),
    prisma.formSubmission.findFirst({
      where: {
        respondentUserId: userId, deletedAt: null, status: "SUBMITTED",
        formRevision: { form: { sourceKey: { in: [TRIAL_ABUNDANCE_FORM_KEY, TRIAL_ABUNDANCE_PROFILE_FORM_KEY] } } },
        // Answer-only submissions must not hide a previously saved profile.
        responses: { some: { deletedAt: null, field: { key: "role" }, valueJson: { not: Prisma.DbNull } } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { responses: { where: { deletedAt: null, field: { key: { in: ["role", "story", "updates"] } } }, select: { valueJson: true, field: { select: { key: true } } } } },
    }),
  ])
  const values = Object.fromEntries(submission?.responses.map(({ field, valueJson }) => [field.key, valueJson]) ?? [])
  return {
    countryCode: user.countryCode ?? "", regionCode: user.regionCode ?? "",
    role: typeof values.role === "string" ? values.role : "",
    story: typeof values.story === "string" ? values.story : "",
    updates: values.updates === true,
    hasProfile: Boolean(submission),
  }
}

export async function saveSurveyProfile(userId: string, profile: SurveyProfile) {
  const person = await ensurePersonForUser(userId)
  const revision = await getTrialAbundanceProfileFormRevision()
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`trial-abundance:${userId}`}, 0))`
    const subject = await tx.subject.upsert({
      where: { personId: person.id }, update: {},
      create: { personId: person.id, displayName: person.displayName, subjectType: SubjectType.PERSON },
    })
    const submission = await tx.formSubmission.create({ data: {
      formRevisionId: revision.id, createdByUserId: userId, respondentUserId: userId,
      subjectId: subject.id, status: FormSubmissionStatus.SUBMITTED, submittedAt: new Date(),
    } })
    await tx.formResponse.createMany({ data: revision.fields.map((field) => ({
      submissionId: submission.id, fieldId: field.id, formRevisionId: revision.id,
      valueJson: profile[field.key as keyof SurveyProfile],
    })) })
    await tx.user.update({ where: { id: userId }, data: {
      countryCode: profile.countryCode || null, regionCode: profile.regionCode || null,
    } })
    await tx.person.update({ where: { id: person.id }, data: { countryCode: profile.countryCode || null } })
    // Survey consent never overrides the account's global email opt-out.
  })
}
