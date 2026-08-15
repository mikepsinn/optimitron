import { describe, expect, it } from "vitest";
import type { PrismaClient } from "../generated/prisma/client.js";
import {
  MANAGED_DEMO_COLLECTION_ID,
  MANAGED_DEMO_DOCUMENT_ID,
} from "../constants.js";
import {
  MANAGED_DEMO_VISIBLE_CONTENT,
  syncManagedDemoContent,
} from "./managed-demo-content.js";

type Row = Record<string, unknown>;

class FakeManagedDemoClient {
  collectionRecords: Row[] = [
    {
      collectionId: MANAGED_DEMO_COLLECTION_ID,
      id: "managed-demo-apg-record-vaultanium",
      searchText: "Finish the Vaultanium Systems proposal",
      sourceKey: "managed:demo:record:vaultanium-proposal",
      valuesJson: { name: "Finish the Vaultanium Systems proposal" },
    },
  ];

  documentRevisions: Row[] = [
    {
      body: "Apply after Tom reviews the on-premises agent proposal.",
      documentId: MANAGED_DEMO_DOCUMENT_ID,
      id: "managed-demo-apg-operating-note-v1",
      title: "Autonomous Public Goods operating note",
    },
  ];

  user = {
    findUniqueOrThrow: async () => ({ id: "demo-user" }),
  };

  document = {
    upsert: async (args: { create: Row }) => args.create,
    update: async (args: { data: Row }) => args.data,
  };

  documentRevision = {
    upsert: async (args: {
      create: Row;
      update: Row;
      where: { id: string };
    }) => {
      const existing = this.documentRevisions.find(
        (row) => row["id"] === args.where.id,
      );
      if (!existing) {
        this.documentRevisions.push({ ...args.create });
        return args.create;
      }
      Object.assign(existing, args.update);
      return existing;
    },
  };

  collection = {
    upsert: async (args: { create: Row }) => args.create,
  };

  collectionField = {
    upsert: async (args: { create: Row }) => args.create,
  };

  collectionRecord = {
    updateMany: async (args: {
      data: Row;
      where: { collectionId: string; id: string };
    }) => {
      const matches = this.collectionRecords.filter(
        (row) =>
          row["collectionId"] === args.where.collectionId &&
          row["id"] === args.where.id,
      );
      for (const row of matches) Object.assign(row, args.data);
      return { count: matches.length };
    },
    upsert: async (args: {
      create: Row;
      update: Row;
      where: {
        collectionId_sourceKey: {
          collectionId: string;
          sourceKey: string;
        };
      };
    }) => {
      const key = args.where.collectionId_sourceKey;
      const existing = this.collectionRecords.find(
        (row) =>
          row["collectionId"] === key.collectionId &&
          row["sourceKey"] === key.sourceKey,
      );
      if (!existing) {
        this.collectionRecords.push({ ...args.create });
        return args.create;
      }
      Object.assign(existing, args.update);
      return existing;
    },
  };

  collectionView = {
    upsert: async (args: { create: Row }) => args.create,
  };

  $transaction = async <T>(
    operation: (tx: FakeManagedDemoClient) => Promise<T>,
  ): Promise<T> => operation(this);
}

describe("managed demo content privacy", () => {
  it("labels every public-facing fixture value as synthetic demo data", () => {
    const searchableLabels = [
      MANAGED_DEMO_VISIBLE_CONTENT.collectionDescription,
      MANAGED_DEMO_VISIBLE_CONTENT.collectionName,
      MANAGED_DEMO_VISIBLE_CONTENT.documentBody,
      MANAGED_DEMO_VISIBLE_CONTENT.documentTitle,
      ...MANAGED_DEMO_VISIBLE_CONTENT.records.map((record) => record.name),
    ];

    for (const label of searchableLabels) {
      expect(label).toMatch(/\b(?:demo|synthetic)\b/i);
    }
  });

  it("does not restore the private-inspired fixture that reached public screenshots", () => {
    expect(JSON.stringify(MANAGED_DEMO_VISIBLE_CONTENT)).not.toMatch(
      /Vaultanium|Autonomous Public Goods|on-premises agent|\bTom\b/i,
    );
  });

  it("scrubs existing private-inspired content during managed-data sync", async () => {
    const client = new FakeManagedDemoClient();

    await expect(
      syncManagedDemoContent(client as unknown as PrismaClient, { apply: true }),
    ).resolves.toEqual({ dryRun: false, synced: true });

    const legacyRecord = client.collectionRecords.find(
      (record) => record["id"] === "managed-demo-apg-record-vaultanium",
    );
    const replacementRecord = client.collectionRecords.find(
      (record) =>
        record["id"] === "managed-demo-apg-record-health-proposal",
    );
    const currentRevision = client.documentRevisions.find(
      (revision) => revision["id"] === "managed-demo-apg-operating-note-v1",
    );

    expect(legacyRecord).toMatchObject({
      deletedAt: expect.any(Date),
      searchText: "Removed synthetic demo fixture.",
      sourceKey: "managed:demo:record:retired-private-inspired",
      valuesJson: { name: "Removed synthetic demo fixture" },
    });
    expect(
      JSON.stringify({
        searchText: legacyRecord?.["searchText"],
        sourceKey: legacyRecord?.["sourceKey"],
        valuesJson: legacyRecord?.["valuesJson"],
      }),
    ).not.toMatch(
      /Vaultanium|Autonomous Public Goods|on-premises agent|\bTom\b/i,
    );
    expect(replacementRecord).toMatchObject({
      id: "managed-demo-apg-record-health-proposal",
      valuesJson: { name: "Review the demo health proposal" },
    });
    expect(currentRevision).toMatchObject({
      body: MANAGED_DEMO_VISIBLE_CONTENT.documentBody,
      title: MANAGED_DEMO_VISIBLE_CONTENT.documentTitle,
    });
  });
});
