import { describe, expect, it } from "vitest";

import {
  buildMagicLinkText,
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
      expect(copy.buttonLabel).toBe("Save my vote");
    });

    it("returns War on Disease copy for warondisease.* hosts", () => {
      expect(getMagicLinkCopy("warondisease.org").buttonLabel).toBe(
        "Save my vote",
      );
      expect(getMagicLinkCopy("warondisease.local").buttonLabel).toBe(
        "Save my vote",
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
        "Save your 1% Treaty vote",
      );
    });

    it("falls back to a host-stamped subject line for Optimitron hosts", () => {
      expect(buildMagicLinkSubject("optimitron.local")).toBe(
        "Sign in to optimitron.local",
      );
    });
  });

  describe("buildMagicLinkText", () => {
    it("tells War on Disease voters the link saves their 1% Treaty vote", () => {
      expect(
        buildMagicLinkText(
          "https://warondisease.org/callback",
          "warondisease.org",
        ),
      ).toContain("Use the URL below to verify your email and save your vote.");
    });
  });
});
