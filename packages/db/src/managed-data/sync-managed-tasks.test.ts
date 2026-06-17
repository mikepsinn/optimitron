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
  OPTIMIZE_EARTH_ROOT_TASK_ID,
  OPTIMIZE_EARTH_ROOT_TASK_KEY,
} from "../task-keys.js";
import {
  syncManagedTasks,
  type ManagedTaskClient,
  type ManagedTaskRecord,
} from "./sync-managed-tasks.js";

type FakeTask = {
  id: string;
  taskKey: string | null;
  currentImpactEstimateSetId?: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  impactStatement: string | null;
  ownerOrganizationId: string | null;
  compensationKind: string;
  compensationCadence: string | null;
  compensationCurrency: string | null;
  compensationMinAmountMinorUnits: bigint | null;
  compensationMaxAmountMinorUnits: bigint | null;
  compensationPaymentRails: string[];
  estimatedHoursPerWeekMin: number | null;
  estimatedHoursPerWeekMax: number | null;
  remotePolicy: string;
  locationText: string | null;
  workLocationCountryCode: string | null;
  workLocationRegionCode: string | null;
  workLocationCity: string | null;
  workLocationPostalCode: string | null;
  workLocationLatitude: number | null;
  workLocationLongitude: number | null;
  workLocationRadiusKm: number | null;
  workTimeZone: string | null;
  applicationQuestionsJson: unknown;
  executionMode: string;
  category: typeof TaskCategory[keyof typeof TaskCategory];
  difficulty: typeof TaskDifficulty[keyof typeof TaskDifficulty];
  estimatedEffortHours: number | null;
  skillTags: string[];
  preferredSkillTags: string[];
  interestTags: string[];
  requiredCredentialTags: string[];
  preferredCredentialTags: string[];
  requiredLanguageTags: string[];
  preferredLanguageTags: string[];
  requiredToolTags: string[];
  preferredToolTags: string[];
  requiredAccessTags: string[];
  preferredAccessTags: string[];
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

type FakeImpactEstimateSet = {
  id: string;
  assumptionsJson?: unknown;
  calculationVersion: string;
  counterfactualKey: string;
  deletedAt: Date | null;
  estimateKind: string;
  isCurrent: boolean;
  methodologyKey: string;
  parameterSetHash: string;
  publicationStatus: string;
  sourceSystem: string;
  taskId: string;
};

type FakeImpactFrameEstimate = {
  id: string;
  adoptionRampYears: number;
  annualDiscountRate: number;
  benefitDurationYears: number;
  deletedAt: Date | null;
  estimatedEffortHoursBase: number | null;
  evaluationHorizonYears: number;
  expectedEconomicValueUsdBase: number | null;
  frameKey: string;
  frameSlug: string;
  successProbabilityBase: number | null;
  taskImpactEstimateSetId: string;
  timeToImpactStartDays: number;
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
    ownerOrganizationId: null,
    compensationKind: "UNSPECIFIED",
    compensationCadence: null,
    compensationCurrency: null,
    compensationMinAmountMinorUnits: null,
    compensationMaxAmountMinorUnits: null,
    compensationPaymentRails: [],
    estimatedHoursPerWeekMin: null,
    estimatedHoursPerWeekMax: null,
    remotePolicy: "UNSPECIFIED",
    locationText: null,
    workLocationCountryCode: null,
    workLocationRegionCode: null,
    workLocationCity: null,
    workLocationPostalCode: null,
    workLocationLatitude: null,
    workLocationLongitude: null,
    workLocationRadiusKm: null,
    workTimeZone: null,
    applicationQuestionsJson: null,
    executionMode: "HUMAN_OR_AGENT",
    category: TaskCategory.OTHER,
    difficulty: TaskDifficulty.INTERMEDIATE,
    estimatedEffortHours: null,
    skillTags: [],
    preferredSkillTags: [],
    interestTags: [],
    requiredCredentialTags: [],
    preferredCredentialTags: [],
    requiredLanguageTags: [],
    preferredLanguageTags: [],
    requiredToolTags: [],
    preferredToolTags: [],
    requiredAccessTags: [],
    preferredAccessTags: [],
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

const fakeTaskScalarFields = new Set<keyof FakeTask>([
  "availableAt",
  "category",
  "claimPolicy",
  "applicationQuestionsJson",
  "compensationCadence",
  "compensationCurrency",
  "compensationKind",
  "compensationMaxAmountMinorUnits",
  "compensationMinAmountMinorUnits",
  "compensationPaymentRails",
  "contextJson",
  "createdByUserId",
  "currentImpactEstimateSetId",
  "deadlinePolicy",
  "deletedAt",
  "description",
  "difficulty",
  "dueAt",
  "estimatedEffortHours",
  "estimatedHoursPerWeekMax",
  "estimatedHoursPerWeekMin",
  "executionMode",
  "id",
  "impactStatement",
  "interestTags",
  "isPublic",
  "locationText",
  "maxClaims",
  "ownerOrganizationId",
  "parentTaskId",
  "preferredAccessTags",
  "preferredCredentialTags",
  "preferredLanguageTags",
  "preferredSkillTags",
  "preferredToolTags",
  "remotePolicy",
  "requiredAccessTags",
  "requiredCredentialTags",
  "requiredLanguageTags",
  "requiredToolTags",
  "skillTags",
  "sortOrder",
  "status",
  "taskKey",
  "title",
  "workLocationCity",
  "workLocationCountryCode",
  "workLocationLatitude",
  "workLocationLongitude",
  "workLocationPostalCode",
  "workLocationRadiusKm",
  "workLocationRegionCode",
  "workTimeZone",
]);

function assertValidTaskSelect(select: Record<string, unknown> | undefined) {
  if (!select) return;

  for (const key of Object.keys(select)) {
    if (!fakeTaskScalarFields.has(key as keyof FakeTask)) {
      throw new Error(`Unknown Task select field in fake client: ${key}`);
    }
  }
}

class FakeManagedTaskClient implements ManagedTaskClient {
  tasks: FakeTask[];
  endpoints: FakeEndpoint[];
  impactEstimateSets: FakeImpactEstimateSet[];
  impactFrameEstimates: FakeImpactFrameEstimate[];

  constructor(input: {
    endpoints?: FakeEndpoint[];
    impactEstimateSets?: FakeImpactEstimateSet[];
    impactFrameEstimates?: FakeImpactFrameEstimate[];
    tasks?: FakeTask[];
  }) {
    this.tasks = input.tasks ?? [];
    this.endpoints = input.endpoints ?? [];
    this.impactEstimateSets = input.impactEstimateSets ?? [];
    this.impactFrameEstimates = input.impactFrameEstimates ?? [];
  }

  task = {
    findMany: async (args: unknown) => {
      const { select, where } = args as {
        select?: Record<string, unknown>;
        where?: { OR?: Array<Record<string, unknown>> };
      };
      assertValidTaskSelect(select);
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
    update: async (args: unknown) => {
      const { where, data } = args as {
        where: { id: string };
        data: Partial<FakeTask>;
      };
      const task = this.tasks.find((candidate) => candidate.id === where.id);
      if (!task) throw new Error(`Missing task ${where.id}`);
      Object.assign(task, data);
      return task;
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

  taskImpactEstimateSet = {
    updateMany: async (args: unknown) => {
      const { where, data } = args as {
        where: {
          deletedAt?: null;
          isCurrent?: boolean;
          NOT?: { id: string };
          taskId: string;
        };
        data: Partial<FakeImpactEstimateSet>;
      };
      let count = 0;
      for (const estimateSet of this.impactEstimateSets) {
        const matches =
          estimateSet.taskId === where.taskId &&
          (!("deletedAt" in where) || estimateSet.deletedAt === where.deletedAt) &&
          (!("isCurrent" in where) || estimateSet.isCurrent === where.isCurrent) &&
          (!where.NOT || estimateSet.id !== where.NOT.id);
        if (matches) {
          Object.assign(estimateSet, data);
          count += 1;
        }
      }
      return { count };
    },
    upsert: async (args: unknown) => {
      const { where, create, update } = args as {
        where: {
          taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey: {
            calculationVersion: string;
            counterfactualKey: string;
            estimateKind: string;
            methodologyKey: string;
            parameterSetHash: string;
            sourceSystem: string;
            taskId: string;
          };
        };
        create: Omit<FakeImpactEstimateSet, "id" | "deletedAt"> & {
          deletedAt?: Date | null;
        };
        update: Partial<FakeImpactEstimateSet>;
      };
      const key =
        where.taskId_estimateKind_sourceSystem_calculationVersion_methodologyKey_parameterSetHash_counterfactualKey;
      let estimateSet = this.impactEstimateSets.find(
        (candidate) =>
          candidate.taskId === key.taskId &&
          candidate.estimateKind === key.estimateKind &&
          candidate.sourceSystem === key.sourceSystem &&
          candidate.calculationVersion === key.calculationVersion &&
          candidate.methodologyKey === key.methodologyKey &&
          candidate.parameterSetHash === key.parameterSetHash &&
          candidate.counterfactualKey === key.counterfactualKey,
      );
      if (!estimateSet) {
        estimateSet = {
          id: `estimate-set-${this.impactEstimateSets.length + 1}`,
          deletedAt: null,
          ...create,
        };
        this.impactEstimateSets.push(estimateSet);
      } else {
        Object.assign(estimateSet, update);
      }
      return { id: estimateSet.id };
    },
  };

  taskImpactFrameEstimate = {
    upsert: async (args: unknown) => {
      const { where, create, update } = args as {
        where: {
          taskImpactEstimateSetId_frameSlug: {
            frameSlug: string;
            taskImpactEstimateSetId: string;
          };
        };
        create: Omit<FakeImpactFrameEstimate, "id" | "deletedAt"> & {
          deletedAt?: Date | null;
        };
        update: Partial<FakeImpactFrameEstimate>;
      };
      const key = where.taskImpactEstimateSetId_frameSlug;
      let frame = this.impactFrameEstimates.find(
        (candidate) =>
          candidate.taskImpactEstimateSetId === key.taskImpactEstimateSetId &&
          candidate.frameSlug === key.frameSlug,
      );
      if (!frame) {
        frame = {
          id: `impact-frame-${this.impactFrameEstimates.length + 1}`,
          deletedAt: null,
          ...create,
        };
        this.impactFrameEstimates.push(frame);
      } else {
        Object.assign(frame, update);
      }
      return { id: frame.id };
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
  id: OPTIMIZE_EARTH_ROOT_TASK_ID,
  taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
  parentTaskId: null,
  title: "Root task",
  description: "Managed root description.",
  category: TaskCategory.GOVERNANCE,
  claimPolicy: TaskClaimPolicy.OPEN_MANY,
  difficulty: TaskDifficulty.INTERMEDIATE,
  ownerOrganizationId: "org-managed-owner",
  compensationKind: "PAID",
  compensationCadence: "ANNUAL",
  compensationCurrency: "usd",
  compensationMinAmountMinorUnits: 70_000_00n,
  compensationMaxAmountMinorUnits: 90_000_00n,
  compensationPaymentRails: ["stripe", "ach"],
  estimatedHoursPerWeekMin: 35,
  estimatedHoursPerWeekMax: 45,
  remotePolicy: "REMOTE",
  locationText: "Remote",
  workLocationCountryCode: "US",
  workLocationRegionCode: "IL",
  workLocationCity: "Edwardsville",
  workLocationRadiusKm: 40,
  workTimeZone: "America/Chicago",
  applicationQuestionsJson: [{ id: "why", prompt: "Why this job?" }],
  executionMode: "HUMAN_ONLY",
  preferredSkillTags: ["nonprofit-outreach"],
  requiredCredentialTags: ["campaign-management"],
  preferredCredentialTags: ["coalition-building"],
  requiredLanguageTags: ["en"],
  preferredLanguageTags: ["es"],
  requiredToolTags: ["crm"],
  preferredToolTags: ["spreadsheet"],
  requiredAccessTags: ["st-louis"],
  preferredAccessTags: ["disease-nonprofits"],
  sortOrder: -100,
  primaryEndpoint: {
    label: "Open root task",
    url: "/tasks/optimize-earth",
  },
};
const activeRecordLabel = `${OPTIMIZE_EARTH_ROOT_TASK_ID} (${OPTIMIZE_EARTH_ROOT_TASK_KEY})`;

describe("syncManagedTasks", () => {
  it("reports dry-run creates, updates, and retires without writing", async () => {
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({
          id: OPTIMIZE_EARTH_ROOT_TASK_ID,
          taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
          title: "Stale root",
        }),
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
          parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
          title: "New child",
          description: "New child description.",
        },
      ],
    });

    expect(result.updated).toContain(activeRecordLabel);
    expect(result.created).toContain("new-child (program:test:new-child)");
    expect(result.retired).toContain("retired (program:test:retired)");
    expect(result.endpointRetired).toContain("retired (program:test:retired)");
    expect(
      client.tasks.find((task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID)?.title,
    ).toBe("Stale root");
    expect(client.tasks.find((task) => task.id === "retired")?.deletedAt).toBeNull();
    expect(client.tasks.find((task) => task.id === "user-task")?.title).toBe(
      "Do not touch",
    );
  });

  it("upserts managed fields, endpoints, and explicit retired rows", async () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({
          id: OPTIMIZE_EARTH_ROOT_TASK_ID,
          taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
          title: "Stale root",
        }),
        makeTask({ id: "retired", taskKey: "program:test:retired" }),
        makeTask({ id: "user-task", taskKey: "user:created", title: "Do not touch" }),
      ],
    });
    const records: ManagedTaskRecord[] = [
      activeRecord,
      {
        id: "child",
        taskKey: "program:test:child",
        parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
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

    const root = client.tasks.find(
      (task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID,
    );
    expect(root).toMatchObject({
      title: "Root task",
      description: "Managed root description.",
      createdByUserId: "old-user",
      ownerOrganizationId: "org-managed-owner",
      compensationKind: "PAID",
      compensationCadence: "ANNUAL",
      compensationCurrency: "usd",
      compensationMinAmountMinorUnits: 70_000_00n,
      compensationMaxAmountMinorUnits: 90_000_00n,
      compensationPaymentRails: ["stripe", "ach"],
      estimatedHoursPerWeekMin: 35,
      estimatedHoursPerWeekMax: 45,
      remotePolicy: "REMOTE",
      locationText: "Remote",
      workLocationCountryCode: "US",
      workLocationRegionCode: "IL",
      workLocationCity: "Edwardsville",
      workLocationRadiusKm: 40,
      workTimeZone: "America/Chicago",
      applicationQuestionsJson: [{ id: "why", prompt: "Why this job?" }],
      executionMode: "HUMAN_ONLY",
      preferredSkillTags: ["nonprofit-outreach"],
      requiredCredentialTags: ["campaign-management"],
      preferredCredentialTags: ["coalition-building"],
      requiredLanguageTags: ["en"],
      preferredLanguageTags: ["es"],
      requiredToolTags: ["crm"],
      preferredToolTags: ["spreadsheet"],
      requiredAccessTags: ["st-louis"],
      preferredAccessTags: ["disease-nonprofits"],
      sortOrder: -100,
    });
    expect(root?.contextJson).toMatchObject({
      managedData: {
        collectionKey: "test-tree",
        recordId: OPTIMIZE_EARTH_ROOT_TASK_ID,
      },
    });

    expect(client.tasks.find((task) => task.id === "child")).toMatchObject({
      parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
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
        activeRecordLabel,
        "child (program:test:child)",
        "retired (program:test:retired)",
      ]),
    );
  });

  it("does not delete a previously managed row just because it is absent from the current source list", async () => {
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({
          id: OPTIMIZE_EARTH_ROOT_TASK_ID,
          taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY,
        }),
        makeTask({
          contextJson: {
            managedData: {
              collectionKey: "test-tree",
              recordId: "previously-managed",
            },
          },
          id: "previously-managed",
          taskKey: "program:test:previously-managed",
          title: "Keep me unless explicitly retired",
        }),
      ],
    });

    const result = await syncManagedTasks(client, {
      apply: true,
      collectionKey: "test-tree",
      createdByUserId: "creator",
      records: [activeRecord],
    });

    expect(result.retired).toEqual([]);
    expect(client.tasks.find((task) => task.id === "previously-managed")).toMatchObject({
      deletedAt: null,
      status: TaskStatus.ACTIVE,
      title: "Keep me unless explicitly retired",
    });
  });

  it("rejects taskKey ownership conflicts before applying writes", async () => {
    const client = new FakeManagedTaskClient({
      tasks: [
        makeTask({
          id: OPTIMIZE_EARTH_ROOT_TASK_ID,
          taskKey: "program:test:old-root",
        }),
        makeTask({ id: "other", taskKey: OPTIMIZE_EARTH_ROOT_TASK_KEY }),
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
      `Managed task key ${OPTIMIZE_EARTH_ROOT_TASK_KEY} already belongs to other`,
    );
    expect(
      client.tasks.find((task) => task.id === OPTIMIZE_EARTH_ROOT_TASK_ID)
        ?.taskKey,
    ).toBe(
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
          parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
          title: "Child task",
          description: "Managed child description.",
        },
        activeRecord,
      ],
    });

    expect(client.tasks.map((task) => task.id)).toEqual([
      OPTIMIZE_EARTH_ROOT_TASK_ID,
      "child",
    ]);
    expect(client.tasks.find((task) => task.id === "child")).toMatchObject({
      parentTaskId: OPTIMIZE_EARTH_ROOT_TASK_ID,
    });
  });

  it("rejects active records that reference missing parents during dry-run", async () => {
    const client = new FakeManagedTaskClient({ tasks: [] });

    await expect(
      syncManagedTasks(client, {
        apply: false,
        collectionKey: "test-tree",
        createdByUserId: "creator",
        records: [
          activeRecord,
          {
            id: "orphan",
            taskKey: "program:test:orphan",
            parentTaskId: "missing-parent",
            title: "Orphan task",
            description: "This task references a parent that does not exist.",
          },
        ],
      }),
    ).rejects.toThrow(
      "Managed task orphan (program:test:orphan) references missing parentTaskId missing-parent",
    );
  });

  it("rejects extra active roots before applying writes", async () => {
    const client = new FakeManagedTaskClient({ tasks: [] });

    await expect(
      syncManagedTasks(client, {
        apply: true,
        collectionKey: "test-tree",
        createdByUserId: "creator",
        records: [
          activeRecord,
          {
            id: "extra-root",
            taskKey: "program:test:extra-root",
            parentTaskId: null,
            title: "Extra root",
            description: "This would create a second root.",
          },
        ],
      }),
    ).rejects.toThrow("Managed task tree must have exactly one active root");
    expect(client.tasks).toEqual([]);
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
