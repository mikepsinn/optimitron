import { TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import { gateEvidenceTemplate, gateInputScope, isGateMet } from "../completion-gate";

const v = (kind: string) => ({ spawnKind: kind, status: TaskStatus.VERIFIED });
const a = (kind: string) => ({ spawnKind: kind, status: TaskStatus.ACTIVE });

describe("triggers/completion-gate/isGateMet", () => {
  it("null gate is never met", () => {
    expect(isGateMet(null, [v("a"), v("b")])).toBe(false);
    expect(isGateMet(undefined, [v("a")])).toBe(false);
  });

  describe("kind: always", () => {
    it("met regardless of children", () => {
      expect(isGateMet({ kind: "always" }, [])).toBe(true);
      expect(isGateMet({ kind: "always" }, [a("x")])).toBe(true);
    });
  });

  describe("kind: allOf", () => {
    it("met when every named subtask is VERIFIED", () => {
      const gate = { kind: "allOf", subtaskKinds: ["share", "invite1", "invite2"] };
      expect(isGateMet(gate, [v("share"), v("invite1"), v("invite2")])).toBe(true);
    });

    it("not met when any is not VERIFIED", () => {
      const gate = { kind: "allOf", subtaskKinds: ["share", "invite1"] };
      expect(isGateMet(gate, [v("share"), a("invite1")])).toBe(false);
    });

    it("not met when a required subtask is missing", () => {
      const gate = { kind: "allOf", subtaskKinds: ["share", "invite1"] };
      expect(isGateMet(gate, [v("share")])).toBe(false);
    });
  });

  describe("kind: anyOf", () => {
    it("met when at least one named subtask is VERIFIED", () => {
      const gate = { kind: "anyOf", subtaskKinds: ["share", "invite1"] };
      expect(isGateMet(gate, [v("share"), a("invite1")])).toBe(true);
    });

    it("not met when none are VERIFIED", () => {
      const gate = { kind: "anyOf", subtaskKinds: ["share", "invite1"] };
      expect(isGateMet(gate, [a("share"), a("invite1")])).toBe(false);
    });
  });

  describe("kind: count", () => {
    it("met when N children are VERIFIED", () => {
      const gate = { kind: "count", minVerified: 2 };
      expect(isGateMet(gate, [v("a"), v("b"), a("c")])).toBe(true);
    });

    it("not met when fewer than N are VERIFIED", () => {
      const gate = { kind: "count", minVerified: 3 };
      expect(isGateMet(gate, [v("a"), v("b"), a("c")])).toBe(false);
    });
  });

  describe("kind: <unknown>", () => {
    it("returns false on unrecognized kinds", () => {
      expect(isGateMet({ kind: "weird" }, [v("a")])).toBe(false);
    });
  });
});

describe("triggers/completion-gate/gateInputScope", () => {
  it("defaults to children", () => {
    expect(gateInputScope({ kind: "allOf", subtaskKinds: ["a"] })).toBe("children");
    expect(gateInputScope(null)).toBe("children");
  });

  it("returns siblings when explicitly set", () => {
    expect(gateInputScope({ kind: "allOf", subtaskKinds: ["a"], inputScope: "siblings" })).toBe(
      "siblings",
    );
  });

  it("falls back to children for unrecognized values", () => {
    expect(
      gateInputScope({ kind: "allOf", subtaskKinds: ["a"], inputScope: "weird" as never }),
    ).toBe("children");
  });
});

describe("triggers/completion-gate/gateEvidenceTemplate", () => {
  it("returns the evidenceTemplate string when present", () => {
    expect(
      gateEvidenceTemplate({ kind: "allOf", subtaskKinds: [], evidenceTemplate: "Done because reasons." }),
    ).toBe("Done because reasons.");
  });

  it("returns null when absent", () => {
    expect(gateEvidenceTemplate({ kind: "allOf", subtaskKinds: [] })).toBe(null);
    expect(gateEvidenceTemplate(null)).toBe(null);
  });
});
