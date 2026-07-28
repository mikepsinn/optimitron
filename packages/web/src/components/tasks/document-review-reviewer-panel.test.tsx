/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentReviewPanelData } from "@/lib/tasks/document-review.server";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/components/markdown/rich-markdown", () => ({
  RichMarkdown: ({ markdown }: { markdown: string }) => (
    <div data-testid="document-body">{markdown}</div>
  ),
}));

vi.mock("@/components/ui/integrity-proof", () => ({
  IntegrityProof: () => <div data-testid="integrity-proof" />,
}));

vi.mock("@/components/documents/document-review-annotated-diff", () => ({
  DocumentReviewAnnotatedDiff: () => <div data-testid="annotated-diff" />,
}));

vi.mock("@/components/documents/document-revision-diff", () => ({
  DocumentRevisionDiff: () => <div data-testid="revision-diff" />,
}));

import { DocumentReviewReviewerPanel } from "./document-review-reviewer-panel";

type ReviewerPanel = Extract<DocumentReviewPanelData, { mode: "REVIEWER" }>;

function panelFixture(
  checklist: ReviewerPanel["review"]["request"]["checklist"] = [],
): ReviewerPanel {
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
      completed: false,
      proposal: null,
      request: {
        authorityTaskId: "authority-task",
        checklist,
        instructions: "Check the claims and leave specific feedback.",
        requestedAt: "2026-07-27T12:00:00.000Z",
        requestedByUserId: "manager-user",
        required: true,
        schema: "optimitron.review-request.v1",
        target,
      },
      required: true,
      response: null,
      reviewTaskId: "review-task",
      reviewer: {
        displayName: "Ada Reviewer",
        email: "ada@example.com",
        id: "reviewer-person",
      },
      state: "AWAITING_RESPONSE",
      target: {
        ...target,
        body: "# Operating agreement\n\nExact pinned text.",
        stale: false,
        title: "Operating agreement",
      },
      verification: null,
    },
  };
}

function findButton(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label,
  );
}

function okResponse() {
  return Promise.resolve(
    new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
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
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("leads with the pinned document, comments, and two clear decisions", async () => {
    await act(async () => {
      root.render(
        <DocumentReviewReviewerPanel
          panel={panelFixture([
            {
              criterion: "The claims are supported",
              id: "claims",
              required: true,
            },
            {
              criterion: "The wording could be shorter",
              id: "wording",
              required: false,
            },
          ])}
        />,
      );
    });

    expect(container.querySelector("nav")).toBeNull();
    expect(container.textContent).toContain("Exact pinned text.");
    expect(container.textContent).toContain(
      "Votes rank useful comments; they do not approve this version.",
    );
    expect(container.textContent).toContain(
      "Approving confirms every required criterion listed above passes.",
    );
    expect(container.textContent).toContain(
      "The claims are supported (required)",
    );
    expect(findButton(container, "Approve this version")).toBeDefined();
    expect(findButton(container, "Request changes")).toBeDefined();

    const criteria = Array.from(container.querySelectorAll("details")).find(
      (details) =>
        details
          .querySelector("summary")
          ?.textContent?.includes("Record criterion details"),
    );
    const proposal = Array.from(container.querySelectorAll("details")).find(
      (details) =>
        details
          .querySelector("summary")
          ?.textContent?.includes("propose a full revision"),
    );
    const proof = Array.from(container.querySelectorAll("details")).find(
      (details) =>
        details
          .querySelector("summary")
          ?.textContent?.includes("technical proof"),
    );
    expect(criteria?.open).toBe(false);
    expect(proposal?.open).toBe(false);
    expect(proof?.open).toBe(false);
  });

  it("records one-click approval without certifying optional criteria", async () => {
    fetchMock.mockImplementation(okResponse);
    await act(async () => {
      root.render(
        <DocumentReviewReviewerPanel
          panel={panelFixture([
            {
              criterion: "The claims are supported",
              id: "claims",
              required: true,
            },
            {
              criterion: "The wording could be shorter",
              id: "wording",
              required: false,
            },
          ])}
        />,
      );
    });

    await act(async () => {
      Simulate.click(findButton(container, "Approve this version")!);
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      checklistResponses: [{ criterionId: "claims", result: "PASS" }],
      explanation: "Approved as written.",
      verdict: "APPROVE",
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("requests changes with one explained comment and optional criteria", async () => {
    fetchMock.mockImplementation(okResponse);
    await act(async () => {
      root.render(
        <DocumentReviewReviewerPanel
          panel={panelFixture([
            {
              criterion: "The claims are supported",
              id: "claims",
              required: true,
            },
          ])}
        />,
      );
    });

    await act(async () => {
      Simulate.click(findButton(container, "Request changes")!);
    });
    const criteria = Array.from(container.querySelectorAll("details")).find(
      (details) =>
        details
          .querySelector("summary")
          ?.textContent?.includes("Record criterion details"),
    );
    expect(criteria?.open).toBe(false);

    const explanation = container.querySelector<HTMLTextAreaElement>(
      "#review-decision textarea[required]",
    );
    expect(explanation).not.toBeNull();
    await act(async () => {
      Simulate.change(explanation!, {
        target: {
          value: "Cite the source for the central claim.",
        } as EventTarget & { value: string },
      });
    });
    await act(async () => {
      Simulate.submit(container.querySelector("#review-decision form")!);
    });

    expect(
      container.querySelector('[role="alert"]')?.textContent,
    ).toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/tasks/review-task/comments",
    );
    const commentRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(commentRequest.body))).toEqual({
      message: "Cite the source for the central claim.",
    });
    const reviewRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(reviewRequest.body))).toMatchObject({
      checklistResponses: [],
      explanation: "Cite the source for the central claim.",
      verdict: "CHANGES_REQUESTED",
    });
  });

  it("keeps stale discussion as context without offering a decision", async () => {
    const panel = panelFixture();
    panel.canSubmit = false;
    panel.review.state = "STALE";
    panel.review.target.stale = true;

    await act(async () => {
      root.render(<DocumentReviewReviewerPanel panel={panel} />);
    });

    expect(container.textContent).toContain("Past review");
    expect(container.textContent).toContain("Original review request");
    expect(container.textContent).toContain(
      "The document has since changed, so its decision is closed.",
    );
    expect(container.textContent).toContain(
      "You can still read and comment for context",
    );
    expect(findButton(container, "Approve this version")).toBeUndefined();
    expect(findButton(container, "Request changes")).toBeUndefined();
  });
});
