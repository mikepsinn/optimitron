import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "../unsub-token";

describe("unsub-token", () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-a";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("signs deterministically for the same payload", () => {
    const a = signUnsubToken({ userId: "u1", scope: "task_notifications" });
    const b = signUnsubToken({ userId: "u1", scope: "task_notifications" });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies its own signature", () => {
    const payload = { userId: "u1", scope: "task_notifications" as const, emailLogId: "em1" };
    const token = signUnsubToken(payload);
    expect(verifyUnsubToken(payload, token)).toBe(true);
  });

  it("rejects a token signed over a different userId", () => {
    const tokenForU1 = signUnsubToken({ userId: "u1", scope: "task_notifications" });
    expect(verifyUnsubToken({ userId: "u2", scope: "task_notifications" }, tokenForU1)).toBe(false);
  });

  it("rejects a token signed over a different scope", () => {
    const tokenForTaskNotifications = signUnsubToken({ userId: "u1", scope: "task_notifications" });
    expect(verifyUnsubToken({ userId: "u1", scope: "onboarding" }, tokenForTaskNotifications)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signUnsubToken({ userId: "u1", scope: "task_notifications" });
    process.env.NEXTAUTH_SECRET = "test-secret-b";
    expect(verifyUnsubToken({ userId: "u1", scope: "task_notifications" }, token)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    const payload = { userId: "u1", scope: "task_notifications" as const };
    expect(verifyUnsubToken(payload, "")).toBe(false);
    expect(verifyUnsubToken(payload, "not-hex")).toBe(false);
    expect(verifyUnsubToken(payload, "abc")).toBe(false);
  });

  it("treats emailLogId as part of the signed payload", () => {
    const tokenWithLog = signUnsubToken({ userId: "u1", scope: "task_notifications", emailLogId: "em1" });
    expect(
      verifyUnsubToken({ userId: "u1", scope: "task_notifications", emailLogId: "em2" }, tokenWithLog),
    ).toBe(false);
  });

  // Adding the email field must not change any hash that did not use it.
  // Every unsubscribe link already delivered was signed without one, and this
  // module promises those keep working indefinitely — an unconditional extra
  // segment in the canonical string would silently break all of them.
  it("produces an unchanged signature for payloads carrying no email", () => {
    // Golden value: HMAC-SHA256 of the canonical string the implementation
    // produced BEFORE the email field existed — "u1|task_notifications|" keyed
    // with "test-secret-a". If this fails, links already in inboxes are dead.
    expect(signUnsubToken({ userId: "u1", scope: "task_notifications" })).toBe(
      "1f8eebcd9f95db679c8ea89723e0e53c684e07dc1860caf1c414ea2090c6c73c",
    );
  });

  it("signs and verifies an email-only payload for recipients with no account", () => {
    const payload = { email: "senator@example.gov", scope: "outreach" as const };
    const token = signUnsubToken(payload);
    expect(verifyUnsubToken(payload, token)).toBe(true);
  });

  it("rejects a token signed over a different email", () => {
    const token = signUnsubToken({ email: "a@example.gov", scope: "outreach" });
    expect(verifyUnsubToken({ email: "b@example.gov", scope: "outreach" }, token)).toBe(false);
  });

  it("normalizes email casing so a link verifies regardless of how it was cased", () => {
    const token = signUnsubToken({ email: "Senator@Example.Gov", scope: "outreach" });
    expect(verifyUnsubToken({ email: "senator@example.gov", scope: "outreach" }, token)).toBe(true);
  });

  it("does not let an email-keyed token unsubscribe a user id", () => {
    const emailToken = signUnsubToken({ email: "u1@example.org", scope: "outreach" });
    expect(verifyUnsubToken({ userId: "u1", scope: "outreach" }, emailToken)).toBe(false);
  });
});
