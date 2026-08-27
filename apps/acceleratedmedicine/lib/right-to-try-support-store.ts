import { createHash } from "node:crypto";

import {
  ContentVisibility,
  FormFieldType,
  FormPurpose,
  FormStatus,
  FormSubmissionStatus,
  ModelRevisionStatus,
  upsertWishoniaUser,
} from "@optimitron/db";

import { prisma } from "@/lib/prisma";
import { US_STATES } from "@/lib/right-to-try";
import type { RightToTrySupportInput } from "@/lib/right-to-try-support";

const FORM_SOURCE_KEY = "acceleratedmedicine:universal-right-to-try-support";
const FORM_TITLE = "Right to Trial participation";
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const SUBMISSIONS_PER_WINDOW = 5;

export class RightToTryRateLimitError extends Error {
  constructor() {
    super("Right to Try submission limit reached");
    this.name = "RightToTryRateLimitError";
  }
}

const formFields = [
  {
    key: "intent",
    prompt: "How this person wants to participate",
    type: FormFieldType.SINGLE_SELECT,
    required: true,
    optionsJson: ["state-support", "volunteer"],
  },
  {
    key: "name",
    prompt: "Your name",
    type: FormFieldType.SHORT_TEXT,
    required: false,
  },
  {
    key: "state",
    prompt: "Your state",
    type: FormFieldType.SINGLE_SELECT,
    required: true,
    optionsJson: US_STATES.map(([name]) => name),
  },
  {
    key: "position",
    prompt: "Should every patient in your state have the Right to Trial?",
    type: FormFieldType.SINGLE_SELECT,
    required: false,
    optionsJson: ["yes", "unsure", "no"],
  },
  {
    key: "role",
    prompt: "Your role",
    type: FormFieldType.SINGLE_SELECT,
    required: true,
    optionsJson: [
      "patient-or-caregiver",
      "clinician",
      "researcher",
      "public-educator",
      "other",
    ],
  },
  {
    key: "story",
    prompt: "Why does this matter to you?",
    type: FormFieldType.LONG_TEXT,
    required: false,
  },
  {
    key: "email",
    prompt: "Email",
    type: FormFieldType.EMAIL,
    required: false,
  },
  {
    key: "updates",
    prompt: "Send occasional Right to Trial updates",
    type: FormFieldType.BOOLEAN,
    required: true,
  },
  {
    key: "client-key",
    prompt: "Private abuse-prevention key",
    type: FormFieldType.SHORT_TEXT,
    required: true,
  },
] as const;

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function getCurrentFormRevision(actorUserId: string) {
  const definition = {
    fields: formFields.map((field, position) => ({ ...field, position })),
    purpose: FormPurpose.SURVEY,
    title: FORM_TITLE,
  };
  const contentHash = hashJson(definition);
  const form = await prisma.form.upsert({
    where: { sourceKey: FORM_SOURCE_KEY },
    create: {
      createdByUserId: actorUserId,
      purpose: FormPurpose.SURVEY,
      sourceKey: FORM_SOURCE_KEY,
      status: FormStatus.OPEN,
      title: FORM_TITLE,
      visibility: ContentVisibility.PRIVATE,
    },
    update: {},
    select: { currentRevisionId: true, id: true },
  });

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Form" WHERE "id" = ${form.id} FOR UPDATE
    `;
    let revision = await tx.formRevision.findUnique({
      where: { formId_contentHash: { contentHash, formId: form.id } },
      select: { id: true },
    });

    if (!revision) {
      const latest = await tx.formRevision.aggregate({
        where: { formId: form.id },
        _max: { version: true },
      });
      revision = await tx.formRevision.create({
        data: {
          contentHash,
          createdByUserId: actorUserId,
          formId: form.id,
          publishedAt: new Date(),
          status: ModelRevisionStatus.PUBLISHED,
          title: FORM_TITLE,
          version: (latest._max.version ?? 0) + 1,
        },
        select: { id: true },
      });
      await tx.formField.createMany({
        data: formFields.map((field, position) => ({
          formRevisionId: revision!.id,
          key: field.key,
          optionsJson: "optionsJson" in field ? field.optionsJson : undefined,
          position,
          prompt: field.prompt,
          required: field.required,
          type: field.type,
        })),
      });
    }

    if (form.currentRevisionId !== revision.id) {
      await tx.form.update({
        where: { id: form.id },
        data: { currentRevisionId: revision.id },
      });
    }

    const fields = await tx.formField.findMany({
      where: { deletedAt: null, formRevisionId: revision.id },
      select: { id: true, key: true },
    });
    return { fields, id: revision.id };
  });
}
export async function storeRightToTrySupport(
  input: RightToTrySupportInput,
  submissionKey: string,
  clientKey: string,
): Promise<{ submissionId: string }> {
  const { user } = await upsertWishoniaUser(prisma);
  const revision = await getCurrentFormRevision(user.id);
  const values: Record<string, boolean | string> = {
    intent: input.intent,
    name: input.name || "",
    state: input.state,
    position: input.position || "",
    role: input.role,
    story: input.story || "",
    email: input.email || "",
    updates: input.updates,
    "client-key": clientKey,
  };
  const requestHash = hashJson(values);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_advisory_xact_lock(hashtextextended(${clientKey}, 0)) AS locked
    `;
    const existing = await tx.formSubmission.findUnique({
      where: {
        createdByUserId_idempotencyKey: {
          createdByUserId: user.id,
          idempotencyKey: submissionKey,
        },
      },
      select: { id: true, requestHash: true },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new Error("Submission key was already used for another response");
      }
      return { submissionId: existing.id };
    }

    const clientKeyField = revision.fields.find(
      (field) => field.key === "client-key",
    );
    if (!clientKeyField) {
      throw new Error("Right to Try abuse-prevention field is unavailable");
    }
    const recentSubmissionCount = await tx.formResponse.count({
      where: {
        deletedAt: null,
        fieldId: clientKeyField.id,
        valueJson: { equals: clientKey },
        submission: {
          createdAt: {
            gte: new Date(Date.now() - SUBMISSION_WINDOW_MS),
          },
          deletedAt: null,
          status: FormSubmissionStatus.SUBMITTED,
        },
      },
    });
    if (recentSubmissionCount >= SUBMISSIONS_PER_WINDOW) {
      throw new RightToTryRateLimitError();
    }

    const submission = await tx.formSubmission.create({
      data: {
        createdByUserId: user.id,
        formRevisionId: revision.id,
        idempotencyKey: submissionKey,
        requestHash,
        status: FormSubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      select: { id: true },
    });
    await tx.formResponse.createMany({
      data: revision.fields.map((field) => ({
        fieldId: field.id,
        formRevisionId: revision.id,
        submissionId: submission.id,
        valueJson: values[field.key] ?? null,
      })),
    });
    return { submissionId: submission.id };
  });
}
