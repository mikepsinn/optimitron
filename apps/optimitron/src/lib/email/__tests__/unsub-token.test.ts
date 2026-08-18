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
});
