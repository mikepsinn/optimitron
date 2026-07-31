/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentReviewManagerSetupData } from "@/lib/tasks/document-review-ui.server";
import type { DocumentReviewPanelData } from "@/lib/tasks/document-review.server";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

import { DocumentReviewManagerPanel } from "./document-review-manager-panel";

type ManagerPanel = Extract<DocumentReviewPanelData, { mode: "MANAGER" }>;

function fixtures(): {
  panel: ManagerPanel;
  setup: DocumentReviewManagerSetupData;
} {
  const target = {
    contentHash: "sha256:reviewed-version",
    documentId: "document-1",
    revisionId: "revision-2",
    version: 2,
  };
  return {
    panel: {
      authorityTaskId: "authority-task",
      decisions: [],
      mode: "MANAGER",
      proposals: [
        {
          artifactId: "proposal-artifact",
          base: target,
          baseStale: false,
          proposed: {
            ...target,
            body: "Proposed exact text",
            contentHash: "sha256:proposal",
            documentId: "proposal-document",
            revisionId: "proposal-revision",
            title: "Revised operating agreement",
            version: 1,
          },
          sourceComments: [
            {
              commentId: "comment-1",
              contentHash: "sha256:comment",
              taskId: "authority-task",
            },
          ],
          summary: "Clarifies who may approve financing.",
        },
      ],
      reviews: [
        {
          request: {
            authorityTaskId: "authority-task",
            instructions: "Check the authority and conflicts provisions.",
            requestedAt: "2026-07-27T12:00:00.000Z",
            requestedByUserId: "manager-user",
            schema: "optimitron.review-request.v1",
            target,
          },
          response: {
            artifactId: "review-artifact",
            comment: { contentHash: "sha256:comment", id: "comment-1" },
            explanation: "The revision is ready to adopt.",
            reviewerPersonId: "reviewer-person",
            reviewerUserId: "reviewer-user",
            reviewTaskId: "review-task",
            schema: "optimitron.review-response.v1",
            submittedAt: "2026-07-27T13:00:00.000Z",
            target,
            verdict: "APPROVE",
          },
          reviewTaskId: "review-task",
          reviewer: {
            displayName: "Ada Reviewer",
            id: "reviewer-person",
          },
          state: "APPROVED",
          target: {
            ...target,
            body: "Exact text",
            stale: false,
            title: "Operating agreement",
          },
        },
      ],
    },
    setup: {
      documents: [
        {
          ...target,
          revisionId: target.revisionId,
          title: "Operating agreement",
        },
      ],
    },
  };
}

function findButton(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label,
  );
}

describe("DocumentReviewManagerPanel", () => {
  let container: HTMLDivElement;
  let fetchMock: ReturnType<typeof vi.fn>;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
        React: typeof React;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    mocks.refresh.mockReset();
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "decision-key" });
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("shows the compact review and internal decision controls", async () => {
    const { panel, setup } = fixtures();
    await act(async () => {
      root.render(<DocumentReviewManagerPanel panel={panel} setup={setup} />);
    });

    expect(container.textContent).toContain("Get an independent review");
    expect(container.textContent).toContain("Proposed changes");
    expect(findButton(container, "Create version 3")).toBeDefined();
    expect(container.textContent).toContain("Ada Reviewer");
    expect(
      findButton(container, "Use version 2 as working text"),
    ).toBeDefined();
    expect(findButton(container, "Reject version")).toBeDefined();
    expect(container.textContent).not.toContain("Waiver");
    expect(container.textContent).not.toContain("Invitation batch");
  });

  it("applies the exact proposal artifact", async () => {
    const { panel, setup } = fixtures();
    await act(async () => {
      root.render(<DocumentReviewManagerPanel panel={panel} setup={setup} />);
    });
    await act(async () => {
      Simulate.click(findButton(container, "Create version 3")!);
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/tasks/authority-task/document-reviews/proposal",
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("PATCH");
    expect(JSON.parse(String(request.body))).toEqual({
      proposalArtifactId: "proposal-artifact",
    });
  });

  it("does not write or refresh when version creation is cancelled", async () => {
    const { panel, setup } = fixtures();
    vi.mocked(confirm).mockReturnValueOnce(false);
    await act(async () => {
      root.render(<DocumentReviewManagerPanel panel={panel} setup={setup} />);
    });
    await act(async () => {
      Simulate.click(findButton(container, "Create version 3")!);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(findButton(container, "Create version 3")?.disabled).toBe(false);
  });

  it("records adoption against the exact approval artifact", async () => {
    const { panel, setup } = fixtures();
    await act(async () => {
      root.render(<DocumentReviewManagerPanel panel={panel} setup={setup} />);
    });
    await act(async () => {
      Simulate.click(findButton(container, "Use version 2 as working text")!);
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      action: "ADOPT",
      documentRevisionId: "revision-2",
      reviewArtifactId: "review-artifact",
    });
  });
});
