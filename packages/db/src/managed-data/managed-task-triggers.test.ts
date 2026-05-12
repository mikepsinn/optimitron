import { describe, expect, it } from "vitest";
import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  type PrismaClient,
} from "../generated/prisma/client.js";
import {
  syncManagedTaskTriggers,
  type ManagedTaskTriggerInput,
} from "./managed-task-triggers.js";

type Row = Record<string, unknown>;

const baseTrigger: ManagedTaskTriggerInput = {
  triggerKey: "managed:test",
  eventName: "test.event",
  enabled: true,
  idempotencyKeyTemplate: "managed:test:{{user.id}}",
  notes: "Managed test trigger",
  spawnSpecs: [
    {
      kind: "root",
      isParent: true,
      titleTemplate: "Original title",
      descriptionTemplate: "Original body",
      category: "OTHER",
      difficulty: "TRIVIAL",
      claimPolicy: "ASSIGNED_ONLY",
      creatorResolver: "actor",
      assigneePersonResolver: "actor",
      parentResolver: "none",
    },
  ],
};

class FakeTaskTriggerClient {
  taskTriggers: Row[] = [];
  spawnSpecs: Row[] = [];
  communicationSpawnSpecs: Row[] = [];

  taskTrigger = {
    findMany: async (args: {
      where: { triggerKey: { in: string[] } };
    }) => {
      const keys = new Set(args.where.triggerKey.in);
      return this.taskTriggers
        .filter((row) => keys.has(String(row["triggerKey"])))
        .map((row) => ({
          ...row,
          spawnSpecs: this.spawnSpecs.filter(
            (spec) => spec["triggerId"] === row["id"],
          ),
          communicationSpawnSpecs: this.communicationSpawnSpecs.filter(
            (spec) => spec["triggerId"] === row["id"],
          ),
        }));
    },
    create: async (args: { data: Row }) => {
      const id = `trigger-${this.taskTriggers.length + 1}`;
      const { spawnSpecs, communicationSpawnSpecs, ...data } = args.data;
      const row = { id, ...data };
      this.taskTriggers.push(row);
      for (const spec of getNestedCreates(spawnSpecs)) {
        this.spawnSpecs.push({
          id: `spawn-${this.spawnSpecs.length + 1}`,
          triggerId: id,
          ...spec,
        });
      }
      for (const spec of getNestedCreates(communicationSpawnSpecs)) {
        this.communicationSpawnSpecs.push({
          id: `comm-${this.communicationSpawnSpecs.length + 1}`,
          triggerId: id,
          ...spec,
        });
      }
      return {
        ...row,
        spawnSpecs: this.spawnSpecs.filter((spec) => spec["triggerId"] === id),
        communicationSpawnSpecs: this.communicationSpawnSpecs.filter(
          (spec) => spec["triggerId"] === id,
        ),
      };
    },
    update: async (args: { data: Row; where: { triggerKey: string } }) => {
      const row = this.taskTriggers.find(
        (candidate) => candidate["triggerKey"] === args.where.triggerKey,
      );
      if (!row) throw new Error(`Missing trigger ${args.where.triggerKey}`);
      Object.assign(row, args.data);
      return row;
    },
  };

  taskSpawnSpec = {
    deleteMany: async (args: { where: { triggerId: string } }) => {
      const before = this.spawnSpecs.length;
      this.spawnSpecs = this.spawnSpecs.filter(
        (spec) => spec["triggerId"] !== args.where.triggerId,
      );
      return { count: before - this.spawnSpecs.length };
    },
    createMany: async (args: { data: Row[] }) => {
      for (const spec of args.data) {
        this.spawnSpecs.push({
          id: `spawn-${this.spawnSpecs.length + 1}`,
          ...spec,
        });
      }
      return { count: args.data.length };
    },
  };

  taskCommunicationSpawnSpec = {
    deleteMany: async (args: { where: { triggerId: string } }) => {
      const before = this.communicationSpawnSpecs.length;
      this.communicationSpawnSpecs = this.communicationSpawnSpecs.filter(
        (spec) => spec["triggerId"] !== args.where.triggerId,
      );
      return { count: before - this.communicationSpawnSpecs.length };
    },
    createMany: async (args: { data: Row[] }) => {
      for (const spec of args.data) {
        this.communicationSpawnSpecs.push({
          id: `comm-${this.communicationSpawnSpecs.length + 1}`,
          ...spec,
        });
      }
      return { count: args.data.length };
    },
  };

  async $transaction<T>(callback: (client: this) => Promise<T>) {
    return callback(this);
  }
}

function getNestedCreates(value: unknown): Row[] {
  if (
    value &&
    typeof value === "object" &&
    "create" in value &&
    Array.isArray((value as { create?: unknown }).create)
  ) {
    return (value as { create: Row[] }).create;
  }
  return [];
}

function syncWithFake(
  client: FakeTaskTriggerClient,
  input: { apply: boolean; records: ManagedTaskTriggerInput[]; now?: Date },
) {
  return syncManagedTaskTriggers(client as unknown as PrismaClient, input);
}

describe("syncManagedTaskTriggers", () => {
  it("reports creates in dry-run without writing", async () => {
    const client = new FakeTaskTriggerClient();

    await expect(
      syncWithFake(client, { apply: false, records: [baseTrigger] }),
    ).resolves.toMatchObject({
      mode: "dry-run",
      created: ["managed:test"],
      updated: [],
    });

    expect(client.taskTriggers).toHaveLength(0);
    expect(client.spawnSpecs).toHaveLength(0);
  });

  it("creates and updates managed trigger rows by triggerKey", async () => {
    const client = new FakeTaskTriggerClient();

    await syncWithFake(client, { apply: true, records: [baseTrigger] });

    expect(client.taskTriggers[0]).toMatchObject({
      triggerKey: "managed:test",
      eventName: "test.event",
      enabled: true,
      deletedAt: null,
    });
    expect(client.spawnSpecs[0]).toMatchObject({
      kind: "root",
      titleTemplate: "Original title",
      category: TaskCategory.OTHER,
      difficulty: TaskDifficulty.TRIVIAL,
      claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    });

    const updatedTrigger: ManagedTaskTriggerInput = {
      ...baseTrigger,
      notes: "Updated managed test trigger",
      spawnSpecs: [
        {
          ...baseTrigger.spawnSpecs![0]!,
          titleTemplate: "Updated title",
        },
      ],
    };

    await expect(
      syncWithFake(client, { apply: true, records: [updatedTrigger] }),
    ).resolves.toMatchObject({
      mode: "apply",
      created: [],
      updated: ["managed:test"],
    });

    expect(client.taskTriggers).toHaveLength(1);
    expect(client.taskTriggers[0]).toMatchObject({
      notes: "Updated managed test trigger",
    });
    expect(client.spawnSpecs).toHaveLength(1);
    expect(client.spawnSpecs[0]).toMatchObject({
      titleTemplate: "Updated title",
    });
  });

  it("soft-disables explicitly retired triggers only", async () => {
    const client = new FakeTaskTriggerClient();
    await syncWithFake(client, { apply: true, records: [baseTrigger] });
    const now = new Date("2026-05-12T12:00:00.000Z");

    await expect(
      syncWithFake(client, {
        apply: true,
        now,
        records: [
          {
            ...baseTrigger,
            retired: true,
            disabledReason: "No longer part of managed task triggers.",
          },
          {
            triggerKey: "managed:already-absent",
            eventName: "test.event",
            idempotencyKeyTemplate: "managed:already-absent",
            retired: true,
          },
        ],
      }),
    ).resolves.toMatchObject({
      retired: ["managed:test"],
      missingRetired: ["managed:already-absent"],
    });

    expect(client.taskTriggers[0]).toMatchObject({
      enabled: false,
      disabledReason: "No longer part of managed task triggers.",
      deletedAt: now,
    });
  });
});
