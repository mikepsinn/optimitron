import { TaskExecutionAttemptStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAttempt: vi.fn(),
  findUser: vi.fn(),
  requireAuth: vi.fn(),
  startTaskExecution: vi.fn(),
  submitTaskArtifact: vi.fn(),
  submitTaskForVerification: vi.fn(),
}));

// requireAuth stays the auth seam; requireTaskRequestAuth mirrors the route
// contract on top of it using the real scope→boundary derivation.
vi.mock("@/lib/auth-utils", async () => {
  const { taskBoundaryFromScopes } = await import("@/lib/mcp-scopes");
  return {
    requireAuth: mocks.requireAuth,
    requireTaskRequestAuth: async (
      request: Request,
      requiredScopes?: readonly unknown[],
    ) => {
      const auth = await mocks.requireAuth(request, requiredScopes);
      return "scopes" in auth
        ? {
            clientAccessBoundary: taskBoundaryFromScopes(
              auth.scopes,
              auth.organizationIds,
            ),
            userId: auth.userId,
          }
        : { userId: auth.userId };
    },
  };
});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    taskExecutionAttempt: { findFirst: mocks.findAttempt },
    user: { findUnique: mocks.findUser },
  },
}));
vi.mock("@/lib/tasks/execution-lifecycle.server", () => ({
  startTaskExecution: mocks.startTaskExecution,
  submitTaskArtifact: mocks.submitTaskArtifact,
  submitTaskForVerification: mocks.submitTaskForVerification,
}));

import { POST } from "./route";

describe("extension task completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.findUser.mockResolvedValue({ personId: "person-1" });
    mocks.submitTaskArtifact.mockResolvedValue({ id: "artifact-new" });
    mocks.submitTaskForVerification.mockResolvedValue({
      verification: { id: "verification-new" },
    });
  });

  it("submits evidence to a newly created attempt even when the prior attempt already had an artifact", async () => {
    mocks.findAttempt.mockResolvedValue({
      artifacts: [{ id: "artifact-old" }],
      id: "attempt-old",
      status: TaskExecutionAttemptStatus.COMPLETED,
      verifications: [],
    });
    mocks.startTaskExecution.mockResolvedValue({
      id: "attempt-new",
      status: TaskExecutionAttemptStatus.RUNNING,
    });

    const response = await POST(
      new Request("https://example.test/api/extension/tasks/task-1/done", {
        body: JSON.stringify({
          actualDurationSeconds: 120,
          completionEvidence: "New attempt evidence",
        }),
        method: "POST",
      }),
      { params: Promise.resolve({ id: "task-1" }) },
    );

    expect(response.status).toBe(202);
    expect(mocks.submitTaskArtifact).toHaveBeenCalledWith(
      {
        label: "Extension completion evidence",
        structuredResult: { completionEvidence: "New attempt evidence" },
        taskExecutionAttemptId: "attempt-new",
      },
      "user-1",
    );
    expect(mocks.submitTaskForVerification).toHaveBeenCalledWith(
      expect.objectContaining({ taskExecutionAttemptId: "attempt-new" }),
      "user-1",
    );
  });
});
