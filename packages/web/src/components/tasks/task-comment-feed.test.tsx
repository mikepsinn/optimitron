import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/markdown/rich-markdown", () => ({
  RichMarkdown: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}));

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
        heading="Discussion"
      />,
    );

    expect(html).toContain("Discussion");
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
  });
});
