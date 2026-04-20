import { describe, expect, it } from "vitest";
import {
  pickSubjectVariant,
  type SubjectVariantContext,
} from "../referral-email-sequence";

const baseCtx: SubjectVariantContext = {
  deathsSinceLastEmail: 15000,
  overdueSignerCount: 150,
  presidentFirstName: null,
  presidentFullName: null,
  referralCount: 0,
  step: 2,
  wastedUsdSinceLastEmail: 1_200_000_000,
};

describe("pickSubjectVariant", () => {
  it("returns a subject, subjectTemplate, and variantId", () => {
    const { subject, subjectTemplate, variantId } = pickSubjectVariant(baseCtx, () => 0);
    expect(subject.length).toBeGreaterThan(0);
    expect(subjectTemplate.length).toBeGreaterThan(0);
    expect(variantId.length).toBeGreaterThan(0);
  });

  it("selects the generic pool when no president is known", () => {
    const { variantId } = pickSubjectVariant({ ...baseCtx, presidentFullName: null }, () => 0);
    // First variant in the generic pool is "deaths-stat".
    expect(variantId).toBe("deaths-stat");
  });

  it("selects the presidential pool when a president name is present", () => {
    const { variantId, subject } = pickSubjectVariant(
      { ...baseCtx, presidentFullName: "Emmanuel Macron", presidentFirstName: "Emmanuel" },
      () => 0,
    );
    // First variant in the presidential pool is "president-deaths".
    expect(variantId).toBe("president-deaths");
    expect(subject).toContain("Emmanuel Macron");
  });

  it("produces distinct variants across the full pool (uniform sampling)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      const { variantId } = pickSubjectVariant(baseCtx, () => i / 6);
      ids.add(variantId);
    }
    expect(ids.size).toBeGreaterThanOrEqual(6);
  });

  it("clamps a random value of 1.0 to the last variant", () => {
    const { variantId } = pickSubjectVariant(baseCtx, () => 1);
    // 6 variants — final index = 5, id = "action-required-30-sec".
    expect(variantId).toBe("action-required-30-sec");
  });

  it("always returns the secret subject for step 0, regardless of president or RNG", () => {
    for (const president of [null, "Emmanuel Macron"]) {
      for (const rnd of [0, 0.25, 0.5, 0.75, 0.999]) {
        const { subject, variantId, subjectTemplate } = pickSubjectVariant(
          {
            ...baseCtx,
            step: 0,
            presidentFullName: president,
            presidentFirstName: president ? "Emmanuel" : null,
          },
          () => rnd,
        );
        expect(variantId).toBe("most-important-secret");
        expect(subject).toBe("Can I tell you the most important secret in the world?");
        expect(subjectTemplate).toBe("Can I tell you the most important secret in the world?");
      }
    }
  });

  it("never returns the secret subject for steps 1-15", () => {
    for (let step = 1; step <= 15; step += 1) {
      for (const president of [null, "Emmanuel Macron"]) {
        for (const rnd of [0, 0.5, 0.999]) {
          const { variantId, subject } = pickSubjectVariant(
            {
              ...baseCtx,
              step,
              presidentFullName: president,
              presidentFirstName: president ? "Emmanuel" : null,
            },
            () => rnd,
          );
          expect(variantId).not.toBe("most-important-secret");
          expect(subject).not.toContain("most important secret");
        }
      }
    }
  });
});
