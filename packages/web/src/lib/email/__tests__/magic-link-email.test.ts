import { describe, expect, it } from "vitest";

import {
  buildMagicLinkSubject,
  getMagicLinkCopy,
} from "@/lib/email/magic-link-render";

// We test the pure host-dispatch helpers that `sendMagicLinkEmail` reads
// from, not `sendMagicLinkEmail` itself. The previous shape mocked
// `sendReactEmail` and then asserted that `sendReactEmail` had been called
// with certain props — a wiring test that only proved the function passes
// arguments to its mock. CLAUDE.md: "Test the boundary, not the wiring."
// The actual decision being tested is which site copy and which subject
// line a given inbound host maps to. Those are pure functions.
describe("magic-link host dispatch", () => {
  describe("getMagicLinkCopy", () => {
    it("returns War on Disease copy for the legacy Trial Abundance Survey host", () => {
      const copy = getMagicLinkCopy("trialabundancesurvey.org");
      expect(copy.buttonLabel).toBe("End war and disease");
    });

    it("returns War on Disease copy for warondisease.* hosts", () => {
      expect(getMagicLinkCopy("warondisease.org").buttonLabel).toBe(
        "End war and disease",
      );
      expect(getMagicLinkCopy("warondisease.local").buttonLabel).toBe(
        "End war and disease",
      );
    });

    it("returns the neutral 'Sign in' label for Optimitron hosts", () => {
      expect(getMagicLinkCopy("optimitron.com").buttonLabel).toBe("Sign in");
      expect(getMagicLinkCopy("optimitron.local").buttonLabel).toBe("Sign in");
    });
  });

  describe("buildMagicLinkSubject", () => {
    it("uses the War on Disease subject line for warondisease.* hosts", () => {
      expect(buildMagicLinkSubject("warondisease.org")).toBe(
        "End war and disease",
      );
    });

    it("falls back to a host-stamped subject line for Optimitron hosts", () => {
      expect(buildMagicLinkSubject("optimitron.local")).toBe(
        "Sign in to optimitron.local",
      );
    });
  });
});
