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

const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const SUBMISSIONS_PER_WINDOW = 5;
const CLIENT_KEY_FIELD = "client-key";

export interface StoredFormField {
  key: string;
  prompt: string;
  type: FormFieldType;
  required: boolean;
  optionsJson?: readonly string[];
}

/** A public site form. Each one is stored as a private Form, keyed by `sourceKey`. */
export interface StoredForm {
  sourceKey: string;
  title: string;
  purpose: FormPurpose;
  fields: readonly StoredFormField[];
}

export type StoredFormValues = Record<string, boolean | string | readonly string[]>;

export class FormSubmissionRateLimitError extends Error {
  constructor() {
    super("Form submission limit reached");
    this.name = "FormSubmissionRateLimitError";
  }
}

// Every form ends with the hashed client address, so the store can rate-limit it.
const clientKeyField: StoredFormField = {
  key: CLIENT_KEY_FIELD,
  prompt: "Private abuse-prevention key",
  type: FormFieldType.SHORT_TEXT,
  required: true,
};

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function getCurrentFormRevision(form: StoredForm, actorUserId: string) {
  const fields = [...form.fields, clientKeyField];
  const definition = {
    fields: fields.map((field, position) => ({ ...field, position })),
    purpose: form.purpose,
    title: form.title,
  };
  const contentHash = hashJson(definition);
  const storedForm = await prisma.form.upsert({
    where: { sourceKey: form.sourceKey },
    create: {
      createdByUserId: actorUserId,
      purpose: form.purpose,
      sourceKey: form.sourceKey,
      status: FormStatus.OPEN,
      title: form.title,
      visibility: ContentVisibility.PRIVATE,
    },
    update: {},
    select: { currentRevisionId: true, id: true },
  });

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Form" WHERE "id" = ${storedForm.id} FOR UPDATE
    `;
    let revision = await tx.formRevision.findUnique({
      where: { formId_contentHash: { contentHash, formId: storedForm.id } },
      select: { id: true },
    });

    if (!revision) {
      const latest = await tx.formRevision.aggregate({
        where: { formId: storedForm.id },
        _max: { version: true },
      });
      revision = await tx.formRevision.create({
        data: {
          contentHash,
          createdByUserId: actorUserId,
          formId: storedForm.id,
          publishedAt: new Date(),
          status: ModelRevisionStatus.PUBLISHED,
          title: form.title,
          version: (latest._max.version ?? 0) + 1,
        },
        select: { id: true },
      });
      await tx.formField.createMany({
        data: fields.map((field, position) => ({
          formRevisionId: revision!.id,
          key: field.key,
          optionsJson: field.optionsJson ? [...field.optionsJson] : undefined,
          position,
          prompt: field.prompt,
          required: field.required,
          type: field.type,
        })),
      });
    }

    if (storedForm.currentRevisionId !== revision.id) {
      await tx.form.update({
        where: { id: storedForm.id },
        data: { currentRevisionId: revision.id },
      });
    }

    const revisionFields = await tx.formField.findMany({
      where: { deletedAt: null, formRevisionId: revision.id },
      select: { id: true, key: true },
    });
    return { fields: revisionFields, id: revision.id };
  });
}

/**
 * Stores one submission. A retry with the same submission key and values
 * returns the first submission, even from a new connection.
 */
export async function storeFormSubmission(
  form: StoredForm,
  formValues: StoredFormValues,
  submissionKey: string,
  clientKey: string,
): Promise<{ submissionId: string }> {
  const { user } = await upsertWishoniaUser(prisma);
  const revision = await getCurrentFormRevision(form, user.id);
  const values: StoredFormValues = {
    ...formValues,
    [CLIENT_KEY_FIELD]: clientKey,
  };
  // The client key is left out, so a retry after a network change still matches.
  const requestHash = hashJson(formValues);

  return prisma.$transaction(async (tx) => {
    // The lock returns PostgreSQL void, which Prisma cannot deserialize as a row.
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${clientKey}, 0))
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

    const clientKeyFieldId = revision.fields.find(
      (field) => field.key === CLIENT_KEY_FIELD,
    )?.id;
    if (!clientKeyFieldId) {
      throw new Error("The form's abuse-prevention field is unavailable");
    }
    const recentSubmissionCount = await tx.formResponse.count({
      where: {
        deletedAt: null,
        fieldId: clientKeyFieldId,
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
      throw new FormSubmissionRateLimitError();
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
