import { describe, expect, it } from "vitest";
import {
  TaskCategory,
  TaskClaimPolicy,
  TaskCommunicationEndpointKind,
  TaskCommunicationEndpointVerificationStatus,
  TaskDeadlinePolicy,
  TaskDifficulty,
  TaskStatus,
} from "../generated/prisma/client.js";
import {
  syncManagedTasks,
  type ManagedTaskClient,
  type ManagedTaskRecord,
} from "./sync-managed-tasks.js";

type FakeTask = {
  id: string;
  taskKey: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  impactStatement: string | null;
  category: typeof TaskCategory[keyof typeof TaskCategory];
  difficulty: typeof TaskDifficulty[keyof typeof TaskDifficulty];
  estimatedEffortHours: number | null;
  skillTags: string[];
  interestTags: string[];
  contextJson: unknown;
  claimPolicy: typeof TaskClaimPolicy[keyof typeof TaskClaimPolicy];
  maxClaims: number | null;
  status: typeof TaskStatus[keyof typeof TaskStatus];
  isPublic: boolean;
  availableAt: Date | null;
  dueAt: Date | null;
  deadlinePolicy: typeof TaskDeadlinePolicy[keyof typeof TaskDeadlinePolicy];
  sortOrder: number;
  deletedAt: Date | null;
  createdByUserId: string;
};

type FakeEndpoint = {
  id: string;
  taskId: string;
  kind: typeof TaskCommunicationEndpointKind[keyof typeof TaskCommunicationEndpointKind];
  label: string | null;
  url: string | null;
  email: string | null;
  instructions: string | null;
  sourceUrl: string | null;
  verificationStatus: typeof TaskCommunicationEndpointVerificationStatus[keyof typeof TaskCommunicationEndpointVerificationStatus];
  priority: number;
  isPrimary: boolean;
  deletedAt: Date | null;
};

function makeTask(input: Partial<FakeTask> & Pick<FakeTask, "id" | "taskKey">): FakeTask {
  return {
    parentTaskId: null,
    title: "Old title",
    description: "Old description",
    impactStatement: null,
    category: TaskCategory.OTHER,
    difficulty: TaskDifficulty.INTERMEDIATE,
    estimatedEffortHours: null,
    skillTags: [],
    interestTags: [],
    contextJson: null,
    claimPolicy: TaskClaimPolicy.OPEN_SINGLE,
    maxClaims: null,
    status: TaskStatus.ACTIVE,
    isPublic: true,
    availableAt: null,
    dueAt: null,
    deadlinePolicy: TaskDeadlinePolicy.NONE,
    sortOrder: 0,
    deletedAt: null,
    createdByUserId: "old-user",
    ...input,
  };
}

function applyTaskData(task: FakeTask, data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    if (key === "parentTask") {
      const relation = value as
        | { connect?: { id: string }; disconnect?: boolean }
        | undefined;
      if (relation?.connect) task.parentTaskId = relation.connect.id;
      if (relation?.disconnect) task.parentTaskId = null;
      continue;
    }

    if (key === "createdByUser") {
      const relation = value as { connect?: { id: string } } | undefined;
      if (relation?.connect) task.createdByUserId = relation.connect.id;
      continue;
    }

    if (key in task) {
      (task as Record<string, unknown>)[key] = value;
    }
  }
}

function matchesIdOrTaskKey(where: Record<string, unknown>, task: FakeTask) {
  if (where["id"] && where["id"] !== task.id) return false;
  if (where["taskKey"] && where["taskKey"] !== task.taskKey) return false;
  return true;
}

class FakeManagedTaskClient implements ManagedTaskClient {
  tasks: FakeTask[];
  endpoints: FakeEndpoint[];

  constructor(input: { endpoints?: FakeEndpoint[]; tasks?: FakeTask[] }) {
    this.tasks = input.tasks ?? [];
    this.endpoints = input.endpoints ?? [];
  }

  task = {
    findMany: async (args: unknown) => {
      const where = (args as { where?: { OR?: Array<Record<string, unknown>> } }).where;
      const ids = new Set<string>();
      const keys = new Set<string>();
      for (const clause of where?.OR ?? []) {
        const idFilter = clause["id"] as { in?: string[] } | undefined;
        const keyFilter = clause["taskKey"] as { in?: string[] } | undefined;
        for (const id of idFilter?.in ?? []) ids.add(id);
        for (const key of keyFilter?.in ?? []) keys.add(key);
      }

      return this.tasks.filter(
        (task) =>
          ids.has(task.id) ||
          (task.taskKey !== null && keys.has(task.taskKey)),
      );
    },
    updateMany: async (args: unknown) => {
      const { where, data } = args as {
        where: { deletedAt?: null; OR?: Array<Record<string, unknown>> };
        data: Record<string, unknown>;
      };
      let count = 0;
      for (const task of this.tasks) {
        const deletedAtMatches =
          !("deletedAt" in where) || task.deletedAt === where.deletedAt;
        const identityMatches =
          !where.OR || where.OR.some((clause) => matchesIdOrTaskKey(clause, task));
        if (deletedAtMatches && identityMatches) {
          applyTaskData(task, data);
          count += 1;
        }
      }
      return { count };
    },
    upsert: async (args: unknown) => {
      const { where, create, update } = args as {
        where: { id: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      };
      let task = this.tasks.find((candidate) => candidate.id === where.id);
      if (!task) {
        const parentConnect = (
          create["parentTask"] as { connect?: { id: string } } | undefined
        )?.connect?.id;
        if (parentConnect && !this.tasks.some((item) => item.id === parentConnect)) {
          throw new Error(`Missing parent task ${parentConnect}`);
        }
        task = makeTask({
          id: create["id"] as string,
          taskKey: create["taskKey"] as string,
        });
        this.tasks.push(task);
        applyTaskData(task, create);
        return task;
      }

      applyTaskData(task, update);
      return task;
    },
  };

  taskCommunicationEndpoint = {
    create: async (args: unknown) => {
      const { data } = args as { data: Omit<FakeEndpoint, "id" | "deletedAt"> };
      const endpoint: FakeEndpoint = {
        id: `endpoint-${this.endpoints.length + 1}`,
        deletedAt: null,
        ...data,
      };
      this.endpoints.push(endpoint);
      return endpoint;
    },
    findFirst: async (args: unknown) => {
      const { where } = args as {
        where: { deletedAt: null; isPrimary?: boolean; taskId: string };
      };
      const endpoint =
        this.endpoints.find(
          (candidate) =>
            candidate.deletedAt === where.deletedAt &&
            (!("isPrimary" in where) || candidate.isPrimary === where.isPrimary) &&
            candidate.taskId === where.taskId,
        ) ?? null;
      if (!endpoint) return null;
      return {
        id: endpoint.id,
        email: endpoint.email,
        instructions: endpoint.instructions,
        isPrimary: endpoint.isPrimary,
        kind: endpoint.kind,
        label: endpoint.label,
        priority: endpoint.priority,
        sourceUrl: endpoint.sourceUrl,
        url: endpoint.url,
        verificationStatus: endpoint.verificationStatus,
      };
    },
    update: async (args: unknown) => {
      const { where, data } = args as {
        where: { id: string };
        data: Partial<FakeEndpoint>;
      };
      const endpoint = this.endpoints.find((candidate) => candidate.id === where.id);
      if (!endpoint) throw new Error(`Missing endpoint ${where.id}`);
      Object.assign(endpoint, data);
      return endpoint;
    },
    updateMany: async (args: unknown) => {
      const { where, data } = args as {
        where: { deletedAt?: null; isPrimary?: boolean; taskId: string };
        data: Partial<FakeEndpoint>;
      };
      let count = 0;
      for (const endpoint of this.endpoints) {
        const matches =
          endpoint.taskId === where.taskId &&
          (!("deletedAt" in where) || endpoint.deletedAt === where.deletedAt) &&
          (!("isPrimary" in where) || endpoint.isPrimary === where.isPrimary);
        if (matches) {
          Object.assign(endpoint, data);
          count += 1;
        }
      }
      return { count };
    },
  };
}

class TransactionalFakeManagedTaskClient extends FakeManagedTaskClient {
  transactionCalls = 0;

  async $transaction<T>(callback: (client: ManagedTaskClient) => Promise<T>) {
    this.transactionCalls += 1;
    return callback(this);
  }
}

const activeRecord: ManagedTaskRecord = {
  id: "root",
  taskKey: "program:test:root",
  parentTaskId: null,
  title: "Root task",
  description: "Managed root description.",
  category: TaskCategory.GOVERNANCE,
  claimPolicy: TaskClaimPolicy.OPEN_MANY,
  difficulty: TaskDifficulty.INTERMEDIATE,
  sortOrder: -100,
  primaryEndpoint: {
    label: "Open root task",
    url: "/tasks/root",
  },
};

describe("syncManagedTasks", () => {
  it("reports dry-run creates, updates, and retires without writing", async () => {
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({ id: "root", taskKey: "program:test:root", title: "Stale root" }),
        makeTask({ id: "retired", taskKey: "program:test:retired" }),
        makeTask({ id: "user-task", taskKey: "user:created", title: "Do not touch" }),
      ],
      endpoints: [
        {
          deletedAt: null,
          email: null,
          id: "endpoint-retired",
          instructions: null,
          isPrimary: true,
          kind: TaskCommunicationEndpointKind.ACTION_LINK,
          label: "Old retired endpoint",
          priority: 0,
          sourceUrl: null,
          taskId: "retired",
          url: "/old-retired-task",
          verificationStatus:
            TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
        },
      ],
    });

    const result = await syncManagedTasks(client, {
      apply: false,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      records: [
        activeRecord,
        {
          id: "retired",
          taskKey: "program:test:retired",
          parentTaskId: null,
          title: "Retired",
          description: "Retired row.",
          retired: true,
        },
        {
          id: "new-child",
          taskKey: "program:test:new-child",
          parentTaskId: "root",
          title: "New child",
          description: "New child description.",
        },
      ],
    });

    expect(result.updated).toContain("root (program:test:root)");
    expect(result.created).toContain("new-child (program:test:new-child)");
    expect(result.retired).toContain("retired (program:test:retired)");
    expect(result.endpointRetired).toContain("retired (program:test:retired)");
    expect(client.tasks.find((task) => task.id === "root")?.title).toBe(
      "Stale root",
    );
    expect(client.tasks.find((task) => task.id === "retired")?.deletedAt).toBeNull();
    expect(client.tasks.find((task) => task.id === "user-task")?.title).toBe(
      "Do not touch",
    );
  });

  it("upserts managed fields, endpoints, and explicit retired rows", async () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({ id: "root", taskKey: "program:test:root", title: "Stale root" }),
        makeTask({ id: "retired", taskKey: "program:test:retired" }),
        makeTask({ id: "user-task", taskKey: "user:created", title: "Do not touch" }),
      ],
    });
    const records: ManagedTaskRecord[] = [
      activeRecord,
      {
        id: "child",
        taskKey: "program:test:child",
        parentTaskId: "root",
        title: "Child task",
        description: "Managed child description.",
        primaryEndpoint: {
          label: "Open child",
          url: "/tasks/child",
        },
      },
      {
        id: "retired",
        taskKey: "program:test:retired",
        parentTaskId: null,
        title: "Retired",
        description: "Retired row.",
        retired: true,
      },
    ];

    await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      now,
      records,
    });

    const root = client.tasks.find((task) => task.id === "root");
    expect(root).toMatchObject({
      title: "Root task",
      description: "Managed root description.",
      createdByUserId: "old-user",
      sortOrder: -100,
    });
    expect(root?.contextJson).toMatchObject({
      managedData: {
        collectionKey: "test-tree",
        recordId: "root",
      },
    });

    expect(client.tasks.find((task) => task.id === "child")).toMatchObject({
      parentTaskId: "root",
      createdByUserId: "creator",
      title: "Child task",
    });
    expect(client.endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "child",
          isPrimary: true,
          label: "Open child",
          url: "/tasks/child",
        }),
      ]),
    );

    expect(client.tasks.find((task) => task.id === "retired")).toMatchObject({
      deletedAt: now,
      status: TaskStatus.STALE,
    });
    expect(client.tasks.find((task) => task.id === "user-task")?.title).toBe(
      "Do not touch",
    );

    const secondResult = await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      now,
      records,
    });

    expect(secondResult.created).toEqual([]);
    expect(secondResult.updated).toEqual([]);
    expect(secondResult.retired).toEqual([]);
    expect(secondResult.endpointUpdated).toEqual([]);
    expect(secondResult.endpointRetired).toEqual([]);
    expect(secondResult.unchanged).toEqual(
      expect.arrayContaining([
        "root (program:test:root)",
        "child (program:test:child)",
        "retired (program:test:retired)",
      ]),
    );
  });

  it("rejects taskKey ownership conflicts before applying writes", async () => {
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({ id: "root", taskKey: "program:test:old-root" }),
        makeTask({ id: "other", taskKey: "program:test:root" }),
      ],
    });

    await expect(
      syncManagedTasks(client, {
        apply: true,
        collectionKey: "test-tree",
        createdByUserId: "creator",
        records: [activeRecord],
      }),
    ).rejects.toThrow(
      "Managed task key program:test:root already belongs to other",
    );
    expect(client.tasks.find((task) => task.id === "root")?.taskKey).toBe(
      "program:test:old-root",
    );
  });

  it("runs apply mode inside a transaction when the client supports it", async () => {
    const client = new TransactionalFakeManagedTaskClient({ tasks: [] });

    await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      records: [activeRecord],
    });

    expect(client.transactionCalls).toBe(1);
  });

  it("creates managed parents before children even when records are unordered", async () => {
    const client = new FakeManagedTaskClient({ tasks: [] });

    await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      records: [
        {
          id: "child",
          taskKey: "program:test:child",
          parentTaskId: "root",
          title: "Child task",
          description: "Managed child description.",
        },
        activeRecord,
      ],
    });

    expect(client.tasks.map((task) => task.id)).toEqual(["root", "child"]);
    expect(client.tasks.find((task) => task.id === "child")).toMatchObject({
      parentTaskId: "root",
    });
  });

  it("retires active endpoints for already-retired managed tasks", async () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({
          deletedAt: new Date("2026-05-01T00:00:00.000Z"),
          id: "retired",
          taskKey: "program:test:retired",
        }),
      ],
      endpoints: [
        {
          deletedAt: null,
          email: null,
          id: "endpoint-retired",
          instructions: null,
          isPrimary: true,
          kind: TaskCommunicationEndpointKind.ACTION_LINK,
          label: "Old retired endpoint",
          priority: 0,
          sourceUrl: null,
          taskId: "retired",
          url: "/old-retired-task",
          verificationStatus:
            TaskCommunicationEndpointVerificationStatus.UNVERIFIED,
        },
      ],
    });

    const result = await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      now,
      records: [
        {
          id: "retired",
          taskKey: "program:test:retired",
          parentTaskId: null,
          title: "Retired",
          description: "Retired row.",
          retired: true,
        },
      ],
    });

    expect(result.unchanged).toEqual(["retired (program:test:retired)"]);
    expect(result.endpointRetired).toEqual(["retired (program:test:retired)"]);
    expect(client.endpoints[0]).toMatchObject({
      deletedAt: now,
      isPrimary: false,
    });
  });
});
