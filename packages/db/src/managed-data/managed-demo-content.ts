import { DEMO_USER_EMAIL } from "@optimitron/data/campaign";
import {
  CollectionFieldType,
  ContentVisibility,
  Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";
import {
  MANAGED_DEMO_COLLECTION_ID,
  MANAGED_DEMO_DOCUMENT_ID,
} from "../constants.js";

const MANAGED_DEMO_CONTENT_DATE = new Date("2026-07-15T00:00:00.000Z");
const MANAGED_DEMO_DOCUMENT_REVISION_ID = "managed-demo-apg-operating-note-v1";
const MANAGED_DEMO_COLLECTION_SOURCE_KEY =
  "managed:demo:collection:apg-projects";
const MANAGED_DEMO_DOCUMENT_SOURCE_KEY =
  "managed:demo:document:apg-operating-note";
const LEGACY_PRIVATE_INSPIRED_RECORD_ID =
  "managed-demo-apg-record-vaultanium";
const RETIRED_LEGACY_RECORD_SOURCE_KEY =
  "managed:demo:record:retired-private-inspired";

export const MANAGED_DEMO_VISIBLE_CONTENT = {
  collectionDescription:
    "Synthetic records for content search and visual review. No real organization or proposal is represented.",
  collectionName: "Synthetic demo projects",
  documentBody: `## Current decision

Use this synthetic note to verify private document search and Markdown rendering.
It does not describe a real person, organization, or proposal.

## Done when

- The demo budget has sources.
- The demo application names one measurable outcome.
- The demo record has a next action.

> This is synthetic test data.`,
  documentTitle: "Synthetic demo project note",
  records: [
    {
      expected_value: 25,
      hours: 3,
      name: "Prepare the demo grant application",
      status: "Next",
      value_per_hour: 8.3,
    },
    {
      expected_value: 18,
      hours: 6,
      name: "Review the demo health proposal",
      status: "Waiting",
      value_per_hour: 3,
    },
  ],
} as const;

const DOCUMENT_TITLE = MANAGED_DEMO_VISIBLE_CONTENT.documentTitle;
const DOCUMENT_BODY = MANAGED_DEMO_VISIBLE_CONTENT.documentBody;

const COLLECTION_FIELDS = [
  {
    id: "managed-demo-apg-field-name",
    key: "name",
    name: "Name",
    position: 0,
    required: true,
    type: CollectionFieldType.TEXT,
  },
  {
    id: "managed-demo-apg-field-status",
    key: "status",
    name: "Status",
    optionsJson: { options: ["Next", "Waiting", "Done"] },
    position: 1,
    required: true,
    type: CollectionFieldType.SELECT,
  },
  {
    id: "managed-demo-apg-field-expected-value",
    key: "expected_value",
    name: "Expected value",
    position: 2,
    required: true,
    type: CollectionFieldType.NUMBER,
  },
  {
    id: "managed-demo-apg-field-hours",
    key: "hours",
    name: "Hours",
    position: 3,
    required: true,
    type: CollectionFieldType.NUMBER,
  },
  {
    id: "managed-demo-apg-field-value-per-hour",
    key: "value_per_hour",
    name: "Value per hour",
    optionsJson: {
      dependencies: ["expected_value", "hours"],
      expression: "round(expected_value / hours, 1)",
    },
    position: 4,
    required: false,
    type: CollectionFieldType.FORMULA,
  },
] as const;

const COLLECTION_RECORDS = [
  {
    id: "managed-demo-apg-record-grant",
    sourceKey: "managed:demo:record:apg-grant",
    values: MANAGED_DEMO_VISIBLE_CONTENT.records[0],
  },
  {
    id: "managed-demo-apg-record-health-proposal",
    sourceKey: "managed:demo:record:health-proposal",
    values: MANAGED_DEMO_VISIBLE_CONTENT.records[1],
  },
] as const;

export async function syncManagedDemoContent(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ synced: boolean; dryRun: boolean }> {
  if (!options.apply) return { synced: false, dryRun: true };

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.document.upsert({
      where: { id: MANAGED_DEMO_DOCUMENT_ID },
      create: {
        createdAt: MANAGED_DEMO_CONTENT_DATE,
        createdByUserId: user.id,
        id: MANAGED_DEMO_DOCUMENT_ID,
        searchText: `${DOCUMENT_TITLE}\n${DOCUMENT_BODY}`,
        sourceKey: MANAGED_DEMO_DOCUMENT_SOURCE_KEY,
        title: DOCUMENT_TITLE,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        version: 1,
        visibility: ContentVisibility.PRIVATE,
      },
      update: {
        createdByUserId: user.id,
        deletedAt: null,
        searchText: `${DOCUMENT_TITLE}\n${DOCUMENT_BODY}`,
        sourceKey: MANAGED_DEMO_DOCUMENT_SOURCE_KEY,
        title: DOCUMENT_TITLE,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        visibility: ContentVisibility.PRIVATE,
      },
    });

    await tx.documentRevision.upsert({
      where: { id: MANAGED_DEMO_DOCUMENT_REVISION_ID },
      create: {
        body: DOCUMENT_BODY,
        createdAt: MANAGED_DEMO_CONTENT_DATE,
        createdByUserId: user.id,
        documentId: MANAGED_DEMO_DOCUMENT_ID,
        id: MANAGED_DEMO_DOCUMENT_REVISION_ID,
        title: DOCUMENT_TITLE,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        version: 1,
      },
      update: {
        body: DOCUMENT_BODY,
        createdByUserId: user.id,
        deletedAt: null,
        title: DOCUMENT_TITLE,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
      },
    });

    await tx.document.update({
      where: { id: MANAGED_DEMO_DOCUMENT_ID },
      data: {
        currentRevisionId: MANAGED_DEMO_DOCUMENT_REVISION_ID,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        version: 1,
      },
    });

    await tx.collection.upsert({
      where: { id: MANAGED_DEMO_COLLECTION_ID },
      create: {
        createdAt: MANAGED_DEMO_CONTENT_DATE,
        createdByUserId: user.id,
        description: MANAGED_DEMO_VISIBLE_CONTENT.collectionDescription,
        id: MANAGED_DEMO_COLLECTION_ID,
        name: MANAGED_DEMO_VISIBLE_CONTENT.collectionName,
        sourceKey: MANAGED_DEMO_COLLECTION_SOURCE_KEY,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        visibility: ContentVisibility.PRIVATE,
      },
      update: {
        createdByUserId: user.id,
        deletedAt: null,
        description: MANAGED_DEMO_VISIBLE_CONTENT.collectionDescription,
        name: MANAGED_DEMO_VISIBLE_CONTENT.collectionName,
        sourceKey: MANAGED_DEMO_COLLECTION_SOURCE_KEY,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        visibility: ContentVisibility.PRIVATE,
      },
    });

    for (const field of COLLECTION_FIELDS) {
      await tx.collectionField.upsert({
        where: {
          collectionId_key: {
            collectionId: MANAGED_DEMO_COLLECTION_ID,
            key: field.key,
          },
        },
        create: {
          collectionId: MANAGED_DEMO_COLLECTION_ID,
          createdAt: MANAGED_DEMO_CONTENT_DATE,
          createdByUserId: user.id,
          id: field.id,
          key: field.key,
          name: field.name,
          optionsJson:
            "optionsJson" in field ? field.optionsJson : Prisma.DbNull,
          position: field.position,
          required: field.required,
          type: field.type,
          updatedAt: MANAGED_DEMO_CONTENT_DATE,
        },
        update: {
          createdByUserId: user.id,
          deletedAt: null,
          name: field.name,
          optionsJson:
            "optionsJson" in field ? field.optionsJson : Prisma.DbNull,
          position: field.position,
          required: field.required,
          type: field.type,
          updatedAt: MANAGED_DEMO_CONTENT_DATE,
        },
      });
    }

    await tx.collectionRecord.updateMany({
      where: {
        collectionId: MANAGED_DEMO_COLLECTION_ID,
        id: LEGACY_PRIVATE_INSPIRED_RECORD_ID,
      },
      data: {
        deletedAt: MANAGED_DEMO_CONTENT_DATE,
        searchText: "Removed synthetic demo fixture.",
        sourceKey: RETIRED_LEGACY_RECORD_SOURCE_KEY,
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        valuesJson: {
          expected_value: 0,
          hours: 0,
          name: "Removed synthetic demo fixture",
          status: "Done",
          value_per_hour: 0,
        },
        version: 1,
      },
    });

    for (const record of COLLECTION_RECORDS) {
      const searchText = [
        record.values.name,
        `Status: ${record.values.status}.`,
        `Expected value: ${record.values.expected_value}.`,
        `Hours: ${record.values.hours}.`,
        `Value per hour: ${record.values.value_per_hour}.`,
      ].join(" ");
      await tx.collectionRecord.upsert({
        where: {
          collectionId_sourceKey: {
            collectionId: MANAGED_DEMO_COLLECTION_ID,
            sourceKey: record.sourceKey,
          },
        },
        create: {
          collectionId: MANAGED_DEMO_COLLECTION_ID,
          createdAt: MANAGED_DEMO_CONTENT_DATE,
          createdByUserId: user.id,
          id: record.id,
          searchText,
          sourceKey: record.sourceKey,
          updatedAt: MANAGED_DEMO_CONTENT_DATE,
          valuesJson: record.values,
        },
        update: {
          createdByUserId: user.id,
          deletedAt: null,
          searchText,
          updatedAt: MANAGED_DEMO_CONTENT_DATE,
          valuesJson: record.values,
          version: 1,
        },
      });
    }

    await tx.collectionView.upsert({
      where: {
        collectionId_name: {
          collectionId: MANAGED_DEMO_COLLECTION_ID,
          name: "Current work",
        },
      },
      create: {
        collectionId: MANAGED_DEMO_COLLECTION_ID,
        createdAt: MANAGED_DEMO_CONTENT_DATE,
        createdByUserId: user.id,
        filterJson: [],
        id: "managed-demo-apg-view-current-work",
        isDefault: true,
        name: "Current work",
        sortJson: [{ direction: "desc", fieldKey: "value_per_hour" }],
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        visibleFieldIds: COLLECTION_FIELDS.map((field) => field.id),
      },
      update: {
        createdByUserId: user.id,
        deletedAt: null,
        filterJson: [],
        isDefault: true,
        sortJson: [{ direction: "desc", fieldKey: "value_per_hour" }],
        updatedAt: MANAGED_DEMO_CONTENT_DATE,
        version: 1,
        visibleFieldIds: COLLECTION_FIELDS.map((field) => field.id),
      },
    });
  });

  return { synced: true, dryRun: false };
}

export function formatManagedDemoContentResult(result: {
  synced: boolean;
  dryRun: boolean;
}): string {
  if (result.dryRun) return "Demo content: would sync (dry-run)";
  return result.synced ? "Demo content: synced" : "Demo content: unchanged";
}
