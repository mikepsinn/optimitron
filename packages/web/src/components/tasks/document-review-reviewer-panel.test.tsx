/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentReviewPanelData } from "@/lib/tasks/document-review.server";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/components/markdown/rich-markdown", () => ({
  RichMarkdown: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}));

import { DocumentReviewReviewerPanel } from "./document-review-reviewer-panel";

type ReviewerPanel = Extract<DocumentReviewPanelData, { mode: "REVIEWER" }>;

function panelFixture(): ReviewerPanel {
  const target = {
    contentHash: "sha256:reviewed-version",
    documentId: "document-1",
    revisionId: "revision-2",
    version: 2,
  };
  return {
    authorityTaskId: "authority-task",
    canSubmit: true,
    mode: "REVIEWER",
    review: {
      request: {
        authorityTaskId: "authority-task",
        instructions: "Check the claims and leave specific feedback.",
        requestedAt: "2026-07-27T12:00:00.000Z",
        requestedByUserId: "manager-user",
        schema: "optimitron.review-request.v1",
        target,
      },
      response: null,
      reviewTaskId: "review-task",
      reviewer: {
        displayName: "Ada Reviewer",
        id: "reviewer-person",
      },
      state: "AWAITING_RESPONSE",
      target: {
        ...target,
        body: "# Operating agreement\n\nExact pinned text.",
        stale: false,
        title: "Operating agreement",
      },
    },
  };
}

function findButton(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label,
  );
}

describe("DocumentReviewReviewerPanel", () => {
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
    vi.stubGlobal("crypto", { randomUUID: () => "response-key" });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("leads with the pinned text and two common decisions", async () => {
    await act(async () => {
      root.render(<DocumentReviewReviewerPanel panel={panelFixture()} />);
    });

    expect(container.textContent).toContain("Exact pinned text.");
    expect(container.textContent).toContain(
      "Votes help sort discussion; they do not approve the document.",
    );
    expect(findButton(container, "Approve")).toBeDefined();
    expect(findButton(container, "Request changes")).toBeDefined();
    expect(container.textContent).not.toContain("Verify delivery");
    expect(container.textContent).not.toContain("Propose a revision");
  });

  it("submits change feedback and the verdict in one request", async () => {
    await act(async () => {
      root.render(<DocumentReviewReviewerPanel panel={panelFixture()} />);
    });
    const feedback = container.querySelector("textarea");
    expect(feedback).not.toBeNull();
    await act(async () => {
      Simulate.change(feedback!, {
        target: {
          value: "Cite the source for the central claim.",
        } as EventTarget & { value: string },
      });
    });
    await act(async () => {
      Simulate.click(findButton(container, "Request changes")!);
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({
      explanation: "Cite the source for the central claim.",
      verdict: "CHANGES_REQUESTED",
    });
  });

  it("keeps stale text readable without offering a new verdict", async () => {
    const panel = panelFixture();
    panel.canSubmit = false;
    panel.review.state = "STALE";
    panel.review.target.stale = true;

    await act(async () => {
      root.render(<DocumentReviewReviewerPanel panel={panel} />);
    });

    expect(container.textContent).toContain("Past review");
    expect(container.textContent).toContain("Exact pinned text.");
    expect(findButton(container, "Approve")).toBeUndefined();
    expect(findButton(container, "Request changes")).toBeUndefined();
  });
});
