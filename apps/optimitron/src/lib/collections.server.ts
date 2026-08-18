import { Prisma } from "@optimitron/db";
import {
  CollectionFieldType,
  ContentAccessLevel,
  ContentVisibility,
} from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { z } from "zod";
import {
  assertCollectionAccess,
  assertCollectionRecordAccess,
  assertDocumentAccess,
  hasContentAccess,
  lockContentResources,
  resolveCollectionAccess,
  resolveCollectionAccessBatch,
} from "@/lib/content-access.server";
import {
  canManageOrganization,
  canUserViewOrganization,
} from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";
import { canUserViewTask } from "@/lib/tasks/task-visibility.server";

export const COLLECTION_NOT_FOUND_MESSAGE = "Collection not found";
export const COLLECTION_CONFLICT_MESSAGE =
  "Collection changed since it was loaded. Refresh and try again.";
export const COLLECTION_RECORD_CONFLICT_MESSAGE =
  "Record changed since it was loaded. Refresh and try again.";
export const COLLECTION_IDEMPOTENCY_CONFLICT_MESSAGE =
  "Collection idempotency key was already used for different content";
export const COLLECTION_RECORD_IDEMPOTENCY_CONFLICT_MESSAGE =
  "Record idempotency key was already used for different content";

const MAX_COLLECTION_NAME = 200;
const MAX_DESCRIPTION = 20_000;
const MAX_FIELD_NAME = 200;
const MAX_FIELD_KEY = 160;
const MAX_FIELDS = 200;
const MAX_RECORDS_PER_QUERY = 500;
const MAX_RECORD_SCAN = 10_000;
const MAX_TEXT_VALUE = 500_000;
const FIELD_KEY_PATTERN = /^[A-Za-z0-9_.:-]+$/;

const READ_ONLY_FIELD_TYPES = new Set<CollectionFieldType>([
  CollectionFieldType.FILE,
  CollectionFieldType.RELATION,
  CollectionFieldType.TASK,
  CollectionFieldType.PERSON,
  CollectionFieldType.ORGANIZATION,
  CollectionFieldType.DOCUMENT,
  CollectionFieldType.FORMULA,
  CollectionFieldType.ROLLUP,
]);

const collectionInclude = {
  fields: {
    where: { deletedAt: null },
    orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
  },
  views: {
    where: { deletedAt: null },
    orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }],
  },
} satisfies Prisma.CollectionInclude;

const recordInclude = {
  outgoingRelations: {
    where: { deletedAt: null },
    orderBy: [{ fieldId: "asc" as const }, { position: "asc" as const }],
    include: { field: { select: { key: true, type: true } } },
  },
} satisfies Prisma.CollectionRecordInclude;

export type CollectionWithSchema = Prisma.CollectionGetPayload<{
  include: typeof collectionInclude;
}>;

type CollectionRecordWithRelations = Prisma.CollectionRecordGetPayload<{
  include: typeof recordInclude;
}>;

export interface CollectionFieldInput {
  key: string;
  name: string;
  optionsJson?: unknown;
  position?: number;
  required?: boolean;
  targetCollectionId?: string | null;
  type: CollectionFieldType;
}

export interface CollectionRelationInput {
  fieldKey: string;
  position?: number;
  targetDocumentId?: string;
  targetOrganizationId?: string;
  targetPersonId?: string;
  targetRecordId?: string;
  targetTaskId?: string;
}

export interface CollectionFilter {
  fieldKey: string;
  operator:
    | "contains"
    | "equals"
    | "greaterThan"
    | "isEmpty"
    | "lessThan"
    | "notEquals";
  value?: unknown;
}

export interface CollectionSort {
  direction: "asc" | "desc";
  fieldKey: string;
}

export const collectionFieldInputSchema = z.object({
  key: z.string(),
  name: z.string(),
  optionsJson: z.unknown().optional(),
  position: z.number().int().nonnegative().optional(),
  required: z.boolean().optional(),
  targetCollectionId: z.string().nullable().optional(),
  type: z.nativeEnum(CollectionFieldType),
});

export const collectionRelationInputSchema = z.object({
  fieldKey: z.string(),
  position: z.number().int().nonnegative().optional(),
  targetDocumentId: z.string().optional(),
  targetOrganizationId: z.string().optional(),
  targetPersonId: z.string().optional(),
  targetRecordId: z.string().optional(),
  targetTaskId: z.string().optional(),
});

const nullableLinkedIdSchema = z.string().trim().min(1).nullable().optional();
const collectionRecordBatchLinkSchema = {
  documentId: nullableLinkedIdSchema,
  organizationId: nullableLinkedIdSchema,
  personId: nullableLinkedIdSchema,
  relations: z.array(collectionRelationInputSchema).max(2_000).optional(),
  taskId: nullableLinkedIdSchema,
};

export const collectionRecordBatchOperationSchema = z
  .discriminatedUnion("operation", [
    z
      .object({
        operation: z.literal("create"),
        idempotencyKey: z.string().trim().min(1).max(500),
        values: z.record(z.unknown()),
        ...collectionRecordBatchLinkSchema,
      })
      .strict(),
    z
      .object({
        operation: z.literal("update"),
        expectedVersion: z.number().int().positive(),
        recordId: z.string().trim().min(1),
        values: z.record(z.unknown()).optional(),
        ...collectionRecordBatchLinkSchema,
      })
      .strict(),
  ])
  .superRefine((operation, context) => {
    if (
      operation.operation === "update" &&
      operation.values === undefined &&
      operation.relations === undefined &&
      operation.documentId === undefined &&
      operation.organizationId === undefined &&
      operation.personId === undefined &&
      operation.taskId === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An update requires at least one changed field.",
      });
    }
  });

export type CollectionRecordBatchOperation = z.infer<
  typeof collectionRecordBatchOperationSchema
>;

export const collectionFilterSchema = z.object({
  fieldKey: z.string(),
  operator: z.enum([
    "contains",
    "equals",
    "greaterThan",
    "isEmpty",
    "lessThan",
    "notEquals",
  ]),
  value: z.unknown().optional(),
});

export const collectionSortSchema = z.object({
  direction: z.enum(["asc", "desc"]),
  fieldKey: z.string(),
});

function parseSavedViewFilters(value: Prisma.JsonValue): CollectionFilter[] {
  const result = z.array(collectionFilterSchema).safeParse(value);
  return result.success ? result.data : [];
}

function parseSavedViewSorts(value: Prisma.JsonValue): CollectionSort[] {
  const result = z.array(collectionSortSchema).safeParse(value);
  return result.success ? result.data : [];
}

export interface CollectionViewResult {
  collection: CollectionWithSchema;
  effectivePermission: ContentAccessLevel;
  viewerCanEditContent: boolean;
  viewerCanEditSchema: boolean;
  viewerCanShare: boolean;
}

export function toCollectionDto(view: CollectionViewResult) {
  const { collection, effectivePermission } = view;
  const canSeeImportProvenance =
    effectivePermission === ContentAccessLevel.FULL_ACCESS;
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    jurisdictionId: collection.jurisdictionId,
    organizationId: collection.organizationId,
    visibility: collection.visibility,
    version: collection.version,
    sourceKey: canSeeImportProvenance ? collection.sourceKey : null,
    sourceUrl: canSeeImportProvenance ? collection.sourceUrl : null,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    effectivePermission,
    viewerCanEditContent: view.viewerCanEditContent,
    viewerCanEditSchema: view.viewerCanEditSchema,
    viewerCanShare: view.viewerCanShare,
    fields: collection.fields.map((field) => ({
      id: field.id,
      key: field.key,
      name: field.name,
      type: field.type,
      required: field.required,
      position: field.position,
      targetCollectionId: field.targetCollectionId,
      options: field.optionsJson,
    })),
    views: collection.views.map((savedView) => ({
      id: savedView.id,
      name: savedView.name,
      visibleFieldIds: savedView.visibleFieldIds,
      filter: parseSavedViewFilters(savedView.filterJson),
      sort: parseSavedViewSorts(savedView.sortJson),
      isDefault: savedView.isDefault,
      version: savedView.version,
    })),
  };
}

export interface CollectionRecordDto {
  canonicalEntity: {
    documentId: string | null;
    organizationId: string | null;
    personId: string | null;
    taskId: string | null;
  };
  createdAt: string;
  collectionId: string;
  id: string;
  relations: Array<{
    fieldKey: string;
    id: string;
    position: number;
    targetDocumentId: string | null;
    targetOrganizationId: string | null;
    targetPersonId: string | null;
    targetRecordId: string | null;
    targetTaskId: string | null;
  }>;
  sourceKey: string | null;
  sourceUrl: string | null;
  updatedAt: string;
  values: Record<string, unknown>;
  version: number;
}

function normalizeOptional(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function normalizeVisibility(
  value: ContentVisibility | null | undefined,
): ContentVisibility {
  return value === ContentVisibility.PUBLIC
    ? ContentVisibility.PUBLIC
    : ContentVisibility.PRIVATE;
}

function normalizeFieldInput(
  field: CollectionFieldInput,
  fallbackPosition: number,
): CollectionFieldInput {
  const key = field.key.trim();
  const name = field.name.trim();
  if (!key || key.length > MAX_FIELD_KEY || !FIELD_KEY_PATTERN.test(key)) {
    throw new Error(
      `Field key must be ${MAX_FIELD_KEY} characters or fewer and contain only letters, numbers, period, colon, underscore, or hyphen`,
    );
  }
  if (!name || name.length > MAX_FIELD_NAME) {
    throw new Error(`Field name must be 1-${MAX_FIELD_NAME} characters`);
  }
  const position = field.position ?? fallbackPosition;
  if (!Number.isInteger(position) || position < 0) {
    throw new Error("Field position must be a non-negative integer");
  }
  if (
    field.type === CollectionFieldType.RELATION &&
    !normalizeOptional(field.targetCollectionId)
  ) {
    throw new Error(`Relation field ${key} requires targetCollectionId`);
  }
  if (
    field.type !== CollectionFieldType.RELATION &&
    normalizeOptional(field.targetCollectionId)
  ) {
    throw new Error(`Only relation fields may specify targetCollectionId`);
  }
  return {
    ...field,
    key,
    name,
    position,
    targetCollectionId: normalizeOptional(field.targetCollectionId),
  };
}

function normalizeFieldInputs(
  fields: CollectionFieldInput[],
): CollectionFieldInput[] {
  if (fields.length > MAX_FIELDS) {
    throw new Error(`A collection may have at most ${MAX_FIELDS} fields`);
  }
  const normalized = fields.map(normalizeFieldInput);
  const keys = new Set<string>();
  for (const field of normalized) {
    if (keys.has(field.key)) {
      throw new Error(`Duplicate field key: ${field.key}`);
    }
    keys.add(field.key);
  }
  return normalized;
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function selectOptions(optionsJson: Prisma.JsonValue | null): Set<string> {
  if (
    !optionsJson ||
    typeof optionsJson !== "object" ||
    Array.isArray(optionsJson)
  ) {
    return new Set();
  }
  const options = (optionsJson as { options?: unknown }).options;
  if (!Array.isArray(options)) return new Set();
  const values = new Set<string>();
  for (const option of options) {
    if (typeof option === "string") {
      values.add(option);
    } else if (option && typeof option === "object" && !Array.isArray(option)) {
      const row = option as { id?: unknown; name?: unknown };
      if (typeof row.id === "string") values.add(row.id);
      if (typeof row.name === "string") values.add(row.name);
    }
  }
  return values;
}

function validateUrl(value: string, key: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new Error();
    return value;
  } catch {
    throw new Error(`${key} must be an http or https URL`);
  }
}

function normalizeFieldValue(input: {
  allowImportedComputedValues: boolean;
  field: CollectionWithSchema["fields"][number];
  value: unknown;
}): unknown {
  const { field, value } = input;
  if (value == null) return null;
  if (
    READ_ONLY_FIELD_TYPES.has(field.type) &&
    !input.allowImportedComputedValues
  ) {
    throw new Error(`${field.key} is read-only`);
  }

  switch (field.type) {
    case CollectionFieldType.TEXT:
    case CollectionFieldType.RICH_TEXT: {
      if (typeof value !== "string" || value.length > MAX_TEXT_VALUE) {
        throw new Error(
          `${field.key} must be text under ${MAX_TEXT_VALUE} characters`,
        );
      }
      return value;
    }
    case CollectionFieldType.NUMBER:
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${field.key} must be a finite number`);
      }
      return value;
    case CollectionFieldType.BOOLEAN:
      if (typeof value !== "boolean") {
        throw new Error(`${field.key} must be true or false`);
      }
      return value;
    case CollectionFieldType.DATE:
      if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
        throw new Error(`${field.key} must be an ISO date or timestamp`);
      }
      return value;
    case CollectionFieldType.SELECT: {
      if (typeof value !== "string")
        throw new Error(`${field.key} must be text`);
      const options = selectOptions(field.optionsJson);
      if (options.size && !options.has(value)) {
        throw new Error(`${field.key} must match a configured option`);
      }
      return value;
    }
    case CollectionFieldType.MULTI_SELECT: {
      if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== "string")
      ) {
        throw new Error(`${field.key} must be a list of configured options`);
      }
      const options = selectOptions(field.optionsJson);
      if (options.size && value.some((item) => !options.has(item as string))) {
        throw new Error(`${field.key} contains an unknown option`);
      }
      return [...new Set(value as string[])];
    }
    case CollectionFieldType.URL:
      if (typeof value !== "string")
        throw new Error(`${field.key} must be a URL`);
      return validateUrl(value, field.key);
    case CollectionFieldType.EMAIL:
      return z
        .string()
        .email(`${field.key} must be an email address`)
        .parse(value);
    default:
      return asInputJson(value);
  }
}

function normalizeValues(input: {
  allowImportedComputedValues?: boolean;
  fields: CollectionWithSchema["fields"];
  previous?: Record<string, unknown>;
  values: Record<string, unknown>;
}): Record<string, unknown> {
  const fieldByKey = new Map(input.fields.map((field) => [field.key, field]));
  const result: Record<string, unknown> = { ...(input.previous ?? {}) };
  for (const [key, value] of Object.entries(input.values)) {
    const field = fieldByKey.get(key);
    if (!field) throw new Error(`Unknown field key: ${key}`);
    result[key] = normalizeFieldValue({
      allowImportedComputedValues: input.allowImportedComputedValues === true,
      field,
      value,
    });
  }
  for (const field of input.fields) {
    if (
      field.required &&
      !READ_ONLY_FIELD_TYPES.has(field.type) &&
      (result[field.key] == null || result[field.key] === "")
    ) {
      throw new Error(`${field.key} is required`);
    }
  }
  return result;
}

function recordSearchText(values: Record<string, unknown>): string {
  return Object.values(values)
    .flatMap((value) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : typeof value === "boolean"
          ? [value ? "yes" : "no"]
          : typeof value === "string" || typeof value === "number"
            ? [String(value)]
            : [],
    )
    .join("\n");
}

async function assertOrganizationOwnership(
  input: {
    organizationId: string | null;
    userId: string;
  },
  db: Pick<Prisma.TransactionClient, "organizationMember"> = prisma,
): Promise<void> {
  if (
    input.organizationId &&
    !(await canManageOrganization(input.userId, input.organizationId, db))
  ) {
    throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  }
}

async function assertCanonicalLinks(input: {
  documentId: string | null;
  organizationId: string | null;
  personId: string | null;
  taskId: string | null;
  userId: string;
}): Promise<void> {
  const targets = [
    input.documentId,
    input.organizationId,
    input.personId,
    input.taskId,
  ].filter(Boolean);
  if (targets.length > 1) {
    throw new Error("A record may represent at most one canonical entity");
  }
  if (input.documentId) {
    await assertDocumentAccess(
      input.documentId,
      input.userId,
      ContentAccessLevel.VIEW,
    );
  }
  if (input.taskId && !(await canUserViewTask(input.taskId, input.userId))) {
    throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  }
  if (input.personId) {
    const person = await prisma.person.findFirst({
      where: {
        id: input.personId,
        deletedAt: null,
        OR: [
          { isPublic: true },
          { createdByUserId: input.userId },
          { user: { id: input.userId } },
        ],
      },
      select: { id: true },
    });
    if (!person) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  }
  if (input.organizationId) {
    if (!(await canUserViewOrganization(input.organizationId, input.userId))) {
      throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
    }
  }
}

function directEntityIds(input: {
  documentId?: string | null;
  organizationId?: string | null;
  personId?: string | null;
  taskId?: string | null;
}) {
  return {
    documentId: normalizeOptional(input.documentId),
    organizationId: normalizeOptional(input.organizationId),
    personId: normalizeOptional(input.personId),
    taskId: normalizeOptional(input.taskId),
  };
}

async function relationData(input: {
  collection: CollectionWithSchema;
  relations: CollectionRelationInput[];
  userId: string;
}) {
  const fieldByKey = new Map(
    input.collection.fields.map((field) => [field.key, field]),
  );
  const result = [];
  for (const relation of input.relations) {
    const field = fieldByKey.get(relation.fieldKey);
    if (!field || !READ_ONLY_FIELD_TYPES.has(field.type)) {
      throw new Error(`Unknown relation field: ${relation.fieldKey}`);
    }
    const targets = directEntityIds({
      documentId: relation.targetDocumentId,
      organizationId: relation.targetOrganizationId,
      personId: relation.targetPersonId,
      taskId: relation.targetTaskId,
    });
    const targetRecordId = normalizeOptional(relation.targetRecordId);
    if (
      [...Object.values(targets), targetRecordId].filter(Boolean).length !== 1
    ) {
      throw new Error(
        `${relation.fieldKey} requires exactly one relation target`,
      );
    }
    if (field.type === CollectionFieldType.RELATION && !targetRecordId) {
      throw new Error(`${relation.fieldKey} must target a collection record`);
    }
    if (field.type === CollectionFieldType.TASK && !targets.taskId) {
      throw new Error(`${relation.fieldKey} must target a task`);
    }
    if (field.type === CollectionFieldType.PERSON && !targets.personId) {
      throw new Error(`${relation.fieldKey} must target a person`);
    }
    if (
      field.type === CollectionFieldType.ORGANIZATION &&
      !targets.organizationId
    ) {
      throw new Error(`${relation.fieldKey} must target an organization`);
    }
    if (field.type === CollectionFieldType.DOCUMENT && !targets.documentId) {
      throw new Error(`${relation.fieldKey} must target a document`);
    }
    if (targetRecordId) {
      const target = await prisma.collectionRecord.findFirst({
        where: { id: targetRecordId, deletedAt: null },
        select: { collectionId: true },
      });
      if (!target || target.collectionId !== field.targetCollectionId) {
        throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
      }
      await assertCollectionAccess(
        target.collectionId,
        input.userId,
        ContentAccessLevel.VIEW,
      );
    } else {
      await assertCanonicalLinks({ ...targets, userId: input.userId });
    }
    result.push({
      fieldId: field.id,
      position: relation.position ?? result.length,
      targetRecordId,
      targetTaskId: targets.taskId,
      targetPersonId: targets.personId,
      targetOrganizationId: targets.organizationId,
      targetDocumentId: targets.documentId,
      createdByUserId: input.userId,
    });
  }
  return result;
}

function collectionRelationSignature(
  relations: Array<{
    fieldId: string;
    position: number;
    targetDocumentId: string | null;
    targetOrganizationId: string | null;
    targetPersonId: string | null;
    targetRecordId: string | null;
    targetTaskId: string | null;
  }>,
): string {
  return JSON.stringify(
    relations
      .map((relation) => ({
        fieldId: relation.fieldId,
        position: relation.position,
        targetDocumentId: relation.targetDocumentId,
        targetOrganizationId: relation.targetOrganizationId,
        targetPersonId: relation.targetPersonId,
        targetRecordId: relation.targetRecordId,
        targetTaskId: relation.targetTaskId,
      }))
      .sort((left, right) =>
        `${left.fieldId}:${left.position}:${JSON.stringify(left)}`.localeCompare(
          `${right.fieldId}:${right.position}:${JSON.stringify(right)}`,
        ),
      ),
  );
}

export async function getCollectionForViewer(
  collectionId: string,
  userId?: string | null,
): Promise<CollectionViewResult | null> {
  const [collection, effectivePermission] = await Promise.all([
    prisma.collection.findFirst({
      where: { id: collectionId.trim(), deletedAt: null },
      include: collectionInclude,
    }),
    resolveCollectionAccess(collectionId, userId ?? null),
  ]);
  if (!collection || !effectivePermission) return null;
  return {
    collection,
    effectivePermission,
    viewerCanEditContent: hasContentAccess(
      effectivePermission,
      ContentAccessLevel.EDIT_CONTENT,
    ),
    viewerCanEditSchema: hasContentAccess(
      effectivePermission,
      ContentAccessLevel.EDIT,
    ),
    viewerCanShare: hasContentAccess(
      effectivePermission,
      ContentAccessLevel.FULL_ACCESS,
    ),
  };
}

export async function createCollection(input: {
  createdByUserId: string;
  description?: string | null;
  fields?: CollectionFieldInput[];
  idempotencyKey?: string | null;
  jurisdictionId?: string | null;
  name: string;
  organizationId?: string | null;
  requestHash?: string | null;
  sourceArtifactId?: string | null;
  sourceKey?: string | null;
  sourceUrl?: string | null;
  visibility?: ContentVisibility | null;
}): Promise<CollectionViewResult> {
  const name = input.name.trim();
  const description = normalizeOptional(input.description);
  if (!name || name.length > MAX_COLLECTION_NAME) {
    throw new Error(
      `Collection name must be 1-${MAX_COLLECTION_NAME} characters`,
    );
  }
  if (description && description.length > MAX_DESCRIPTION) {
    throw new Error(`Description exceeds ${MAX_DESCRIPTION} characters`);
  }
  const fields = normalizeFieldInputs(input.fields ?? []);
  const organizationId = normalizeOptional(input.organizationId);
  const visibility = normalizeVisibility(input.visibility);
  await assertOrganizationOwnership({
    organizationId,
    userId: input.createdByUserId,
  });

  for (const field of fields) {
    if (field.targetCollectionId) {
      await assertCollectionAccess(
        field.targetCollectionId,
        input.createdByUserId,
        ContentAccessLevel.VIEW,
      );
    }
  }

  const idempotencyKey = normalizeOptional(input.idempotencyKey);
  const sourceKey = normalizeOptional(input.sourceKey);
  const normalizedRequest = {
    description,
    fields,
    jurisdictionId: normalizeOptional(input.jurisdictionId),
    name,
    organizationId,
    sourceArtifactId: normalizeOptional(input.sourceArtifactId),
    sourceKey,
    sourceUrl: normalizeOptional(input.sourceUrl),
    visibility,
  };
  const requestHash =
    normalizeOptional(input.requestHash) ??
    (await sha256CanonicalJson(normalizedRequest));
  const findExisting = async () => {
    const [byIdempotencyKey, bySourceKey] = await Promise.all([
      idempotencyKey
        ? prisma.collection.findUnique({
            where: {
              createdByUserId_idempotencyKey: {
                createdByUserId: input.createdByUserId,
                idempotencyKey,
              },
            },
            select: { id: true, requestHash: true },
          })
        : null,
      sourceKey
        ? prisma.collection.findUnique({
            where: { sourceKey },
            select: { id: true, requestHash: true },
          })
        : null,
    ]);
    if (
      byIdempotencyKey &&
      bySourceKey &&
      byIdempotencyKey.id !== bySourceKey.id
    ) {
      throw new Error(COLLECTION_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    return byIdempotencyKey ?? bySourceKey;
  };
  const returnExisting = async (existing: {
    id: string;
    requestHash: string | null;
  }) => {
    if (existing.requestHash !== requestHash) {
      throw new Error(COLLECTION_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    const view = await getCollectionForViewer(
      existing.id,
      input.createdByUserId,
    );
    if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
    return view;
  };
  const existing = await findExisting();
  if (existing) {
    return returnExisting(existing);
  }

  let collection: { id: string };
  try {
    collection = await prisma.collection.create({
      data: {
        createdByUserId: input.createdByUserId,
        description,
        idempotencyKey,
        jurisdictionId: normalizedRequest.jurisdictionId,
        name,
        organizationId,
        requestHash,
        sourceArtifactId: normalizedRequest.sourceArtifactId,
        sourceKey,
        sourceUrl: normalizedRequest.sourceUrl,
        visibility,
        fields: {
          create: fields.map((field) => ({
            createdByUserId: input.createdByUserId,
            key: field.key,
            name: field.name,
            optionsJson:
              field.optionsJson === undefined
                ? undefined
                : asInputJson(field.optionsJson),
            position: field.position,
            required: field.required ?? false,
            targetCollectionId: field.targetCollectionId,
            type: field.type,
          })),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error) || (!idempotencyKey && !sourceKey)) {
      throw error;
    }
    const raced = await findExisting();
    if (!raced) throw error;
    return returnExisting(raced);
  }
  const view = await getCollectionForViewer(
    collection.id,
    input.createdByUserId,
  );
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  return view;
}

export async function updateCollection(input: {
  collectionId: string;
  description?: string | null;
  editorUserId: string;
  expectedVersion: number;
  fields?: CollectionFieldInput[];
  name?: string | null;
  organizationId?: string | null;
  requestHash?: string | null;
  sourceArtifactId?: string | null;
  sourceUrl?: string | null;
  visibility?: ContentVisibility | null;
}): Promise<CollectionViewResult> {
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new Error("expectedVersion must be a positive integer");
  }
  const ownershipPatch =
    input.organizationId !== undefined || input.visibility !== undefined;
  const fields =
    input.fields === undefined ? null : normalizeFieldInputs(input.fields);
  await assertCollectionAccess(
    input.collectionId,
    input.editorUserId,
    ownershipPatch ? ContentAccessLevel.FULL_ACCESS : ContentAccessLevel.EDIT,
  );
  const current = await prisma.collection.findFirst({
    where: { id: input.collectionId, deletedAt: null },
  });
  if (!current) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const name = input.name?.trim() || current.name;
  const description =
    input.description === undefined
      ? current.description
      : normalizeOptional(input.description);
  if (!name || name.length > MAX_COLLECTION_NAME) {
    throw new Error(
      `Collection name must be 1-${MAX_COLLECTION_NAME} characters`,
    );
  }
  if (description && description.length > MAX_DESCRIPTION) {
    throw new Error(`Description exceeds ${MAX_DESCRIPTION} characters`);
  }
  const organizationId =
    input.organizationId === undefined
      ? current.organizationId
      : normalizeOptional(input.organizationId);
  await assertOrganizationOwnership({
    organizationId,
    userId: input.editorUserId,
  });
  for (const field of fields ?? []) {
    if (field.targetCollectionId) {
      await assertCollectionAccess(
        field.targetCollectionId,
        input.editorUserId,
        ContentAccessLevel.VIEW,
      );
    }
  }
  await prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [{ type: "collection", id: current.id }]);
    await assertCollectionAccess(
      current.id,
      input.editorUserId,
      ownershipPatch ? ContentAccessLevel.FULL_ACCESS : ContentAccessLevel.EDIT,
      tx,
    );
    await assertOrganizationOwnership(
      { organizationId, userId: input.editorUserId },
      tx,
    );
    if (fields) {
      const existingFields = await tx.collectionField.findMany({
        where: { collectionId: current.id, deletedAt: null },
        select: { id: true, key: true },
      });
      const activeKeys = fields.map((field) => field.key);
      const removedFieldIds = existingFields
        .filter((field) => !activeKeys.includes(field.key))
        .map((field) => field.id);
      if (removedFieldIds.length) {
        await tx.collectionRelation.updateMany({
          where: { fieldId: { in: removedFieldIds }, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
      await tx.collectionField.updateMany({
        where: {
          collectionId: current.id,
          deletedAt: null,
          ...(activeKeys.length ? { key: { notIn: activeKeys } } : {}),
        },
        data: { deletedAt: new Date() },
      });
      for (const field of fields) {
        await tx.collectionField.upsert({
          where: {
            collectionId_key: { collectionId: current.id, key: field.key },
          },
          create: {
            collectionId: current.id,
            createdByUserId: input.editorUserId,
            key: field.key,
            name: field.name,
            optionsJson:
              field.optionsJson === undefined
                ? undefined
                : asInputJson(field.optionsJson),
            position: field.position,
            required: field.required ?? false,
            targetCollectionId: field.targetCollectionId,
            type: field.type,
          },
          update: {
            deletedAt: null,
            name: field.name,
            optionsJson:
              field.optionsJson === undefined
                ? Prisma.DbNull
                : asInputJson(field.optionsJson),
            position: field.position,
            required: field.required ?? false,
            targetCollectionId: field.targetCollectionId,
            type: field.type,
          },
        });
      }
    }
    const updated = await tx.collection.updateMany({
      where: {
        id: current.id,
        version: input.expectedVersion,
        deletedAt: null,
      },
      data: {
        description,
        name,
        organizationId,
        ...(input.requestHash !== undefined
          ? { requestHash: normalizeOptional(input.requestHash) }
          : {}),
        ...(input.sourceArtifactId !== undefined
          ? { sourceArtifactId: normalizeOptional(input.sourceArtifactId) }
          : {}),
        ...(input.sourceUrl !== undefined
          ? { sourceUrl: normalizeOptional(input.sourceUrl) }
          : {}),
        version: { increment: 1 },
        visibility: input.visibility ?? current.visibility,
      },
    });
    if (updated.count !== 1) throw new Error(COLLECTION_CONFLICT_MESSAGE);
  });
  const view = await getCollectionForViewer(current.id, input.editorUserId);
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  return view;
}

export async function saveCollectionView(input: {
  collectionId: string;
  editorUserId: string;
  expectedVersion?: number;
  filters?: CollectionFilter[];
  isDefault?: boolean;
  name: string;
  sorts?: CollectionSort[];
  viewId?: string;
  visibleFieldIds?: string[];
}) {
  await assertCollectionAccess(
    input.collectionId,
    input.editorUserId,
    ContentAccessLevel.EDIT,
  );
  const collection = await getCollectionForViewer(
    input.collectionId,
    input.editorUserId,
  );
  if (!collection) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const name = input.name.trim();
  if (!name || name.length > MAX_COLLECTION_NAME) {
    throw new Error(`View name must be 1-${MAX_COLLECTION_NAME} characters`);
  }
  const fieldIds = new Set(
    collection.collection.fields.map((field) => field.id),
  );
  const fieldKeys = new Set(
    collection.collection.fields.map((field) => field.key),
  );
  const visibleFieldIds = input.visibleFieldIds ?? [];
  if (visibleFieldIds.some((fieldId) => !fieldIds.has(fieldId))) {
    throw new Error("visibleFieldIds contains an unknown field");
  }
  if ((input.filters ?? []).some((filter) => !fieldKeys.has(filter.fieldKey))) {
    throw new Error("filters contains an unknown field");
  }
  if ((input.sorts ?? []).some((sort) => !fieldKeys.has(sort.fieldKey))) {
    throw new Error("sorts contains an unknown field");
  }
  return prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [
      { type: "collection", id: input.collectionId },
    ]);
    await assertCollectionAccess(
      input.collectionId,
      input.editorUserId,
      ContentAccessLevel.EDIT,
      tx,
    );
    if (input.isDefault) {
      await tx.collectionView.updateMany({
        where: {
          collectionId: input.collectionId,
          deletedAt: null,
          ...(input.viewId ? { id: { not: input.viewId } } : {}),
        },
        data: { isDefault: false },
      });
    }
    if (!input.viewId) {
      return tx.collectionView.create({
        data: {
          collectionId: input.collectionId,
          createdByUserId: input.editorUserId,
          filterJson: asInputJson(input.filters ?? []),
          isDefault: input.isDefault ?? false,
          name,
          sortJson: asInputJson(input.sorts ?? []),
          visibleFieldIds,
        },
      });
    }
    if (
      !Number.isInteger(input.expectedVersion) ||
      (input.expectedVersion ?? 0) < 1
    ) {
      throw new Error("expectedVersion must be a positive integer");
    }
    const updated = await tx.collectionView.updateMany({
      where: {
        id: input.viewId,
        collectionId: input.collectionId,
        deletedAt: null,
        version: input.expectedVersion,
      },
      data: {
        filterJson: asInputJson(input.filters ?? []),
        isDefault: input.isDefault ?? false,
        name,
        sortJson: asInputJson(input.sorts ?? []),
        version: { increment: 1 },
        visibleFieldIds,
      },
    });
    if (updated.count !== 1) throw new Error(COLLECTION_CONFLICT_MESSAGE);
    const saved = await tx.collectionView.findFirst({
      where: { id: input.viewId, deletedAt: null },
    });
    if (!saved) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
    return saved;
  });
}

export async function createCollectionRecord(input: {
  allowImportedComputedValues?: boolean;
  collectionId: string;
  createdByUserId: string;
  documentId?: string | null;
  idempotencyKey?: string | null;
  organizationId?: string | null;
  personId?: string | null;
  relations?: CollectionRelationInput[];
  requestHash?: string | null;
  sourceArtifactId?: string | null;
  sourceKey?: string | null;
  sourceUrl?: string | null;
  taskId?: string | null;
  values: Record<string, unknown>;
}): Promise<CollectionRecordDto> {
  await assertCollectionAccess(
    input.collectionId,
    input.createdByUserId,
    ContentAccessLevel.EDIT_CONTENT,
  );
  const view = await getCollectionForViewer(
    input.collectionId,
    input.createdByUserId,
  );
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const values = normalizeValues({
    allowImportedComputedValues: input.allowImportedComputedValues,
    fields: view.collection.fields,
    values: input.values,
  });
  const canonicalEntity = directEntityIds(input);
  await assertCanonicalLinks({
    ...canonicalEntity,
    userId: input.createdByUserId,
  });
  const relations = await relationData({
    collection: view.collection,
    relations: input.relations ?? [],
    userId: input.createdByUserId,
  });
  const idempotencyKey = normalizeOptional(input.idempotencyKey);
  const sourceKey = normalizeOptional(input.sourceKey);
  const normalizedRequest = {
    canonicalEntity,
    collectionId: input.collectionId,
    relations: input.relations ?? [],
    sourceArtifactId: normalizeOptional(input.sourceArtifactId),
    sourceKey,
    sourceUrl: normalizeOptional(input.sourceUrl),
    values,
  };
  const requestHash =
    normalizeOptional(input.requestHash) ??
    (await sha256CanonicalJson(normalizedRequest));
  const findExisting = async () => {
    const [byIdempotencyKey, bySourceKey] = await Promise.all([
      idempotencyKey
        ? prisma.collectionRecord.findUnique({
            where: {
              collectionId_idempotencyKey: {
                collectionId: input.collectionId,
                idempotencyKey,
              },
            },
            select: { id: true, requestHash: true },
          })
        : null,
      sourceKey
        ? prisma.collectionRecord.findUnique({
            where: {
              collectionId_sourceKey: {
                collectionId: input.collectionId,
                sourceKey,
              },
            },
            select: { id: true, requestHash: true },
          })
        : null,
    ]);
    if (
      byIdempotencyKey &&
      bySourceKey &&
      byIdempotencyKey.id !== bySourceKey.id
    ) {
      throw new Error(COLLECTION_RECORD_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    return byIdempotencyKey ?? bySourceKey;
  };
  const returnExisting = async (existing: {
    id: string;
    requestHash: string | null;
  }) => {
    if (existing.requestHash !== requestHash) {
      throw new Error(COLLECTION_RECORD_IDEMPOTENCY_CONFLICT_MESSAGE);
    }
    const row = await getCollectionRecordForViewer(
      existing.id,
      input.createdByUserId,
    );
    if (!row) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
    return row;
  };
  const existing = await findExisting();
  if (existing) {
    return returnExisting(existing);
  }

  let record: { id: string };
  try {
    record = await prisma.$transaction(async (tx) => {
      await lockContentResources(tx, [
        { type: "collection", id: input.collectionId },
      ]);
      await assertCollectionAccess(
        input.collectionId,
        input.createdByUserId,
        ContentAccessLevel.EDIT_CONTENT,
        tx,
      );
      const lockedCollection = await tx.collection.findFirst({
        where: { id: input.collectionId, deletedAt: null },
        select: { version: true },
      });
      if (lockedCollection?.version !== view.collection.version) {
        throw new Error(COLLECTION_CONFLICT_MESSAGE);
      }
      const created = await tx.collectionRecord.create({
        data: {
          ...canonicalEntity,
          collectionId: input.collectionId,
          createdByUserId: input.createdByUserId,
          idempotencyKey,
          requestHash,
          searchText: recordSearchText(values),
          sourceArtifactId: normalizedRequest.sourceArtifactId,
          sourceKey,
          sourceUrl: normalizedRequest.sourceUrl,
          valuesJson: asInputJson(values),
        },
        select: { id: true },
      });
      if (relations.length) {
        await tx.collectionRelation.createMany({
          data: relations.map((relation) => ({
            ...relation,
            sourceRecordId: created.id,
          })),
        });
      }
      return created;
    });
  } catch (error) {
    if (!isUniqueConstraintError(error) || (!idempotencyKey && !sourceKey)) {
      throw error;
    }
    const raced = await findExisting();
    if (!raced) throw error;
    return returnExisting(raced);
  }
  const result = await getCollectionRecordForViewer(
    record.id,
    input.createdByUserId,
  );
  if (!result) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  return result;
}

export async function updateCollectionRecord(input: {
  allowImportedComputedValues?: boolean;
  documentId?: string | null;
  editorUserId: string;
  expectedVersion: number;
  organizationId?: string | null;
  personId?: string | null;
  recordId: string;
  relations?: CollectionRelationInput[];
  requestHash?: string | null;
  sourceArtifactId?: string | null;
  sourceUrl?: string | null;
  taskId?: string | null;
  values?: Record<string, unknown>;
}): Promise<CollectionRecordDto> {
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw new Error("expectedVersion must be a positive integer");
  }
  const { collectionId } = await assertCollectionRecordAccess(
    input.recordId,
    input.editorUserId,
    ContentAccessLevel.EDIT_CONTENT,
  );
  const [view, current] = await Promise.all([
    getCollectionForViewer(collectionId, input.editorUserId),
    prisma.collectionRecord.findFirst({
      where: { id: input.recordId, deletedAt: null },
    }),
  ]);
  if (!view || !current) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  if (current.version !== input.expectedVersion) {
    throw new Error(COLLECTION_RECORD_CONFLICT_MESSAGE);
  }
  const previous = current.valuesJson as Record<string, unknown>;
  const values = normalizeValues({
    allowImportedComputedValues: input.allowImportedComputedValues,
    fields: view.collection.fields,
    previous,
    values: input.values ?? {},
  });
  const canonicalEntity = {
    documentId:
      input.documentId === undefined
        ? current.documentId
        : normalizeOptional(input.documentId),
    organizationId:
      input.organizationId === undefined
        ? current.organizationId
        : normalizeOptional(input.organizationId),
    personId:
      input.personId === undefined
        ? current.personId
        : normalizeOptional(input.personId),
    taskId:
      input.taskId === undefined
        ? current.taskId
        : normalizeOptional(input.taskId),
  };
  await assertCanonicalLinks({
    ...canonicalEntity,
    userId: input.editorUserId,
  });
  const relations =
    input.relations === undefined
      ? null
      : await relationData({
          collection: view.collection,
          relations: input.relations,
          userId: input.editorUserId,
        });

  await prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [{ type: "collection", id: collectionId }]);
    await assertCollectionRecordAccess(
      current.id,
      input.editorUserId,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    const lockedCollection = await tx.collection.findFirst({
      where: { id: collectionId, deletedAt: null },
      select: { version: true },
    });
    if (lockedCollection?.version !== view.collection.version) {
      throw new Error(COLLECTION_CONFLICT_MESSAGE);
    }
    const updated = await tx.collectionRecord.updateMany({
      where: {
        id: current.id,
        version: input.expectedVersion,
        deletedAt: null,
      },
      data: {
        ...canonicalEntity,
        searchText: recordSearchText(values),
        ...(input.requestHash !== undefined
          ? { requestHash: normalizeOptional(input.requestHash) }
          : {}),
        ...(input.sourceArtifactId !== undefined
          ? { sourceArtifactId: normalizeOptional(input.sourceArtifactId) }
          : {}),
        ...(input.sourceUrl !== undefined
          ? { sourceUrl: normalizeOptional(input.sourceUrl) }
          : {}),
        valuesJson: asInputJson(values),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1)
      throw new Error(COLLECTION_RECORD_CONFLICT_MESSAGE);
    if (relations) {
      await tx.collectionRelation.updateMany({
        where: { sourceRecordId: current.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (relations.length) {
        await tx.collectionRelation.createMany({
          data: relations.map((relation) => ({
            ...relation,
            sourceRecordId: current.id,
          })),
        });
      }
    }
  });
  const result = await getCollectionRecordForViewer(
    current.id,
    input.editorUserId,
  );
  if (!result) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  return result;
}

export async function upsertCollectionRecordsBatch(input: {
  collectionId: string;
  editorUserId: string;
  operations: unknown;
}): Promise<
  Array<{
    action: "create" | "unchanged" | "update";
    record: CollectionRecordDto;
  }>
> {
  const operations = z
    .array(collectionRecordBatchOperationSchema)
    .min(1)
    .max(100)
    .parse(input.operations);
  const createKeys = operations.flatMap((operation) =>
    operation.operation === "create" ? [operation.idempotencyKey] : [],
  );
  const updateIds = operations.flatMap((operation) =>
    operation.operation === "update" ? [operation.recordId] : [],
  );
  if (new Set(createKeys).size !== createKeys.length) {
    throw new Error("Batch create idempotency keys must be unique");
  }
  if (new Set(updateIds).size !== updateIds.length) {
    throw new Error("A record may be updated only once per batch");
  }
  await assertCollectionAccess(
    input.collectionId,
    input.editorUserId,
    ContentAccessLevel.EDIT_CONTENT,
  );
  const [view, currentRows] = await Promise.all([
    getCollectionForViewer(input.collectionId, input.editorUserId),
    updateIds.length
      ? prisma.collectionRecord.findMany({
          where: {
            collectionId: input.collectionId,
            deletedAt: null,
            id: { in: updateIds },
          },
        })
      : Promise.resolve([]),
  ]);
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const currentById = new Map(currentRows.map((record) => [record.id, record]));
  if (currentById.size !== updateIds.length) {
    throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  }

  type PreparedOperation =
    | {
        canonicalEntity: ReturnType<typeof directEntityIds>;
        idempotencyKey: string;
        operation: "create";
        relations: Awaited<ReturnType<typeof relationData>>;
        requestHash: string;
        values: Record<string, unknown>;
      }
    | {
        canonicalEntity: ReturnType<typeof directEntityIds>;
        expectedVersion: number;
        operation: "update";
        recordId: string;
        relations: Awaited<ReturnType<typeof relationData>> | null;
        values: Record<string, unknown>;
      };
  const prepared: PreparedOperation[] = [];
  for (const operation of operations) {
    const current =
      operation.operation === "update"
        ? currentById.get(operation.recordId)
        : null;
    if (operation.operation === "update" && !current) {
      throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
    }
    const values = normalizeValues({
      fields: view.collection.fields,
      previous: current?.valuesJson as Record<string, unknown> | undefined,
      values: operation.values ?? {},
    });
    const canonicalEntity =
      operation.operation === "create"
        ? directEntityIds(operation)
        : {
            documentId:
              operation.documentId === undefined
                ? (current?.documentId ?? null)
                : normalizeOptional(operation.documentId),
            organizationId:
              operation.organizationId === undefined
                ? (current?.organizationId ?? null)
                : normalizeOptional(operation.organizationId),
            personId:
              operation.personId === undefined
                ? (current?.personId ?? null)
                : normalizeOptional(operation.personId),
            taskId:
              operation.taskId === undefined
                ? (current?.taskId ?? null)
                : normalizeOptional(operation.taskId),
          };
    await assertCanonicalLinks({
      ...canonicalEntity,
      userId: input.editorUserId,
    });
    const relations =
      operation.relations === undefined
        ? operation.operation === "update"
          ? null
          : []
        : await relationData({
            collection: view.collection,
            relations: operation.relations,
            userId: input.editorUserId,
          });
    if (operation.operation === "create") {
      prepared.push({
        canonicalEntity,
        idempotencyKey: operation.idempotencyKey,
        operation: "create",
        relations: relations ?? [],
        requestHash: await sha256CanonicalJson({
          canonicalEntity,
          collectionId: input.collectionId,
          relations: operation.relations ?? [],
          sourceArtifactId: null,
          sourceKey: null,
          sourceUrl: null,
          values,
        }),
        values,
      });
    } else {
      prepared.push({
        canonicalEntity,
        expectedVersion: operation.expectedVersion,
        operation: "update",
        recordId: operation.recordId,
        relations,
        values,
      });
    }
  }

  const written = await prisma.$transaction(async (tx) => {
    await lockContentResources(tx, [
      { type: "collection", id: input.collectionId },
    ]);
    await assertCollectionAccess(
      input.collectionId,
      input.editorUserId,
      ContentAccessLevel.EDIT_CONTENT,
      tx,
    );
    const lockedCollection = await tx.collection.findFirst({
      where: { id: input.collectionId, deletedAt: null },
      select: { version: true },
    });
    if (lockedCollection?.version !== view.collection.version) {
      throw new Error(COLLECTION_CONFLICT_MESSAGE);
    }
    const results: Array<{
      action: "create" | "unchanged" | "update";
      id: string;
    }> = [];
    for (const operation of prepared) {
      if (operation.operation === "create") {
        const existing = await tx.collectionRecord.findUnique({
          where: {
            collectionId_idempotencyKey: {
              collectionId: input.collectionId,
              idempotencyKey: operation.idempotencyKey,
            },
          },
          select: { deletedAt: true, id: true, requestHash: true },
        });
        if (existing) {
          if (
            existing.deletedAt ||
            existing.requestHash !== operation.requestHash
          ) {
            throw new Error(COLLECTION_RECORD_IDEMPOTENCY_CONFLICT_MESSAGE);
          }
          results.push({ action: "unchanged", id: existing.id });
          continue;
        }
        const created = await tx.collectionRecord.create({
          data: {
            ...operation.canonicalEntity,
            collectionId: input.collectionId,
            createdByUserId: input.editorUserId,
            idempotencyKey: operation.idempotencyKey,
            requestHash: operation.requestHash,
            searchText: recordSearchText(operation.values),
            valuesJson: asInputJson(operation.values),
          },
          select: { id: true },
        });
        if (operation.relations.length) {
          await tx.collectionRelation.createMany({
            data: operation.relations.map((relation) => ({
              ...relation,
              sourceRecordId: created.id,
            })),
          });
        }
        results.push({ action: "create", id: created.id });
        continue;
      }
      const updated = await tx.collectionRecord.updateMany({
        where: {
          collectionId: input.collectionId,
          deletedAt: null,
          id: operation.recordId,
          version: operation.expectedVersion,
        },
        data: {
          ...operation.canonicalEntity,
          searchText: recordSearchText(operation.values),
          valuesJson: asInputJson(operation.values),
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        const replay = await tx.collectionRecord.findFirst({
          where: {
            collectionId: input.collectionId,
            deletedAt: null,
            id: operation.recordId,
            version: operation.expectedVersion + 1,
          },
          include: {
            outgoingRelations: {
              where: { deletedAt: null },
              select: {
                fieldId: true,
                position: true,
                targetDocumentId: true,
                targetOrganizationId: true,
                targetPersonId: true,
                targetRecordId: true,
                targetTaskId: true,
              },
            },
          },
        });
        const replayMatches =
          replay != null &&
          replay.documentId === operation.canonicalEntity.documentId &&
          replay.organizationId === operation.canonicalEntity.organizationId &&
          replay.personId === operation.canonicalEntity.personId &&
          replay.taskId === operation.canonicalEntity.taskId &&
          (await sha256CanonicalJson(replay.valuesJson)) ===
            (await sha256CanonicalJson(operation.values)) &&
          (operation.relations === null ||
            collectionRelationSignature(replay.outgoingRelations) ===
              collectionRelationSignature(operation.relations));
        if (!replayMatches) {
          throw new Error(COLLECTION_RECORD_CONFLICT_MESSAGE);
        }
        results.push({ action: "unchanged", id: operation.recordId });
        continue;
      }
      if (operation.relations) {
        await tx.collectionRelation.updateMany({
          where: { deletedAt: null, sourceRecordId: operation.recordId },
          data: { deletedAt: new Date() },
        });
        if (operation.relations.length) {
          await tx.collectionRelation.createMany({
            data: operation.relations.map((relation) => ({
              ...relation,
              sourceRecordId: operation.recordId,
            })),
          });
        }
      }
      results.push({ action: "update", id: operation.recordId });
    }
    return results;
  });

  return Promise.all(
    written.map(async (result) => {
      const record = await getCollectionRecordForViewer(
        result.id,
        input.editorUserId,
      );
      if (!record) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
      return { action: result.action, record };
    }),
  );
}

async function visiblePersonId(
  personId: string | null,
  userId: string | null,
): Promise<string | null> {
  if (!personId) return null;
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      deletedAt: null,
      OR: [
        { isPublic: true },
        ...(userId
          ? [{ createdByUserId: userId }, { user: { id: userId } }]
          : []),
      ],
    },
    select: { id: true },
  });
  return person?.id ?? null;
}

async function toCollectionRecordDto(
  record: CollectionRecordWithRelations,
  userId: string | null,
  effectivePermission: ContentAccessLevel,
): Promise<CollectionRecordDto> {
  const [taskVisible, documentVisible, personId, organizationVisible] =
    await Promise.all([
      record.taskId
        ? canUserViewTask(record.taskId, userId)
        : Promise.resolve(false),
      record.documentId
        ? assertDocumentAccess(
            record.documentId,
            userId,
            ContentAccessLevel.VIEW,
          ).then(
            () => true,
            () => false,
          )
        : Promise.resolve(false),
      visiblePersonId(record.personId, userId),
      record.organizationId
        ? canUserViewOrganization(record.organizationId, userId)
        : Promise.resolve(false),
    ]);
  const visibleRelations = await Promise.all(
    record.outgoingRelations.map(async (relation) => {
      let targetRecordId = relation.targetRecordId;
      let targetTaskId = relation.targetTaskId;
      let targetPersonId = relation.targetPersonId;
      let targetOrganizationId = relation.targetOrganizationId;
      let targetDocumentId = relation.targetDocumentId;
      if (targetRecordId) {
        const target = await prisma.collectionRecord.findFirst({
          where: { id: targetRecordId, deletedAt: null },
          select: { collectionId: true },
        });
        const access = target
          ? await resolveCollectionAccess(target.collectionId, userId)
          : null;
        if (!access) targetRecordId = null;
      }
      if (targetTaskId && !(await canUserViewTask(targetTaskId, userId))) {
        targetTaskId = null;
      }
      if (targetPersonId) {
        targetPersonId = await visiblePersonId(targetPersonId, userId);
      }
      if (
        targetOrganizationId &&
        !(await canUserViewOrganization(targetOrganizationId, userId))
      ) {
        targetOrganizationId = null;
      }
      if (targetDocumentId) {
        const canView = await assertDocumentAccess(
          targetDocumentId,
          userId,
          ContentAccessLevel.VIEW,
        ).then(
          () => true,
          () => false,
        );
        if (!canView) targetDocumentId = null;
      }
      const hasVisibleTarget =
        targetRecordId ||
        targetTaskId ||
        targetPersonId ||
        targetOrganizationId ||
        targetDocumentId;
      if (!hasVisibleTarget) return null;
      return {
        fieldKey: relation.field.key,
        id: relation.id,
        position: relation.position,
        targetDocumentId,
        targetOrganizationId,
        targetPersonId,
        targetRecordId,
        targetTaskId,
      };
    }),
  );
  return {
    canonicalEntity: {
      documentId: documentVisible ? record.documentId : null,
      organizationId: organizationVisible ? record.organizationId : null,
      personId,
      taskId: taskVisible ? record.taskId : null,
    },
    collectionId: record.collectionId,
    createdAt: record.createdAt.toISOString(),
    id: record.id,
    relations: visibleRelations.filter(
      (relation): relation is NonNullable<typeof relation> => relation != null,
    ),
    sourceKey:
      effectivePermission === ContentAccessLevel.FULL_ACCESS
        ? record.sourceKey
        : null,
    sourceUrl:
      effectivePermission === ContentAccessLevel.FULL_ACCESS
        ? record.sourceUrl
        : null,
    updatedAt: record.updatedAt.toISOString(),
    values: record.valuesJson as Record<string, unknown>,
    version: record.version,
  };
}

export async function getCollectionRecordForViewer(
  recordId: string,
  userId?: string | null,
): Promise<CollectionRecordDto | null> {
  const record = await prisma.collectionRecord.findFirst({
    where: { id: recordId.trim(), deletedAt: null },
    include: recordInclude,
  });
  if (!record) return null;
  const access = await resolveCollectionAccess(
    record.collectionId,
    userId ?? null,
  );
  if (!access) return null;
  return toCollectionRecordDto(record, userId ?? null, access);
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function filterMatches(
  values: Record<string, unknown>,
  filter: CollectionFilter,
  fieldType?: CollectionFieldType,
): boolean {
  const actual = values[filter.fieldKey];
  const requested =
    typeof actual === "boolean" && typeof filter.value === "string"
      ? ["yes", "true"].includes(filter.value.trim().toLocaleLowerCase())
        ? true
        : ["no", "false"].includes(filter.value.trim().toLocaleLowerCase())
          ? false
          : filter.value
      : filter.value;
  if (fieldType === CollectionFieldType.DATE) {
    const day = (value: unknown) => {
      const text = typeof value === "string" ? value : "";
      return /^\d{4}-\d{2}-\d{2}/u.test(text) ? text.slice(0, 10) : null;
    };
    const actualDay = day(actual);
    const requestedDay = day(requested);
    if (filter.operator === "equals") return actualDay === requestedDay;
    if (filter.operator === "notEquals") return actualDay !== requestedDay;
    if (filter.operator === "greaterThan") {
      return Boolean(
        actualDay && requestedDay && actualDay.localeCompare(requestedDay) > 0,
      );
    }
    if (filter.operator === "lessThan") {
      return Boolean(
        actualDay && requestedDay && actualDay.localeCompare(requestedDay) < 0,
      );
    }
  }
  switch (filter.operator) {
    case "equals":
      return JSON.stringify(actual) === JSON.stringify(requested);
    case "notEquals":
      return JSON.stringify(actual) !== JSON.stringify(requested);
    case "contains":
      return Array.isArray(actual)
        ? actual.includes(requested)
        : String(
            typeof actual === "boolean"
              ? actual
                ? "yes"
                : "no"
              : (actual ?? ""),
          )
            .toLocaleLowerCase()
            .includes(String(requested ?? "").toLocaleLowerCase());
    case "isEmpty":
      return (
        actual == null ||
        actual === "" ||
        (Array.isArray(actual) && !actual.length)
      );
    case "greaterThan":
      return compareValues(actual, requested) > 0;
    case "lessThan":
      return compareValues(actual, requested) < 0;
  }
}

export async function queryCollectionRecords(input: {
  collectionId: string;
  cursor?: string | null;
  filters?: CollectionFilter[];
  limit?: number | null;
  query?: string | null;
  sorts?: CollectionSort[];
  userId?: string | null;
}): Promise<{ nextCursor: string | null; records: CollectionRecordDto[] }> {
  await assertCollectionAccess(
    input.collectionId,
    input.userId,
    ContentAccessLevel.VIEW,
  );
  const view = await getCollectionForViewer(input.collectionId, input.userId);
  if (!view) throw new Error(COLLECTION_NOT_FOUND_MESSAGE);
  const fieldKeys = new Set(view.collection.fields.map((field) => field.key));
  for (const filter of input.filters ?? []) {
    if (!fieldKeys.has(filter.fieldKey)) {
      throw new Error(`Unknown filter field: ${filter.fieldKey}`);
    }
  }
  for (const sort of input.sorts ?? []) {
    if (!fieldKeys.has(sort.fieldKey)) {
      throw new Error(`Unknown sort field: ${sort.fieldKey}`);
    }
  }
  const query = input.query?.trim().toLocaleLowerCase() ?? "";
  if (query.length > 500)
    throw new Error("query must be 500 characters or fewer");
  const hasInMemoryOperations =
    query.length > 0 ||
    (input.filters?.length ?? 0) > 0 ||
    (input.sorts?.length ?? 0) > 0;
  const rows = await prisma.collectionRecord.findMany({
    where: { collectionId: input.collectionId, deletedAt: null },
    include: recordInclude,
    orderBy: { createdAt: "asc" },
    take: hasInMemoryOperations
      ? MAX_RECORD_SCAN + 1
      : MAX_RECORDS_PER_QUERY + 1,
    ...(!hasInMemoryOperations && input.cursor
      ? { cursor: { id: input.cursor }, skip: 1 }
      : {}),
  });
  if (hasInMemoryOperations && rows.length > MAX_RECORD_SCAN) {
    throw new Error(
      `Filtered and sorted queries are limited to ${MAX_RECORD_SCAN} records`,
    );
  }
  const fieldTypeByKey = new Map(
    view.collection.fields.map((field) => [field.key, field.type]),
  );
  let filtered = rows.filter(
    (row) =>
      (!query || row.searchText.toLocaleLowerCase().includes(query)) &&
      (input.filters ?? []).every((filter) =>
        filterMatches(
          row.valuesJson as Record<string, unknown>,
          filter,
          fieldTypeByKey.get(filter.fieldKey),
        ),
      ),
  );
  const sorts = input.sorts ?? [];
  if (sorts.length) {
    filtered = [...filtered].sort((left, right) => {
      for (const sort of sorts) {
        const compared = compareValues(
          (left.valuesJson as Record<string, unknown>)[sort.fieldKey],
          (right.valuesJson as Record<string, unknown>)[sort.fieldKey],
        );
        if (compared) return sort.direction === "asc" ? compared : -compared;
      }
      return left.id.localeCompare(right.id);
    });
  }
  const startIndex =
    hasInMemoryOperations && input.cursor
      ? Math.max(filtered.findIndex((row) => row.id === input.cursor) + 1, 0)
      : 0;
  const limit = Math.min(
    Math.max(Math.trunc(input.limit ?? 100), 1),
    MAX_RECORDS_PER_QUERY,
  );
  const page = filtered.slice(startIndex, startIndex + limit);
  const records = await Promise.all(
    page.map((record) =>
      toCollectionRecordDto(
        record,
        input.userId ?? null,
        view.effectivePermission,
      ),
    ),
  );
  return {
    records,
    nextCursor:
      startIndex + page.length < filtered.length
        ? (page.at(-1)?.id ?? null)
        : null,
  };
}

export async function listCollectionsForViewer(input: {
  limit?: number | null;
  userId?: string | null;
}) {
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 100), 1), 500);
  const candidates = await prisma.collection.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 2_000,
    select: {
      id: true,
      name: true,
      description: true,
      organizationId: true,
      updatedAt: true,
      version: true,
      visibility: true,
    },
  });
  const accessById = await resolveCollectionAccessBatch(
    candidates.map((collection) => collection.id),
    input.userId ?? null,
  );
  return candidates
    .map((collection) => ({
      collection,
      effectivePermission: accessById.get(collection.id) ?? null,
    }))
    .filter(
      (row): row is typeof row & { effectivePermission: ContentAccessLevel } =>
        row.effectivePermission != null,
    )
    .slice(0, limit)
    .map(({ collection, effectivePermission }) => ({
      ...collection,
      effectivePermission,
      updatedAt: collection.updatedAt.toISOString(),
    }));
}
