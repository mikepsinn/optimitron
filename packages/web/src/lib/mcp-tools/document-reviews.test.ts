import { describe, expect, it } from "vitest";

import {
  DOCUMENT_REVIEW_TOOL_DEFINITIONS,
  DOCUMENT_REVIEW_TOOL_SCOPES,
  isDocumentReviewToolName,
} from "./document-reviews";

describe("MCP document-review registry", () => {
  it("keeps definitions and scope registration in lockstep", () => {
    expect(
      DOCUMENT_REVIEW_TOOL_DEFINITIONS.map(({ name }) => name).sort(),
    ).toEqual(Object.keys(DOCUMENT_REVIEW_TOOL_SCOPES).sort());
  });

  it("does not register the obsolete createDocumentProposal surface", () => {
    const toolNames = new Set<string>(
      DOCUMENT_REVIEW_TOOL_DEFINITIONS.map(({ name }) => name),
    );
    expect(isDocumentReviewToolName("createDocumentProposal")).toBe(false);
    expect(toolNames.has("createDocumentProposal")).toBe(false);
  });

  it("advertises the two strict proposal-application routes", () => {
    const definition = DOCUMENT_REVIEW_TOOL_DEFINITIONS.find(
      (tool) => tool.name === "applyDocumentProposal",
    );
    expect(definition?.inputSchema).toMatchObject({
      additionalProperties: false,
      oneOf: [
        {
          required: ["reviewTaskId"],
          not: {
            anyOf: [
              { required: ["baseDocumentRevisionId"] },
              { required: ["proposalDocumentRevisionId"] },
              { required: ["sourceCommentIds"] },
              { required: ["summary"] },
            ],
          },
        },
        {
          required: [
            "baseDocumentRevisionId",
            "proposalDocumentRevisionId",
            "sourceCommentIds",
            "summary",
          ],
          not: { required: ["reviewTaskId"] },
        },
      ],
    });
  });
});
