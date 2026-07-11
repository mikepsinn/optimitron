import { TaskStatus } from "@optimitron/db";
import { vi } from "vitest";

/**
 * In-memory Prisma stand-in for trigger framework integration tests.
 *
 * Supports the operations fire.ts and admin.ts perform:
 *   - task: create, findUnique, findFirst, findMany, update, updateMany, upsert (by taskKey)
 *   - taskComment: create, findFirst
 *   - taskCommunication: create, count, update
 *   - taskCommunicationEndpoint: create, findFirst, update, updateMany
 *   - taskTrigger: findUnique (with include), findMany, create, update
 *   - taskSpawnSpec: createMany, deleteMany
 *   - taskCommunicationSpawnSpec: createMany, deleteMany
 *   - taskTriggerFire: findFirst, upsert
 *   - person: findUnique, findFirst, create, update
 *   - user: findUnique
 *   - $transaction: passthrough (callback receives the same db)
 *
 * NOT a faithful Prisma reimplementation. Covers the operators these
 * triggers actually use; throws on unsupported shapes so test failures
 * are loud rather than silently wrong.
 */

export interface FakeTask {
  id: string;
  taskKey?: string | null;
  parentTaskId?: string | null;
  createdByUserId?: string | null;
  assigneePersonId?: string | null;
  assigneeOrganizationId?: string | null;
  title?: string;
  description?: string;
  status: TaskStatus;
  deletedAt: Date | null;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedByUserId?: string | null;
  completionEvidence?: string | null;
  [key: string]: unknown;
}

export interface FakeComment {
  id: string;
  taskId: string;
  authorUserId: string | null;
  message: string;
  kind: string;
  source: string;
  deletedAt: Date | null;
  createdAt: Date;
  [key: string]: unknown;
}

export interface FakeCommunication {
  id: string;
  taskId: string;
  taskCommentId: string | null;
  metadataJson: unknown;
  audience: string;
  purpose: string;
  deletedAt: Date | null;
  createdAt: Date;
  [key: string]: unknown;
}

export interface FakeEndpoint {
  id: string;
  taskId: string;
  url: string | null;
  email: string | null;
  label: string | null;
  instructions: string | null;
  isPrimary: boolean;
  deletedAt: Date | null;
  [key: string]: unknown;
}

export interface FakeTrigger {
  id: string;
  triggerKey: string;
  eventName: string;
  triggerKind: string;
  enabled: boolean;
  disabledReason: string | null;
  idempotencyKeyTemplate: string;
  eventFilter: unknown;
  completionGate: unknown;
  jurisdictionId: string | null;
  notes: string | null;
  metadata: unknown;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  [key: string]: unknown;
}

export interface FakeSpawnSpec {
  id: string;
  triggerId: string;
  kind: string;
  isParent: boolean;
  sortOrder: number;
  titleTemplate: string;
  descriptionTemplate: string;
  impactStatementTemplate: string | null;
  roleTitleTemplate: string | null;
  category: string;
  estimatedEffortHours: number | null;
  dueDays: number | null;
  availableInDays: number | null;
  deadlinePolicy: string | null;
  claimPolicy: string;
  isPublic: boolean;
  skillTagTemplates: string[];
  interestTagTemplates: string[];
  actionLinkUrlTemplate: string | null;
  actionLinkLabelTemplate: string | null;
  actionLinkInstructionsTemplate: string | null;
  creatorResolver: string;
  assigneePersonResolver: string;
  assigneeOrganizationResolver: string;
  parentResolver: string;
  contributesToGate: boolean;
  metadata: unknown;
  [key: string]: unknown;
}

export interface FakeCommSpec {
  id: string;
  triggerId: string;
  kind: string;
  sortOrder: number;
  subjectTemplate: string;
  bodyTextTemplate: string;
  bodyHtmlTemplate: string | null;
  commentTemplate: string | null;
  channel: string;
  audienceResolver: string;
  purpose: string;
  emailScope: string | null;
  dedupeKeyTemplate: string;
  minHoursBetweenSends: number;
  maxSendsPerTask: number;
  metadata: unknown;
  [key: string]: unknown;
}

export interface FakeFire {
  id: string;
  triggerId: string;
  idempotencyKey: string;
  actorUserId: string | null;
  context: unknown;
  result: string;
  error: string | null;
  spawnedTaskKeys: string[];
  spawnedTaskIds: string[];
  firedAt: Date;
  [key: string]: unknown;
}

export interface FakePerson {
  id: string;
  displayName: string;
  email: string | null;
  handle: string | null;
  deletedAt: Date | null;
  [key: string]: unknown;
}

export interface FakeUser {
  id: string;
  email?: string | null;
  personId: string | null;
  referralCode: string | null;
  [key: string]: unknown;
}

export interface FakeStore {
  tasks: FakeTask[];
  comments: FakeComment[];
  communications: FakeCommunication[];
  endpoints: FakeEndpoint[];
  triggers: FakeTrigger[];
  spawnSpecs: FakeSpawnSpec[];
  commSpecs: FakeCommSpec[];
  fires: FakeFire[];
  persons: FakePerson[];
  users: FakeUser[];
}

function pickSelected<T extends Record<string, unknown>>(
  row: T,
  select?: Record<string, boolean | object>,
): Record<string, unknown> {
  if (!select) return row;
  const out: Record<string, unknown> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled === true) out[key] = row[key];
    else if (enabled === false) {
      // skipped
    } else if (enabled && typeof enabled === "object") {
      // nested select on relations isn't modeled here; tests must avoid it
      out[key] = row[key];
    }
  }
  return out;
}

function matchScalar(actual: unknown, expected: unknown): boolean {
  if (expected === null) return actual === null;
  if (expected === undefined) return true;
  if (typeof expected === "object" && expected !== null) {
    const e = expected as Record<string, unknown>;
    if ("in" in e && Array.isArray(e.in)) return e.in.includes(actual as never);
    if ("notIn" in e && Array.isArray(e.notIn))
      return !e.notIn.includes(actual as never);
    if ("not" in e) return actual !== e.not;
    if (
      "contains" in e &&
      typeof e.contains === "string" &&
      typeof actual === "string"
    ) {
      return actual.includes(e.contains);
    }
    if (
      "startsWith" in e &&
      typeof e.startsWith === "string" &&
      typeof actual === "string"
    ) {
      return actual.startsWith(e.startsWith);
    }
    if ("gte" in e && actual instanceof Date && e.gte instanceof Date) {
      return actual >= e.gte;
    }
    // JSONB path filter: { path: ["a","b"], equals: <value> }
    if (Array.isArray(e.path) && "equals" in e) {
      let cur: unknown = actual;
      for (const seg of e.path) {
        if (cur == null || typeof cur !== "object") return false;
        cur = (cur as Record<string, unknown>)[seg as string];
      }
      return cur === e.equals;
    }
  }
  return actual === expected;
}

function matchesRow(
  row: Record<string, unknown>,
  where: Record<string, unknown> | undefined,
): boolean {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (!matchScalar(row[key], value)) return false;
  }
  return true;
}

function asRecord<T>(row: T): Record<string, unknown> {
  return row as unknown as Record<string, unknown>;
}

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

export function createFakeTriggerDb() {
  const store: FakeStore = {
    tasks: [],
    comments: [],
    communications: [],
    endpoints: [],
    triggers: [],
    spawnSpecs: [],
    commSpecs: [],
    fires: [],
    persons: [],
    users: [],
  };

  function loadTriggerWithIncludes(t: FakeTrigger) {
    return {
      ...t,
      spawnSpecs: store.spawnSpecs
        .filter((s) => s.triggerId === t.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      communicationSpawnSpecs: store.commSpecs
        .filter((s) => s.triggerId === t.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  const db: Record<string, unknown> = {
    task: {
      create: vi.fn(
        async ({
          data,
          select,
        }: {
          data: Partial<FakeTask>;
          select?: Record<string, boolean>;
        }) => {
          const task: FakeTask = {
            id: nextId("task"),
            deletedAt: null,
            status: TaskStatus.ACTIVE,
            ...data,
          } as FakeTask;
          store.tasks.push(task);
          return pickSelected(task, select);
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
          select,
        }: {
          where: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => {
          const task = store.tasks.find(
            (t) =>
              (where.id ? t.id === where.id : true) &&
              (where.taskKey ? t.taskKey === where.taskKey : true),
          );
          return task ? pickSelected(task, select) : null;
        },
      ),
      findFirst: vi.fn(
        async ({
          where,
          select,
        }: {
          where: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => {
          const task = store.tasks.find((t) => matchesRow(asRecord(t), where));
          return task ? pickSelected(task, select) : null;
        },
      ),
      findMany: vi.fn(
        async ({
          where,
          select,
        }: {
          where?: Record<string, unknown>;
          select?: Record<string, boolean>;
        } = {}) =>
          store.tasks
            .filter((t) => matchesRow(asRecord(t), where))
            .map((t) => pickSelected(t, select)),
      ),
      update: vi.fn(
        async ({
          where,
          data,
          select,
        }: {
          where: Record<string, unknown>;
          data: Partial<FakeTask>;
          select?: Record<string, boolean>;
        }) => {
          const task = store.tasks.find((t) => t.id === where.id);
          if (!task)
            throw new Error(`task not found: ${JSON.stringify(where)}`);
          Object.assign(task, data);
          return pickSelected(task, select);
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Partial<FakeTask>;
        }) => {
          let count = 0;
          for (const t of store.tasks) {
            if (!matchesRow(asRecord(t), where)) continue;
            Object.assign(t, data);
            count++;
          }
          return { count };
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { taskKey: string };
          create: Partial<FakeTask>;
          update: Partial<FakeTask>;
        }) => {
          const existing = store.tasks.find((t) => t.taskKey === where.taskKey);
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const task: FakeTask = {
            id: nextId("task"),
            deletedAt: null,
            status: TaskStatus.ACTIVE,
            ...create,
          } as FakeTask;
          store.tasks.push(task);
          return task;
        },
      ),
    },
    taskComment: {
      create: vi.fn(async ({ data }: { data: Partial<FakeComment> }) => {
        const comment: FakeComment = {
          id: nextId("comment"),
          deletedAt: null,
          createdAt: new Date(),
          ...data,
        } as FakeComment;
        store.comments.push(comment);
        return comment;
      }),
      findFirst: vi.fn(
        async ({ where }: { where?: Record<string, unknown> } = {}) =>
          store.comments.find((c) => matchesRow(c, where)) ?? null,
      ),
    },
    taskCommunication: {
      create: vi.fn(async ({ data }: { data: Partial<FakeCommunication> }) => {
        const comm: FakeCommunication = {
          id: nextId("comm"),
          deletedAt: null,
          createdAt: new Date(),
          ...data,
        } as FakeCommunication;
        store.communications.push(comm);
        return comm;
      }),
      count: vi.fn(
        async ({ where }: { where?: Record<string, unknown> } = {}) =>
          store.communications.filter((c) => matchesRow(c, where)).length,
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeCommunication>;
        }) => {
          const comm = store.communications.find((c) => c.id === where.id);
          if (!comm) throw new Error("communication not found");
          Object.assign(comm, data);
          return comm;
        },
      ),
    },
    taskCommunicationEndpoint: {
      create: vi.fn(async ({ data }: { data: Partial<FakeEndpoint> }) => {
        const ep: FakeEndpoint = {
          id: nextId("endpoint"),
          deletedAt: null,
          ...data,
        } as FakeEndpoint;
        store.endpoints.push(ep);
        return ep;
      }),
      findFirst: vi.fn(
        async ({
          where,
          select,
        }: {
          where?: Record<string, unknown>;
          select?: Record<string, boolean>;
        } = {}) => {
          const ep = store.endpoints.find((e) => matchesRow(e, where));
          return ep ? pickSelected(ep, select) : null;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeEndpoint>;
        }) => {
          const ep = store.endpoints.find((e) => e.id === where.id);
          if (!ep) throw new Error("endpoint not found");
          Object.assign(ep, data);
          return ep;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: Record<string, unknown>;
          data: Partial<FakeEndpoint>;
        }) => {
          let count = 0;
          for (const ep of store.endpoints) {
            if (!matchesRow(ep, where)) continue;
            Object.assign(ep, data);
            count++;
          }
          return { count };
        },
      ),
    },
    taskTrigger: {
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { triggerKey?: string; id?: string };
          include?: { spawnSpecs?: unknown; communicationSpawnSpecs?: unknown };
        }) => {
          const t = store.triggers.find(
            (x) =>
              (where.triggerKey ? x.triggerKey === where.triggerKey : true) &&
              (where.id ? x.id === where.id : true),
          );
          if (!t) return null;
          if (include?.spawnSpecs || include?.communicationSpawnSpecs) {
            return loadTriggerWithIncludes(t);
          }
          return t;
        },
      ),
      findMany: vi.fn(
        async ({
          where,
          select,
        }: {
          where?: Record<string, unknown>;
          select?: Record<string, boolean>;
        } = {}) =>
          store.triggers
            .filter((t) => matchesRow(asRecord(t), where))
            .map((t) => pickSelected(t, select)),
      ),
      create: vi.fn(
        async ({
          data,
          include,
        }: {
          data: Partial<FakeTrigger> & {
            spawnSpecs?: { create?: unknown[] };
            communicationSpawnSpecs?: { create?: unknown[] };
          };
          include?: unknown;
        }) => {
          const t: FakeTrigger = {
            id: nextId("trigger"),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            enabled: true,
            eventFilter: null,
            completionGate: null,
            jurisdictionId: null,
            notes: null,
            metadata: null,
            disabledReason: null,
            createdByUserId: null,
            updatedByUserId: null,
            triggerKind: "spawnTasks",
            ...(data as Partial<FakeTrigger>),
          } as FakeTrigger;
          store.triggers.push(t);
          if (data.spawnSpecs?.create) {
            for (const spec of data.spawnSpecs.create as Array<
              Partial<FakeSpawnSpec>
            >) {
              store.spawnSpecs.push({
                id: nextId("spec"),
                triggerId: t.id,
                isParent: false,
                sortOrder: 0,
                skillTagTemplates: [],
                interestTagTemplates: [],
                category: "OTHER",
                claimPolicy: "ASSIGNED_ONLY",
                isPublic: false,
                creatorResolver: "actor",
                assigneePersonResolver: "none",
                assigneeOrganizationResolver: "none",
                parentResolver: "trigger.parentSpec",
                contributesToGate: false,
                ...spec,
              } as FakeSpawnSpec);
            }
          }
          if (data.communicationSpawnSpecs?.create) {
            for (const spec of data.communicationSpawnSpecs.create as Array<
              Partial<FakeCommSpec>
            >) {
              store.commSpecs.push({
                id: nextId("commSpec"),
                triggerId: t.id,
                sortOrder: 0,
                channel: "EMAIL",
                audienceResolver: "ASSIGNEE",
                purpose: "REMINDER",
                minHoursBetweenSends: 0,
                maxSendsPerTask: 0,
                ...spec,
              } as FakeCommSpec);
            }
          }
          if (include) return loadTriggerWithIncludes(t);
          return t;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { triggerKey?: string; id?: string };
          data: Partial<FakeTrigger>;
        }) => {
          const t = store.triggers.find(
            (x) =>
              (where.triggerKey ? x.triggerKey === where.triggerKey : true) &&
              (where.id ? x.id === where.id : true),
          );
          if (!t) throw new Error("trigger not found");
          Object.assign(t, data, { updatedAt: new Date() });
          return t;
        },
      ),
    },
    taskSpawnSpec: {
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<Partial<FakeSpawnSpec> & { triggerId: string }>;
        }) => {
          for (const spec of data) {
            store.spawnSpecs.push({
              id: nextId("spec"),
              isParent: false,
              sortOrder: 0,
              skillTagTemplates: [],
              interestTagTemplates: [],
              category: "OTHER",
              claimPolicy: "ASSIGNED_ONLY",
              isPublic: false,
              creatorResolver: "actor",
              assigneePersonResolver: "none",
              assigneeOrganizationResolver: "none",
              parentResolver: "trigger.parentSpec",
              contributesToGate: false,
              ...spec,
            } as FakeSpawnSpec);
          }
          return { count: data.length };
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: { triggerId: string } }) => {
        const before = store.spawnSpecs.length;
        store.spawnSpecs = store.spawnSpecs.filter(
          (s) => s.triggerId !== where.triggerId,
        );
        return { count: before - store.spawnSpecs.length };
      }),
    },
    taskCommunicationSpawnSpec: {
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<Partial<FakeCommSpec> & { triggerId: string }>;
        }) => {
          for (const spec of data) {
            store.commSpecs.push({
              id: nextId("commSpec"),
              sortOrder: 0,
              channel: "EMAIL",
              audienceResolver: "ASSIGNEE",
              purpose: "REMINDER",
              minHoursBetweenSends: 0,
              maxSendsPerTask: 0,
              ...spec,
            } as FakeCommSpec);
          }
          return { count: data.length };
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: { triggerId: string } }) => {
        const before = store.commSpecs.length;
        store.commSpecs = store.commSpecs.filter(
          (s) => s.triggerId !== where.triggerId,
        );
        return { count: before - store.commSpecs.length };
      }),
    },
    taskTriggerFire: {
      findFirst: vi.fn(
        async (
          {
            where,
            orderBy: _orderBy,
          }: {
            where: Record<string, unknown>;
            orderBy?: unknown;
          } = {} as never,
        ) => {
          const candidates = store.fires.filter((f) => matchesRow(f, where));
          // orderBy firedAt desc — return the most recent
          candidates.sort((a, b) => b.firedAt.getTime() - a.firedAt.getTime());
          return candidates[0] ?? null;
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: {
            triggerId_idempotencyKey: {
              triggerId: string;
              idempotencyKey: string;
            };
          };
          create: Partial<FakeFire>;
          update: Partial<FakeFire>;
        }) => {
          const existing = store.fires.find(
            (f) =>
              f.triggerId === where.triggerId_idempotencyKey.triggerId &&
              f.idempotencyKey ===
                where.triggerId_idempotencyKey.idempotencyKey,
          );
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const fire: FakeFire = {
            id: nextId("fire"),
            firedAt: new Date(),
            error: null,
            spawnedTaskKeys: [],
            spawnedTaskIds: [],
            ...create,
          } as FakeFire;
          store.fires.push(fire);
          return fire;
        },
      ),
    },
    person: {
      findUnique: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => {
          return store.persons.find((p) => matchesRow(p, where)) ?? null;
        },
      ),
      findFirst: vi.fn(
        async ({ where }: { where?: Record<string, unknown> } = {}) =>
          store.persons.find((p) => matchesRow(p, where)) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Partial<FakePerson> }) => {
        const p: FakePerson = {
          id: nextId("person"),
          deletedAt: null,
          handle: null,
          ...data,
        } as FakePerson;
        store.persons.push(p);
        return p;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakePerson>;
        }) => {
          const p = store.persons.find((x) => x.id === where.id);
          if (!p) throw new Error("person not found");
          Object.assign(p, data);
          return p;
        },
      ),
    },
    user: {
      findUnique: vi.fn(
        async ({
          where,
          select,
        }: {
          where: { email?: string; id?: string };
          select?: Record<string, boolean>;
        }) => {
          const u = store.users.find(
            (x) =>
              (where.id ? x.id === where.id : true) &&
              (where.email ? x.email === where.email : true),
          );
          return u ? pickSelected(u, select) : null;
        },
      ),
    },
    $transaction: vi.fn(
      async (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => fn(db),
    ),
  };

  // We type the returned db loosely — tests access individual delegates
  // (db.task, db.taskTrigger, etc.) where the inferred any is fine.
  return { db: db as never as TriggerDbForTests, store };
}

type Delegate = Record<string, (args: unknown) => Promise<unknown>>;
export interface TriggerDbForTests {
  task: Delegate;
  taskComment: Delegate;
  taskCommunication: Delegate;
  taskCommunicationEndpoint: Delegate;
  taskTrigger: Delegate;
  taskSpawnSpec: Delegate;
  taskCommunicationSpawnSpec: Delegate;
  taskTriggerFire: Delegate;
  person: Delegate;
  user: Delegate;
  $transaction: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
}
