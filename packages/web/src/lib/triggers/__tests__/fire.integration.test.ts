import { TaskStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted; use vi.hoisted so the harness is constructed before
// the prisma mock factory runs.
const harness = vi.hoisted(async () => {
  const { createFakeTriggerDb } = await import("./fake-prisma");
  return createFakeTriggerDb();
});

vi.mock("@/lib/prisma", async () => ({
  prisma: (await harness).db,
}));

import { fireTaskTrigger, fireTaskTriggersForEvent } from "../fire";
import { createTaskTrigger } from "../admin";

// Resolved synchronously inside tests by awaiting `harness` once.
let store: Awaited<typeof harness>["store"];
let db: Awaited<typeof harness>["db"];

async function reset() {
  if (!store) {
    const h = await harness;
    store = h.store;
    db = h.db;
  }
  store.tasks.length = 0;
  store.comments.length = 0;
  store.communications.length = 0;
  store.endpoints.length = 0;
  store.triggers.length = 0;
  store.spawnSpecs.length = 0;
  store.commSpecs.length = 0;
  store.fires.length = 0;
  store.persons.length = 0;
  store.users.length = 0;
}

describe("triggers/fire integration", () => {
  beforeEach(reset);

  describe("spawnTasks", () => {
    it("creates parent + children with rendered templates", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:onboarding",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "demo:user:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "Hello {{user.name}}",
              descriptionTemplate: "root for {{user.id}}",
              ownerResolver: "actor",
              parentResolver: "none",
            },
            {
              kind: "step1",
              sortOrder: 0,
              titleTemplate: "Step 1",
              descriptionTemplate: "First task",
              ownerResolver: "actor",
              parentResolver: "trigger.parentSpec",
            },
            {
              kind: "step2",
              sortOrder: 1,
              titleTemplate: "Step 2",
              descriptionTemplate: "Second task",
              ownerResolver: "actor",
              parentResolver: "trigger.parentSpec",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const result = await fireTaskTrigger(
        "demo:onboarding",
        { user: { id: "u_42", name: "Mike" } },
        { actorUserId: "u_42" },
      );

      expect(result.result).toBe("spawned");
      expect(result.spawnedTaskKeys).toEqual([
        "demo:user:u_42",
        "demo:user:u_42:step1",
        "demo:user:u_42:step2",
      ]);

      const root = store.tasks.find((t) => t.taskKey === "demo:user:u_42");
      expect(root).toBeTruthy();
      expect(root?.title).toBe("Hello Mike");
      expect(root?.parentTaskId ?? null).toBeNull();
      expect(root?.ownerUserId).toBe("u_42");

      const step1 = store.tasks.find((t) => t.taskKey === "demo:user:u_42:step1");
      expect(step1?.parentTaskId).toBe(root?.id);

      const step2 = store.tasks.find((t) => t.taskKey === "demo:user:u_42:step2");
      expect(step2?.parentTaskId).toBe(root?.id);

      // Fire log written
      expect(store.fires).toHaveLength(1);
      expect(store.fires[0]?.result).toBe("spawned");
    });

    it("re-firing with same context is idempotent (Task upsert by taskKey)", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:onboarding2",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "demo2:user:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "Original title",
              descriptionTemplate: "...",
              ownerResolver: "actor",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const ctx = { user: { id: "u_42" } };
      const first = await fireTaskTrigger("demo:onboarding2", ctx, { actorUserId: "u_42" });
      const second = await fireTaskTrigger("demo:onboarding2", ctx, { actorUserId: "u_42" });

      expect(first.result).toBe("spawned");
      // Per the new caching policy, spawnTasks ALWAYS re-executes (lazy
      // backfill). Both fires return "spawned"; Task upsert is idempotent
      // by taskKey so we don't get duplicates.
      expect(second.result).toBe("spawned");

      const matching = store.tasks.filter((t) => t.taskKey === "demo2:user:u_42");
      expect(matching).toHaveLength(1);
    });

    it("lazy backfill: adding a new spec spawns a new task on next fire", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:lazy",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "demo3:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "Root",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const ctx = { user: { id: "u_99" } };
      await fireTaskTrigger("demo:lazy", ctx);

      // Add a new spec post-hoc.
      const trigger = store.triggers.find((t) => t.triggerKey === "demo:lazy")!;
      store.spawnSpecs.push({
        id: "spec_extra",
        triggerId: trigger.id,
        kind: "extra",
        isParent: false,
        sortOrder: 1,
        titleTemplate: "Extra",
        descriptionTemplate: "...",
        impactStatementTemplate: null,
        roleTitleTemplate: null,
        category: "OTHER",
        difficulty: "TRIVIAL",
        estimatedEffortHours: null,
        dueDays: null,
        availableInDays: null,
        deadlinePolicy: null,
        claimPolicy: "ASSIGNED_ONLY",
        isPublic: false,
        skillTagTemplates: [],
        interestTagTemplates: [],
        actionLinkUrlTemplate: null,
        actionLinkLabelTemplate: null,
        actionLinkInstructionsTemplate: null,
        ownerResolver: "actor",
        assigneePersonResolver: "none",
        assigneeOrganizationResolver: "none",
        parentResolver: "trigger.parentSpec",
        contributesToGate: false,
        metadata: null,
      });

      const second = await fireTaskTrigger("demo:lazy", ctx);
      expect(second.result).toBe("spawned");

      const extra = store.tasks.find((t) => t.taskKey === "demo3:u_99:extra");
      expect(extra).toBeTruthy();
    });

    it("restores a soft-deleted spawned task on re-fire", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:restore",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "restore:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "Restore me",
              descriptionTemplate: "...",
              ownerResolver: "actor",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      await fireTaskTrigger(
        "demo:restore",
        { user: { id: "u_restore" } },
        { actorUserId: "u_restore" },
      );
      const task = store.tasks.find((t) => t.taskKey === "restore:u_restore");
      expect(task).toBeTruthy();
      task!.deletedAt = new Date();
      task!.status = TaskStatus.STALE;

      const result = await fireTaskTrigger(
        "demo:restore",
        { user: { id: "u_restore" } },
        { actorUserId: "u_restore" },
      );

      expect(result.result).toBe("spawned");
      expect(store.tasks.filter((t) => t.taskKey === "restore:u_restore")).toHaveLength(1);
      expect(task!.deletedAt).toBeNull();
      expect(task!.status).toBe(TaskStatus.ACTIVE);
    });
  });

  describe("verifyTask sibling-scope", () => {
    it("verifies the target sibling when gate is met against peers", async () => {
      // Set up a parent + 3 child siblings + 1 verify-target sibling
      // matching the HMT shape.
      const parent = await db.task.create({
        data: {
          taskKey: "u:42",
          title: "User HMT root",
          description: "...",
          status: TaskStatus.ACTIVE,
          ownerUserId: "u_42",
        },
      });
      const parentId = (parent as { id: string }).id;
      const created: Record<string, string> = {};
      for (const k of ["share", "invite1", "invite2", "complete"] as const) {
        const t = await db.task.create({
          data: {
            taskKey: `u:42:${k}`,
            parentTaskId: parentId,
            title: k,
            description: "...",
            status: k === "complete" ? TaskStatus.ACTIVE : TaskStatus.VERIFIED,
            ownerUserId: "u_42",
          },
        });
        created[k] = (t as { id: string }).id;
      }

      await createTaskTrigger(
        {
          triggerKey: "demo:hmt-gate",
          eventName: "task.statusChanged.VERIFIED",
          triggerKind: "verifyTask",
          enabled: true,
          idempotencyKeyTemplate: "u:{{user.id}}:complete",
          completionGate: {
            kind: "allOf",
            inputScope: "siblings",
            subtaskKinds: ["share", "invite1", "invite2"],
            evidenceTemplate: "Gate met for {{user.id}}.",
          },
        },
        { actorUserId: "u_admin" },
      );

      const result = await fireTaskTrigger(
        "demo:hmt-gate",
        { user: { id: "42" } },
        { actorUserId: "u_42" },
      );

      expect(result.result).toBe("verified");

      const completeTask = store.tasks.find((t) => t.taskKey === "u:42:complete");
      expect(completeTask?.status).toBe(TaskStatus.VERIFIED);
      expect(completeTask?.verifiedByUserId).toBe("u_42");
      expect(completeTask?.completionEvidence).toBe("Gate met for 42.");

      // STATUS_UPDATE comment posted on the verified task
      const evidenceComment = store.comments.find((c) => c.taskId === completeTask?.id);
      expect(evidenceComment?.message).toBe("Gate met for 42.");
    });

    it("returns filteredOut when gate not yet met (sibling not VERIFIED)", async () => {
      const parent = await db.task.create({
        data: { taskKey: "u:99", title: "root", description: "...", status: TaskStatus.ACTIVE },
      });
      const parentId = (parent as { id: string }).id;
      // share + invite1 done, invite2 still ACTIVE
      for (const [k, status] of [
        ["share", TaskStatus.VERIFIED],
        ["invite1", TaskStatus.VERIFIED],
        ["invite2", TaskStatus.ACTIVE],
        ["complete", TaskStatus.ACTIVE],
      ] as const) {
        await db.task.create({
          data: {
            taskKey: `u:99:${k}`,
            parentTaskId: parentId,
            title: k,
            description: "...",
            status,
          },
        });
      }

      await createTaskTrigger(
        {
          triggerKey: "demo:hmt-partial",
          eventName: "task.statusChanged.VERIFIED",
          triggerKind: "verifyTask",
          enabled: true,
          idempotencyKeyTemplate: "u:{{user.id}}:complete",
          completionGate: {
            kind: "allOf",
            inputScope: "siblings",
            subtaskKinds: ["share", "invite1", "invite2"],
          },
        },
        { actorUserId: "u_admin" },
      );

      const result = await fireTaskTrigger("demo:hmt-partial", { user: { id: "99" } });
      expect(result.result).toBe("filteredOut");

      const completeTask = store.tasks.find((t) => t.taskKey === "u:99:complete");
      expect(completeTask?.status).toBe(TaskStatus.ACTIVE);
    });
  });

  describe("eventFilter", () => {
    it("rejects events that don't match the filter", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:filtered",
          eventName: "task.statusChanged.VERIFIED",
          triggerKind: "spawnTasks",
          enabled: true,
          idempotencyKeyTemplate: "demo:filtered:{{task.taskKey}}",
          eventFilter: { field: "task.taskKey", matches: "^onlyMe:" },
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "...",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const result = await fireTaskTrigger("demo:filtered", {
        task: { taskKey: "someOtherPattern:abc" },
      });
      expect(result.result).toBe("filteredOut");
      expect(result.reason).toContain("eventFilter rejected");
      expect(store.tasks).toHaveLength(0);
      // filteredOut writes do NOT add to fire log (would clash with @@unique)
      expect(store.fires).toHaveLength(0);
    });
  });

  describe("spawnCommunication sendCount-range gating", () => {
    async function setupTriggerAndTask(triggerKey: string) {
      const target = await db.task.create({
        data: {
          taskKey: `${triggerKey}-target`,
          title: "Target",
          description: "...",
          status: TaskStatus.ACTIVE,
          ownerUserId: "u_owner",
        },
      });
      await createTaskTrigger(
        {
          triggerKey,
          eventName: "cron.run-due-triggers",
          triggerKind: "spawnCommunication",
          enabled: true,
          // schedule set so the per-fire short-circuit is bypassed (the
          // schedule + rate-limits gate repeats). This mirrors how
          // production escalating-nudge triggers are configured.
          schedule: "0 13 * * 1",
          idempotencyKeyTemplate: `${triggerKey}-target`,
          communicationSpawnSpecs: [
            {
              kind: "first",
              sortOrder: 0,
              minSendCount: 0,
              maxSendCount: 0,
              subjectTemplate: "FIRST",
              bodyTextTemplate: "first body",
              dedupeKeyTemplate: `${triggerKey}-target:0`,
            },
            {
              kind: "second",
              sortOrder: 1,
              minSendCount: 1,
              maxSendCount: 1,
              subjectTemplate: "SECOND",
              bodyTextTemplate: "second body",
              dedupeKeyTemplate: `${triggerKey}-target:1`,
            },
            {
              kind: "third-and-after",
              sortOrder: 2,
              minSendCount: 2,
              // open-ended upper bound — covers send 2 onwards
              subjectTemplate: "THIRD",
              bodyTextTemplate: "third body",
              dedupeKeyTemplate: `${triggerKey}-target:2`,
            },
          ],
        },
        { actorUserId: "u_admin" },
      );
      return (target as { id: string }).id;
    }

    it("first fire (priorSendCount=0) uses the 'first' spec, not the others", async () => {
      const taskId = await setupTriggerAndTask("demo:escalate-1");
      const result = await fireTaskTrigger("demo:escalate-1", {
        task: { id: taskId },
      });
      expect(result.result).toBe("communicated");
      const subjects = store.communications.map(
        (c) => (c.metadataJson as { subject?: string })?.subject,
      );
      expect(subjects).toContain("FIRST");
      expect(subjects).not.toContain("SECOND");
      expect(subjects).not.toContain("THIRD");
    });

    it("second fire (priorSendCount=1) uses the 'second' spec", async () => {
      const taskId = await setupTriggerAndTask("demo:escalate-2");
      // Fire once → priorSendCount=0 → "FIRST"
      await fireTaskTrigger("demo:escalate-2", { task: { id: taskId } });
      // Fire again → priorSendCount=1 → "SECOND"
      const second = await fireTaskTrigger("demo:escalate-2", { task: { id: taskId } });
      expect(second.result).toBe("communicated");
      const subjects = store.communications.map(
        (c) => (c.metadataJson as { subject?: string })?.subject,
      );
      expect(subjects).toEqual(["FIRST", "SECOND"]);
    });

    it("open-ended upper bound keeps firing past the explicit ranges", async () => {
      const taskId = await setupTriggerAndTask("demo:escalate-3");
      await fireTaskTrigger("demo:escalate-3", { task: { id: taskId } });
      await fireTaskTrigger("demo:escalate-3", { task: { id: taskId } });
      await fireTaskTrigger("demo:escalate-3", { task: { id: taskId } });
      const fourth = await fireTaskTrigger("demo:escalate-3", { task: { id: taskId } });
      expect(fourth.result).toBe("communicated");
      const subjects = store.communications.map(
        (c) => (c.metadataJson as { subject?: string })?.subject,
      );
      // 4 sends: FIRST, SECOND, THIRD, THIRD (the open-ended spec keeps applying).
      expect(subjects).toEqual(["FIRST", "SECOND", "THIRD", "THIRD"]);
    });
  });

  describe("dryRun", () => {
    it("returns rendered preview without DB writes", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:dry",
          eventName: "manual",
          enabled: true,
          idempotencyKeyTemplate: "dry:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "...",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const taskCountBefore = store.tasks.length;
      const fireCountBefore = store.fires.length;

      const result = await fireTaskTrigger(
        "demo:dry",
        { user: { id: "abc" } },
        { dryRun: true },
      );
      expect(result.result).toBe("spawned");
      expect(result.reason).toBe("dryRun");
      expect(result.spawnedTaskKeys).toEqual(["dry:abc"]);

      // No DB writes
      expect(store.tasks).toHaveLength(taskCountBefore);
      expect(store.fires).toHaveLength(fireCountBefore);
    });
  });

  describe("fireTaskTriggersForEvent", () => {
    it("fires all enabled triggers matching the event name in parallel", async () => {
      await createTaskTrigger(
        {
          triggerKey: "demo:multi-a",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "ma:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "A {{user.id}}",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );
      await createTaskTrigger(
        {
          triggerKey: "demo:multi-b",
          eventName: "user.signup",
          enabled: true,
          idempotencyKeyTemplate: "mb:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "B {{user.id}}",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );
      await createTaskTrigger(
        {
          triggerKey: "demo:multi-c-disabled",
          eventName: "user.signup",
          enabled: false,
          idempotencyKeyTemplate: "mc:{{user.id}}",
          spawnSpecs: [
            {
              kind: "root",
              isParent: true,
              titleTemplate: "C {{user.id}}",
              descriptionTemplate: "...",
              parentResolver: "none",
            },
          ],
        },
        { actorUserId: "u_admin" },
      );

      const results = await fireTaskTriggersForEvent("user.signup", {
        user: { id: "u_77" },
      });
      // Only enabled triggers are returned (findMany filters by enabled:true).
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.result === "spawned")).toBe(true);
      expect(store.tasks.find((t) => t.taskKey === "ma:u_77")).toBeTruthy();
      expect(store.tasks.find((t) => t.taskKey === "mb:u_77")).toBeTruthy();
      expect(store.tasks.find((t) => t.taskKey === "mc:u_77")).toBeFalsy();
    });
  });
});
