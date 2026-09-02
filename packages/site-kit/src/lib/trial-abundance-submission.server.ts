import { createHash } from "node:crypto"
import {
  ContentVisibility, FormFieldType, FormPurpose, FormStatus,
  FormSubmissionStatus, ModelRevisionStatus, SubjectType, upsertWishoniaUser,
  TRIAL_ABUNDANCE_REFERENDUM_QUESTION, TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION,
} from "@optimitron/db"
import type { Prisma } from "@optimitron/db"
import { prisma } from "./prisma"
import type { TrialAbundanceResponseInput } from "./trial-abundance-response"
import { SURVEY_UPDATES_LABEL } from "./survey-participant"

export const TRIAL_ABUNDANCE_FORM_KEY = "trial-abundance:verified-response"

const fields = [
  ["patientAccessAnswer", TRIAL_ABUNDANCE_REFERENDUM_QUESTION, FormFieldType.SINGLE_SELECT],
  ["selfFundedAccessAnswer", TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_QUESTION, FormFieldType.SINGLE_SELECT],
  ["militaryAllocationPercent", "Military allocation percentage", FormFieldType.NUMBER],
  ["countryCode", "Country", FormFieldType.SHORT_TEXT],
  ["regionCode", "State / region", FormFieldType.SHORT_TEXT],
  ["role", "Your role", FormFieldType.SINGLE_SELECT],
  ["story", "Why does this matter to you?", FormFieldType.LONG_TEXT],
  ["updates", SURVEY_UPDATES_LABEL, FormFieldType.BOOLEAN],
  ["email", "Verified account email", FormFieldType.EMAIL],
  ["sourceUrl", "Survey page", FormFieldType.URL],
] as const

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export async function getTrialAbundanceFormRevision() {
  const { user } = await upsertWishoniaUser(prisma)
  const contentHash = hash(fields)
  const form = await prisma.form.upsert({
    where: { sourceKey: TRIAL_ABUNDANCE_FORM_KEY },
    update: {},
    create: {
      sourceKey: TRIAL_ABUNDANCE_FORM_KEY, title: "Trial Abundance Survey",
      createdByUserId: user.id, purpose: FormPurpose.SURVEY,
      status: FormStatus.OPEN, visibility: ContentVisibility.PRIVATE,
    },
  })
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Form" WHERE "id" = ${form.id} FOR UPDATE`
    let revision = await tx.formRevision.findUnique({
      where: { formId_contentHash: { formId: form.id, contentHash } },
    })
    if (!revision) {
      const latest = await tx.formRevision.aggregate({ where: { formId: form.id }, _max: { version: true } })
      revision = await tx.formRevision.create({ data: {
        formId: form.id, contentHash, version: (latest._max.version ?? 0) + 1,
        title: form.title, createdByUserId: user.id,
        status: ModelRevisionStatus.PUBLISHED, publishedAt: new Date(),
        fields: { create: fields.map(([key, prompt, type], position) => ({ key, prompt, type, position })) },
      } })
    }
    await tx.form.update({ where: { id: form.id }, data: { currentRevisionId: revision.id } })
    return tx.formRevision.findUniqueOrThrow({ where: { id: revision.id }, include: { fields: true } })
  })
}

export function getSurveySubmissionIdentity(input: TrialAbundanceResponseInput) {
  const requestHash = hash(input)
  return { requestHash, idempotencyKey: input.submissionKey ?? `legacy:${requestHash}` }
}

export async function saveSurveySubmission(
  tx: Prisma.TransactionClient,
  input: TrialAbundanceResponseInput,
  user: { id: string; email: string },
  person: { id: string; displayName: string },
  revision: Awaited<ReturnType<typeof getTrialAbundanceFormRevision>>,
) {
  const subject = await tx.subject.upsert({
    where: { personId: person.id },
    update: {},
    create: { personId: person.id, displayName: person.displayName, subjectType: SubjectType.PERSON },
  })
  const participant = input.participant
  const values: Record<string, string | number | boolean | null> = {
    patientAccessAnswer: input.patientAccessAnswer,
    selfFundedAccessAnswer: input.selfFundedAccessAnswer,
    militaryAllocationPercent: input.militaryAllocationPercent,
    countryCode: participant?.countryCode ?? null,
    regionCode: participant?.regionCode ?? null,
    role: participant?.role ?? null,
    story: participant?.story ?? null,
    updates: participant?.updates ?? null,
    email: user.email,
    sourceUrl: input.sourceUrl ?? null,
  }
  const submission = await tx.formSubmission.create({ data: {
    formRevisionId: revision.id, createdByUserId: user.id, respondentUserId: user.id,
    subjectId: subject.id, status: FormSubmissionStatus.SUBMITTED, submittedAt: new Date(),
    ...getSurveySubmissionIdentity(input),
  } })
  await tx.formResponse.createMany({ data: revision.fields.map((field) => ({
    submissionId: submission.id, fieldId: field.id, formRevisionId: revision.id,
    valueJson: values[field.key] ?? undefined,
  })) })
  if (participant) {
    // Consent stays scoped to this survey. It never changes a global email opt-out.
    await tx.user.update({ where: { id: user.id }, data: {
      countryCode: participant.countryCode, regionCode: participant.regionCode || null,
    } })
    await tx.person.update({ where: { id: person.id }, data: { countryCode: participant.countryCode } })
  }
  return submission
}
