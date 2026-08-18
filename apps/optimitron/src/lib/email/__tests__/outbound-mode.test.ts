import { describe, expect, it } from "vitest";

import {
  evaluateOutboundEmailPolicy,
  isEmailAllowlisted,
  parseOutboundEmailAllowlist,
} from "@/lib/email/outbound-mode";

describe("parseOutboundEmailAllowlist", () => {
  it("splits on commas, trims, lowercases, and drops empties", () => {
    expect(
      parseOutboundEmailAllowlist(" M@ThinkByNumbers.org , @Example.ORG ,, "),
    ).toEqual(["m@thinkbynumbers.org", "@example.org"]);
  });

  it("returns an empty list for null/undefined/blank", () => {
    expect(parseOutboundEmailAllowlist(null)).toEqual([]);
    expect(parseOutboundEmailAllowlist(undefined)).toEqual([]);
    expect(parseOutboundEmailAllowlist("")).toEqual([]);
  });
});

describe("isEmailAllowlisted", () => {
  const entries = parseOutboundEmailAllowlist(
    "m@thinkbynumbers.org,@example.org,warondisease.org",
  );

  it("matches exact addresses case-insensitively", () => {
    expect(isEmailAllowlisted("M@ThinkByNumbers.org", entries)).toBe(true);
    expect(isEmailAllowlisted("other@thinkbynumbers.org", entries)).toBe(
      false,
    );
  });

  it("matches @domain and bare-domain entries against the whole domain", () => {
    expect(isEmailAllowlisted("anyone@example.org", entries)).toBe(true);
    expect(isEmailAllowlisted("anyone@warondisease.org", entries)).toBe(true);
    // subdomains and suffix look-alikes must NOT match
    expect(isEmailAllowlisted("x@sub.example.org", entries)).toBe(false);
    expect(isEmailAllowlisted("x@evilexample.org", entries)).toBe(false);
  });

  it("rejects unroutable recipients", () => {
    expect(isEmailAllowlisted("", entries)).toBe(false);
    expect(isEmailAllowlisted("no-at-sign", entries)).toBe(false);
  });
});

describe("evaluateOutboundEmailPolicy", () => {
  it("defaults to allowed when mode is unset or on", () => {
    expect(
      evaluateOutboundEmailPolicy({
        allowlist: undefined,
        mode: undefined,
        to: "joe@example.org",
      }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundEmailPolicy({
        allowlist: undefined,
        mode: "on",
        to: "joe@example.org",
      }),
    ).toEqual({ allowed: true });
  });

  it("suppresses everything in off mode", () => {
    expect(
      evaluateOutboundEmailPolicy({
        allowlist: "joe@example.org",
        mode: "off",
        to: "joe@example.org",
      }),
    ).toEqual({ allowed: false, reason: "outbound_mode_off" });
  });

  it("suppresses non-matching recipients in allowlist mode", () => {
    const input = { allowlist: "@example.org", mode: "allowlist" as const };
    expect(
      evaluateOutboundEmailPolicy({ ...input, to: "joe@example.org" }),
    ).toEqual({ allowed: true });
    expect(
      evaluateOutboundEmailPolicy({ ...input, to: "joe@other.org" }),
    ).toEqual({ allowed: false, reason: "recipient_not_allowlisted" });
  });

  it("suppresses everyone in allowlist mode with an empty allowlist", () => {
    expect(
      evaluateOutboundEmailPolicy({
        allowlist: undefined,
        mode: "allowlist",
        to: "joe@example.org",
      }),
    ).toEqual({ allowed: false, reason: "recipient_not_allowlisted" });
  });
});
