import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  verifyTask: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/tasks.server", () => ({
  verifyTask: mocks.verifyTask,
}));

import { POST } from "./route";

describe("task verify route", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset();
    mocks.verifyTask.mockReset();
  });

  it("returns 403 for forbidden reviewers", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.verifyTask.mockRejectedValue(new Error("Forbidden"));

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/verify", {
        body: JSON.stringify({ completionEvidence: "public proof" }),
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("passes verification payloads through to the task service", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "admin_1" });
    mocks.verifyTask.mockResolvedValue({ id: "claim_1", status: "VERIFIED" });

    const response = await POST(
      new Request("http://localhost/api/tasks/task_1/verify", {
        body: JSON.stringify({
          claimId: "claim_1",
          verificationNote: "Looks good.",
        }),
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "task_1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(mocks.verifyTask).toHaveBeenCalledWith("task_1", "admin_1", {
      actualCashCostUsd: null,
      actualEffortSeconds: null,
      claimId: "claim_1",
      completionEvidence: null,
      verificationNote: "Looks good.",
    });
    await expect(response.json()).resolves.toMatchObject({ success: true });
  });
});
