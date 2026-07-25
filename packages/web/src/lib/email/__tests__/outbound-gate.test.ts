import { describe, expect, it } from "vitest";
import {
  evaluateOutboundGate,
  isEmailAllowlisted,
  normalizeAllowlistEntries,
} from "@/lib/email/outbound-gate";

const OPEN = { allowlist: [], stopAllOutbound: false };

describe("evaluateOutboundGate", () => {
  it("suppresses every authorization kind when the emergency stop is pulled", () => {
    const gate = { allowlist: [], stopAllOutbound: true };
    for (const kind of ["transactional", "owner", "approved"] as const) {
      expect(
        evaluateOutboundGate({
          authorizationKind: kind,
          gate,
          to: "citizen@example.org",
        }),
      ).toEqual({ allowed: false, reason: "emergency_stop" });
    }
  });

  it("fails closed for non-transactional mail when the gate cannot be read", () => {
    expect(
      evaluateOutboundGate({
        authorizationKind: "approved",
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: false, reason: "gate_unreadable" });
    expect(
      evaluateOutboundGate({
        authorizationKind: "owner",
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: false, reason: "gate_unreadable" });
  });

  it("still delivers recipient-initiated mail when the gate cannot be read", () => {
    expect(
      evaluateOutboundGate({
        authorizationKind: "transactional",
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: true });
  });

  it("allows any recipient when the allowlist is empty", () => {
    expect(
      evaluateOutboundGate({
        authorizationKind: "owner",
        gate: OPEN,
        to: "stranger@anywhere.test",
      }),
    ).toEqual({ allowed: true });
  });

  it("restricts recipients when the allowlist is populated", () => {
    const gate = {
      allowlist: ["M@ThinkByNumbers.org", "@example.org"],
      stopAllOutbound: false,
    };
    expect(
      evaluateOutboundGate({
        authorizationKind: "owner",
        gate,
        to: "m@thinkbynumbers.org",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundGate({
        authorizationKind: "owner",
        gate,
        to: "anyone@example.org",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundGate({
        authorizationKind: "owner",
        gate,
        to: "stranger@other.org",
      }),
    ).toEqual({ allowed: false, reason: "recipient_not_allowlisted" });
  });
});

describe("isEmailAllowlisted", () => {
  const entries = normalizeAllowlistEntries([
    " M@ThinkByNumbers.org ",
    "@Example.ORG",
    "warondisease.org",
  ]);

  it("matches an exact address case-insensitively but not its siblings", () => {
    expect(isEmailAllowlisted("M@ThinkByNumbers.org", entries)).toBe(true);
    expect(isEmailAllowlisted("other@thinkbynumbers.org", entries)).toBe(false);
  });

  it("matches domain entries with or without the leading @, exactly", () => {
    expect(isEmailAllowlisted("anyone@example.org", entries)).toBe(true);
    expect(isEmailAllowlisted("anyone@warondisease.org", entries)).toBe(true);
    expect(isEmailAllowlisted("x@sub.example.org", entries)).toBe(false);
    expect(isEmailAllowlisted("x@evilexample.org", entries)).toBe(false);
  });

  it("rejects values that are not routable addresses", () => {
    expect(isEmailAllowlisted("", entries)).toBe(false);
    expect(isEmailAllowlisted("no-at-sign", entries)).toBe(false);
  });
});
