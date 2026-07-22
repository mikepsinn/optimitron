import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReviewedAnswers: vi.fn(),
  prepareFormResponses: vi.fn(),
  proposeFormSubmission: vi.fn(),
}));

vi.mock("../form-responses.server", () => mocks);

import {
  handleFormResponseToolCall,
  type FormResponseToolName,
} from "./form-responses";

function responseBody(
  response: Awaited<ReturnType<typeof handleFormResponseToolCall>>,
) {
  return JSON.parse(response.content[0]?.text ?? "{}") as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("MCP form response tools", () => {
  it("requires an identified user", async () => {
    const response = await handleFormResponseToolCall({
      args: {},
      clientAccessBoundary: {
        allowPersonalPrivate: true,
        organizationIds: [],
      },
      name: "findReviewedAnswers",
      userId: null,
    });

    expect(response.isError).toBe(true);
    expect(responseBody(response)).toEqual({
      error: "findReviewedAnswers requires an identified user",
    });
    expect(mocks.findReviewedAnswers).not.toHaveBeenCalled();
  });

  it.each([
    [
      "findReviewedAnswers",
      {
        subject: { personId: "person_1" },
        question: "What is your annual budget?",
        contextTags: ["funding"],
      },
    ],
    [
      "prepareFormResponses",
      {
        formTaskId: "task_1",
        subject: { organizationId: "organization_1" },
        questions: [{ fieldKey: "budget", prompt: "Annual budget?" }],
        idempotencyKey: "prepare_1",
      },
    ],
    [
      "proposeFormSubmission",
      {
        formTaskId: "task_1",
        destination: "https://example.org/apply",
        responses: [
          {
            fieldKey: "budget",
            prompt: "Annual budget?",
            answerRevisionId: "revision_1",
          },
        ],
        idempotencyKey: "submit_1",
        taskExecutionAttemptId: "attempt_1",
      },
    ],
  ] as const)("forwards %s arguments and actor", async (name, args) => {
    const service = mocks[name];
    service.mockResolvedValue({ tool: name, ok: true });

    const response = await handleFormResponseToolCall({
      args,
      clientAccessBoundary: {
        allowPersonalPrivate: false,
        organizationIds: ["organization_1"],
      },
      name: name as FormResponseToolName,
      userId: "user_1",
    });

    expect(response.isError).not.toBe(true);
    expect(responseBody(response)).toEqual({ tool: name, ok: true });
    expect(service).toHaveBeenCalledWith(args, "user_1", {
      clientAccessBoundary: {
        allowPersonalPrivate: false,
        organizationIds: ["organization_1"],
      },
    });
  });
});
