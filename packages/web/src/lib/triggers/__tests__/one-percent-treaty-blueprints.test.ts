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
    expect(phoneTask?.descriptionTemplate).toContain("then call two humans");
    expect(phoneTask?.descriptionTemplate).not.toContain("make two calls");
    expect(phoneTask?.descriptionTemplate).not.toContain("made two calls");
    expect(evidenceTemplate).toContain(
      "made the phone call",
    );
    expect(evidenceTemplate).not.toContain(
      "made the phone calls",
    );
  });
});
