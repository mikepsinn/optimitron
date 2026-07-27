import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TaskCommentFeed } from "./task-comment-feed";

function comment({
  createdAt,
  id,
  message,
  parentCommentId,
}: {
  createdAt: string;
  id: string;
  message: string;
  parentCommentId: string | null;
}) {
  return {
    attachments: [],
    authorUser: {
      email: null,
      id: `author-${id}`,
      person: {
        displayName: `Author ${id}`,
        handle: `author-${id}`,
        id: `person-${id}`,
        image: null,
      },
    },
    authorUserId: `author-${id}`,
    citationsJson: null,
    createdAt,
    deletedAt: null,
    downvoteCount: 0,
    editedAt: null,
    hiddenByCurator: false,
    id,
    mediaUrl: null,
    message,
    parentCommentId,
    path: id,
    replyCount: 0,
    taskId: "task-1",
    upvoteCount: 0,
    viewerVote: 0 as const,
    voteScore: 0,
  };
}

describe("TaskCommentFeed", () => {
  it("renders replies at arbitrary depth in chronological sibling order", () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;

    const comments = [
      comment({
        createdAt: "2026-01-01T00:04:00.000Z",
        id: "reply-later",
        message: "reply-later-marker",
        parentCommentId: "root",
      }),
      comment({
        createdAt: "2026-01-01T00:06:00.000Z",
        id: "great-grandchild",
        message: "great-grandchild-marker",
        parentCommentId: "grandchild-earlier",
      }),
      comment({
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "root",
        message: "root-marker",
        parentCommentId: null,
      }),
      comment({
        createdAt: "2026-01-01T00:05:00.000Z",
        id: "grandchild-later",
        message: "grandchild-later-marker",
        parentCommentId: "reply-earlier",
      }),
      comment({
        createdAt: "2026-01-01T00:02:00.000Z",
        id: "reply-earlier",
        message: "reply-earlier-marker",
        parentCommentId: "root",
      }),
      comment({
        createdAt: "2026-01-01T00:03:00.000Z",
        id: "grandchild-earlier",
        message: "grandchild-earlier-marker",
        parentCommentId: "reply-earlier",
      }),
    ];

    const html = renderToStaticMarkup(
      <TaskCommentFeed
        taskId="task-1"
        initialComments={comments}
        initialActivities={[]}
        currentUserId="viewer"
        currentUserIsAdmin={false}
        wishoniaUserId={null}
        signInHref="/api/auth/signin"
      />,
    );

    const expectedDepthFirstOrder = [
      "root-marker",
      "reply-earlier-marker",
      "grandchild-earlier-marker",
      "great-grandchild-marker",
      "grandchild-later-marker",
      "reply-later-marker",
    ];
    for (const [index, marker] of expectedDepthFirstOrder.entries()) {
      expect(html).toContain(marker);
      if (index > 0) {
        expect(html.indexOf(expectedDepthFirstOrder[index - 1]!)).toBeLessThan(
          html.indexOf(marker),
        );
      }
    }

    expect(html.match(/aria-label="Upvote"/g)).toHaveLength(comments.length);
    expect(html.match(/aria-label="Downvote"/g)).toHaveLength(comments.length);
    expect(html.match(/Reply<\/button>/g)).toHaveLength(comments.length);
  });

  it("shows exact-revision context without exposing technical identifiers", () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    const anchored = {
      ...comment({
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "anchored",
        message: "This authority clause needs a defined term.",
        parentCommentId: null,
      }),
      citationsJson: {
        documentAnchor: {
          schema: "optimitron.document-comment-anchor.v1",
          selector: {
            endLine: 12,
            endOffset: 78,
            exact: "The manager may act for the organization.",
            field: "BODY",
            startLine: 11,
            startOffset: 37,
          },
          target: {
            contentHash: "hidden-hash",
            documentId: "hidden-document-id",
            revisionId: "hidden-revision-id",
            version: 2,
          },
        },
      },
    };

    const html = renderToStaticMarkup(
      <TaskCommentFeed
        taskId="task-1"
        initialComments={[anchored]}
        initialActivities={[]}
        currentUserId="viewer"
        currentUserIsAdmin={false}
        wishoniaUserId={null}
        signInHref="/api/auth/signin"
      />,
    );

    expect(html).toContain("Version 2 · line 11–12");
    expect(html).toContain("The manager may act for the organization.");
    expect(html).not.toContain("hidden-hash");
    expect(html).not.toContain("hidden-revision-id");
  });
});
