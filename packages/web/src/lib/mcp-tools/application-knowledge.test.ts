import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReusableAnswers: vi.fn(),
  prepareApplicationQuestions: vi.fn(),
  proposeApplicationSubmission: vi.fn(),
}));

vi.mock("../application-knowledge.server", () => mocks);

import {
  handleApplicationKnowledgeToolCall,
  type ApplicationKnowledgeToolName,
} from "./application-knowledge";

function responseBody(
  response: Awaited<ReturnType<typeof handleApplicationKnowledgeToolCall>>,
) {
  return JSON.parse(response.content[0]?.text ?? "{}") as Record<
    string,
    unknown
  >;
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("MCP application knowledge tools", () => {
  it("requires an identified user", async () => {
    const response = await handleApplicationKnowledgeToolCall({
      args: {},
      clientAccessBoundary: {
        allowPersonalPrivate: true,
        organizationIds: [],
      },
      name: "findReusableAnswers",
      userId: null,
    });

    expect(response.isError).toBe(true);
    expect(responseBody(response)).toEqual({
      error: "findReusableAnswers requires an identified user",
    });
    expect(mocks.findReusableAnswers).not.toHaveBeenCalled();
  });

  it.each([
    [
      "findReusableAnswers",
      {
        subject: { personId: "person_1" },
        question: "What is your annual budget?",
        contextTags: ["funding"],
      },
    ],
    [
      "prepareApplicationQuestions",
      {
        applicationTaskId: "task_1",
        subject: { organizationId: "organization_1" },
        questions: [{ key: "budget", prompt: "Annual budget?" }],
        idempotencyKey: "prepare_1",
      },
    ],
    [
      "proposeApplicationSubmission",
      {
        applicationTaskId: "task_1",
        destination: "https://example.org/apply",
        answers: [
          {
            key: "budget",
            prompt: "Annual budget?",
            answerRevisionId: "revision_1",
          },
        ],
        idempotencyKey: "submit_1",
      },
    ],
  ] as const)("forwards %s arguments and actor", async (name, args) => {
    const service = mocks[name];
    service.mockResolvedValue({ tool: name, ok: true });

    const response = await handleApplicationKnowledgeToolCall({
      args,
      clientAccessBoundary: {
        allowPersonalPrivate: false,
        organizationIds: ["organization_1"],
      },
      name: name as ApplicationKnowledgeToolName,
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
