import { describe, expect, it } from "vitest";
import { transactionalSend, ownerSend } from "@/lib/email/outbound-authorization.server";
import {
  evaluateOutboundGate,
  isEmailAllowlisted,
  normalizeAllowlistEntries,
} from "@/lib/email/outbound-gate";

const OPEN = { allowlist: [], stopAllOutbound: false };

describe("evaluateOutboundGate", () => {
  it("suppresses every authorization kind when the emergency stop is pulled", () => {
    const gate = { allowlist: [], stopAllOutbound: true };
    const authorizations = [
      transactionalSend("magic_link"),
      ownerSend("user_owner"),
      { approvedPayloadHash: "hash", kind: "approved", requestId: "ear_1" },
    ] as const;
    for (const authorization of authorizations) {
      expect(
        evaluateOutboundGate({
          authorization,
          gate,
          to: "citizen@example.org",
        }),
      ).toEqual({ allowed: false, reason: "emergency_stop" });
    }
  });

  it("fails closed for non-transactional mail when the gate cannot be read", () => {
    expect(
      evaluateOutboundGate({
        authorization: {
          approvedPayloadHash: "hash",
          kind: "approved",
          requestId: "ear_1",
        },
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: false, reason: "gate_unreadable" });
    expect(
      evaluateOutboundGate({
        authorization: ownerSend("user_owner"),
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: false, reason: "gate_unreadable" });
  });

  it("still delivers sign-in mail when the gate cannot be read", () => {
    expect(
      evaluateOutboundGate({
        authorization: transactionalSend("magic_link"),
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: true });
  });

  // A cron digest is not a lockout risk, so it waits like everything else.
  it("holds non-sign-in transactional mail when the gate cannot be read", () => {
    expect(
      evaluateOutboundGate({
        authorization: transactionalSend("monthly_chain_digest"),
        gate: null,
        to: "citizen@example.org",
      }),
    ).toEqual({ allowed: false, reason: "gate_unreadable" });
  });

  it("allows any recipient when the allowlist is empty", () => {
    expect(
      evaluateOutboundGate({
        authorization: ownerSend("user_owner"),
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
        authorization: ownerSend("user_owner"),
        gate,
        to: "m@thinkbynumbers.org",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundGate({
        authorization: ownerSend("user_owner"),
        gate,
        to: "anyone@example.org",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundGate({
        authorization: ownerSend("user_owner"),
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
