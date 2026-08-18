import { CronExpressionParser } from "cron-parser";
import { describe, expect, it } from "vitest";
import { ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS } from "@/lib/triggers/blueprints/one-percent-treaty";
import {
  validateAssigneePersonResolver,
  validateCreatorResolver,
  validateParentResolver,
} from "@/lib/triggers/resolvers";

describe("1% Treaty trigger blueprints", () => {
  it("requires one phone call while asking that human to recruit two more", () => {
    const onboarding = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
      (blueprint) => blueprint.triggerKey === "user-onboarding:treaty",
    );
    const phoneTask = onboarding?.spawnSpecs?.find(
      (spec) => spec.kind === "phoneScript",
    );
    const hmtGate = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
      (blueprint) => blueprint.triggerKey === "user-onboarding:treaty:hmt-gate",
    );
    const evidenceTemplate =
      typeof hmtGate?.completionGate === "object" &&
      hmtGate.completionGate !== null &&
      "evidenceTemplate" in hmtGate.completionGate
        ? (hmtGate.completionGate as { evidenceTemplate?: unknown })
            .evidenceTemplate
        : undefined;

    expect(phoneTask?.titleTemplate).toBe(
      "Make one phone call. Outsource humanity management.",
    );
    expect(phoneTask?.descriptionTemplate).toContain(
      "The trick: call one human you love",
    );
    expect(phoneTask?.descriptionTemplate).toContain(
      "then call {{params.propagationAsksPerHuman}} humans",
    );
    expect(phoneTask?.descriptionTemplate).not.toContain("make two calls");
    expect(phoneTask?.descriptionTemplate).not.toContain("made two calls");
    expect(evidenceTemplate).toContain("made the phone call");
    expect(evidenceTemplate).not.toContain("made the phone calls");
  });

  it("uses shared trigger params for HMT scale and propagation numbers", () => {
    const onboarding = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
      (blueprint) => blueprint.triggerKey === "user-onboarding:treaty",
    );
    const rootTask = onboarding?.spawnSpecs?.find(
      (spec) => spec.kind === "root",
    );
    const phoneTask = onboarding?.spawnSpecs?.find(
      (spec) => spec.kind === "phoneScript",
    );
    const copy = [
      rootTask?.titleTemplate,
      rootTask?.descriptionTemplate,
      phoneTask?.descriptionTemplate,
    ].join("\n");

    expect(copy).toContain("{{params.globalHumanity}}");
    expect(copy).toContain("{{params.majorityHumanity}}");
    expect(copy).toContain("{{params.doublingRoundsToTarget}}");
    expect(copy).toContain("{{params.propagationAsksPerHuman}}");
    expect(copy).toContain("{{params.directHumanAssignments}}");
    expect(copy).not.toMatch(/\b8 billion\b/i);
    expect(copy).not.toMatch(/\bfour billion\b/i);
    expect(copy).not.toMatch(/\b32 rounds\b/i);
    expect(copy).not.toMatch(/\btwo friends\b/i);
  });
});

// The hygiene sweeps are the first scheduled triggers — this pins the
// contract between the db blueprints and the web firing engine: resolvers
// must exist in the registry, tokens-free idempotency keys (cron fires have
// no context), agent-queue eligibility, and stable-key reactivation.
describe("tree-hygiene sweep blueprints", () => {
  const sweepKeys = [
    "hygiene:duplicate-sweep",
    "hygiene:root-orphan-sweep",
    "hygiene:estimate-staleness-sweep",
  ];

  it.each(sweepKeys)("%s is a valid scheduled agent sweep", (key) => {
    const trigger = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
      (blueprint) => blueprint.triggerKey === key,
    );
    expect(trigger).toBeDefined();
    expect(trigger?.enabled).toBe(true);
    expect(trigger?.iterationSource).toBe("none");
    // isScheduleDue swallows cron parse errors and returns false, so a typo'd
    // schedule would silently never fire. Assert the cron string actually
    // parses instead of merely being truthy.
    expect(() => CronExpressionParser.parse(trigger!.schedule!)).not.toThrow();
    // No {{tokens}} — scheduled fires carry no event context to render from.
    expect(trigger?.idempotencyKeyTemplate).not.toContain("{{");

    const spec = trigger?.spawnSpecs?.[0];
    expect(spec?.isParent).toBe(true);
    expect(spec?.isPublic).toBe(false);
    expect(validateCreatorResolver(spec!.creatorResolver!)).toBe(true);
    expect(validateAssigneePersonResolver(spec!.assigneePersonResolver!)).toBe(
      true,
    );
    expect(validateParentResolver(spec!.parentResolver!)).toBe(true);
    expect(spec?.parentResolver).toBe("fixed:optimitron:task-graph-steward");
    expect(spec?.category).toBe("GOVERNANCE");
    expect(spec?.descriptionTemplate).toContain("getTaskTreeAudit");
    expect(spec?.descriptionTemplate).toContain("nextCursor");
    expect(spec?.descriptionTemplate).toContain("complete is true");

    const metadata = spec?.metadata as {
      reactivateOnFire?: unknown;
      taskContextJson?: { executor_type?: unknown };
    };
    expect(metadata?.reactivateOnFire).toBe(true);
    expect(metadata?.taskContextJson?.executor_type).toBe("AI Agent");
  });

  it("sweeps spawn tasks only — no email specs (honoring the nudge note)", () => {
    for (const key of sweepKeys) {
      const trigger = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
        (blueprint) => blueprint.triggerKey === key,
      );
      expect(trigger?.triggerKind ?? "spawnTasks").toBe("spawnTasks");
      expect(trigger?.communicationSpawnSpecs ?? []).toHaveLength(0);
    }
  });
});
