import {
  CollectionFieldType,
  ContentVisibility,
  OrgType,
  SourceArtifactType,
} from "@optimitron/db/enums";
import { z } from "zod";
import {
  collectionFilterSchema,
  collectionSortSchema,
} from "@/lib/collections.server";
import { TASK_COMMENT_ATTACHMENT_MAX_BYTES } from "@/lib/tasks/task-comment-attachment-policy";

const optionalId = z.string().trim().min(1).nullable().optional();
const optionalUrl = z.string().url().nullable().optional();
const maxAttachmentBase64Length =
  Math.ceil(TASK_COMMENT_ATTACHMENT_MAX_BYTES / 3) * 4 + 4_096;

export const notionImportFieldSchema = z
  .object({
    key: z.string(),
    name: z.string(),
    optionsJson: z.unknown().optional(),
    position: z.number().int().nonnegative().optional(),
    required: z.boolean().optional(),
    targetCollectionId: optionalId,
    targetCollectionSourceId: optionalId,
    type: z.nativeEnum(CollectionFieldType),
  })
  .superRefine((field, context) => {
    if (field.targetCollectionId && field.targetCollectionSourceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Specify targetCollectionId or targetCollectionSourceId, not both.",
      });
    }
  });

export const notionImportRelationSchema = z
  .object({
    fieldKey: z.string().trim().min(1),
    position: z.number().int().nonnegative().optional(),
    targetCollectionSourceId: optionalId,
    targetDocumentId: optionalId,
    targetDocumentSourceId: optionalId,
    targetOrganizationId: optionalId,
    targetOrganizationSourceId: optionalId,
    targetPersonId: optionalId,
    targetPersonSourceId: optionalId,
    targetRecordId: optionalId,
    targetRecordSourceId: optionalId,
    targetTaskId: optionalId,
    targetTaskSourceId: optionalId,
  })
  .superRefine((relation, context) => {
    const directTargets = [
      relation.targetDocumentId,
      relation.targetOrganizationId,
      relation.targetPersonId,
      relation.targetRecordId,
      relation.targetTaskId,
    ].filter(Boolean).length;
    const sourceTargets = [
      relation.targetDocumentSourceId,
      relation.targetOrganizationSourceId,
      relation.targetPersonSourceId,
      relation.targetRecordSourceId,
      relation.targetTaskSourceId,
    ].filter(Boolean).length;
    if (directTargets + sourceTargets !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each relation requires exactly one target.",
      });
    }
    if (relation.targetRecordSourceId && !relation.targetCollectionSourceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A targetRecordSourceId also requires targetCollectionSourceId.",
      });
    }
  });

const sourceBaseSchema = z.object({
  raw: z.unknown().optional(),
  sourceId: z.string().trim().min(1).max(1_000),
  url: optionalUrl,
});

export const notionImportBundleSchema = z
  .object({
    attachments: z
      .array(
        sourceBaseSchema
          .extend({
            base64: z.string().min(1).max(maxAttachmentBase64Length),
            collectionRecordSourceId: optionalId,
            collectionSourceId: optionalId,
            contentType: z.string().trim().min(1),
            documentSourceId: optionalId,
            fileName: z.string().trim().min(1),
          })
          .superRefine((attachment, context) => {
            const hasDocument = Boolean(attachment.documentSourceId);
            const hasRecord = Boolean(
              attachment.collectionSourceId &&
              attachment.collectionRecordSourceId,
            );
            if (Number(hasDocument) + Number(hasRecord) !== 1) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                  "An attachment requires one document source or one collection record source.",
              });
            }
          }),
      )
      .max(10_000)
      .default([]),
    collections: z
      .array(
        sourceBaseSchema.extend({
          description: z.string().nullable().optional(),
          fields: z.array(notionImportFieldSchema).max(200).default([]),
          name: z.string().trim().min(1).max(200),
          organizationId: optionalId,
          organizationSourceId: optionalId,
          records: z
            .array(
              sourceBaseSchema.extend({
                documentId: optionalId,
                documentSourceId: optionalId,
                organizationId: optionalId,
                organizationSourceId: optionalId,
                personId: optionalId,
                personSourceId: optionalId,
                relations: z
                  .array(notionImportRelationSchema)
                  .max(2_000)
                  .default([]),
                taskId: optionalId,
                taskSourceId: optionalId,
                values: z.record(z.unknown()).default({}),
              }),
            )
            .max(20_000)
            .default([]),
          views: z
            .array(
              z.object({
                filters: z.array(collectionFilterSchema).default([]),
                isDefault: z.boolean().default(false),
                name: z.string().trim().min(1).max(200),
                sorts: z.array(collectionSortSchema).default([]),
                visibleFieldKeys: z.array(z.string()).default([]),
              }),
            )
            .max(100)
            .default([]),
          visibility: z
            .nativeEnum(ContentVisibility)
            .default(ContentVisibility.PRIVATE),
        }),
      )
      .max(500)
      .default([]),
    documents: z
      .array(
        sourceBaseSchema.extend({
          markdown: z.string().min(1).max(500_000),
          organizationId: optionalId,
          organizationSourceId: optionalId,
          parentSourceId: optionalId,
          taskId: optionalId,
          taskSourceId: optionalId,
          title: z.string().trim().min(1).max(300),
          visibility: z
            .nativeEnum(ContentVisibility)
            .default(ContentVisibility.PRIVATE),
        }),
      )
      .max(5_000)
      .default([]),
    export: sourceBaseSchema
      .extend({
        exportedAt: z.string().datetime().nullable().optional(),
        title: z.string().trim().min(1).max(300).default("Notion export"),
      })
      .optional(),
    organizations: z
      .array(
        sourceBaseSchema.extend({
          contactEmail: z.string().email().nullable().optional(),
          description: z.string().nullable().optional(),
          name: z.string().trim().min(1).max(300),
          slug: z.string().trim().min(1).max(200).nullable().optional(),
          type: z.nativeEnum(OrgType).default(OrgType.OTHER),
          website: optionalUrl,
        }),
      )
      .max(2_000)
      .default([]),
    people: z
      .array(
        sourceBaseSchema.extend({
          bio: z.string().nullable().optional(),
          displayName: z.string().trim().min(1).max(300),
          email: z.string().email().nullable().optional(),
        }),
      )
      .max(10_000)
      .default([]),
    preservedArtifacts: z
      .array(
        sourceBaseSchema.extend({
          artifactType: z
            .nativeEnum(SourceArtifactType)
            .refine(
              (value) =>
                value === SourceArtifactType.NOTION_PAGE ||
                value === SourceArtifactType.NOTION_DATABASE ||
                value === SourceArtifactType.NOTION_EXPORT,
              "Only Notion artifact types are allowed.",
            ),
          title: z.string().trim().min(1).max(300).nullable().optional(),
        }),
      )
      .max(10_000)
      .default([]),
    tasks: z
      .array(
        sourceBaseSchema.extend({
          acceptanceCriteria: z.array(z.string()).max(100).default([]),
          dependencySourceIds: z.array(z.string()).max(1_000).default([]),
          description: z.string().nullable().optional(),
          dueAt: z.string().datetime().nullable().optional(),
          estimatedEffortHours: z
            .number()
            .finite()
            .nonnegative()
            .nullable()
            .optional(),
          parentSourceId: optionalId,
          title: z.string().trim().min(1).max(300),
        }),
      )
      .max(10_000)
      .default([]),
    workspaceId: z.string().trim().min(1).max(1_000),
    workspaceName: z.string().trim().min(1).max(300).nullable().optional(),
  })
  .superRefine((bundle, context) => {
    const exclusive = (
      directId: string | null | undefined,
      sourceId: string | null | undefined,
      path: Array<string | number>,
      label: string,
    ) => {
      if (directId && sourceId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Specify a direct ${label} ID or source ID, not both.`,
          path,
        });
      }
    };

    bundle.collections.forEach((collection, collectionIndex) => {
      exclusive(
        collection.organizationId,
        collection.organizationSourceId,
        ["collections", collectionIndex],
        "organization",
      );
      collection.records.forEach((record, recordIndex) => {
        const path = ["collections", collectionIndex, "records", recordIndex];
        exclusive(record.documentId, record.documentSourceId, path, "document");
        exclusive(
          record.organizationId,
          record.organizationSourceId,
          path,
          "organization",
        );
        exclusive(record.personId, record.personSourceId, path, "person");
        exclusive(record.taskId, record.taskSourceId, path, "task");
        const canonicalTargets = [
          record.documentId ?? record.documentSourceId,
          record.organizationId ?? record.organizationSourceId,
          record.personId ?? record.personSourceId,
          record.taskId ?? record.taskSourceId,
        ].filter(Boolean);
        if (canonicalTargets.length > 1) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A record may represent at most one canonical entity.",
            path,
          });
        }
      });
    });

    bundle.documents.forEach((document, documentIndex) => {
      const path = ["documents", documentIndex];
      exclusive(
        document.organizationId,
        document.organizationSourceId,
        path,
        "organization",
      );
      exclusive(document.taskId, document.taskSourceId, path, "task");
    });
  });

export type NotionImportBundle = z.infer<typeof notionImportBundleSchema>;
export type NotionImportCollection = NotionImportBundle["collections"][number];
export type NotionImportRecord = NotionImportCollection["records"][number];
