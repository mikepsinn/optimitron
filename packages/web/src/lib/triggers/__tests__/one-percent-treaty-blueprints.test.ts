import { describe, expect, it } from "vitest";
import { ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS } from "@/lib/triggers/blueprints/one-percent-treaty";

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
        ? (hmtGate.completionGate as { evidenceTemplate?: unknown }).evidenceTemplate
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
    expect(evidenceTemplate).toContain(
      "made the phone call",
    );
    expect(evidenceTemplate).not.toContain(
      "made the phone calls",
    );
  });

  it("uses shared trigger params for HMT scale and propagation numbers", () => {
    const onboarding = ONE_PERCENT_TREATY_TRIGGER_BLUEPRINTS.find(
      (blueprint) => blueprint.triggerKey === "user-onboarding:treaty",
    );
    const rootTask = onboarding?.spawnSpecs?.find((spec) => spec.kind === "root");
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
