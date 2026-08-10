/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getTaskDescriptionSummary, TaskDescription } from "./task-description";

describe("getTaskDescriptionSummary", () => {
  it("treats escaped line breaks as markdown paragraph boundaries", () => {
    expect(
      getTaskDescriptionSummary("# Heading\\n\\nFirst paragraph\\n\\n- Action"),
    ).toBe("First paragraph");
  });
});

describe("TaskDescription", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
        React: typeof React;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders escaped line breaks as markdown structure", async () => {
    await act(async () => {
      root.render(
        React.createElement(TaskDescription, {
          markdown: "Intro\\n\\n- First item",
        }),
      );
    });

    expect(container.textContent).toContain("Intro");
    expect(container.textContent).not.toContain("\\n");
    expect(
      Array.from(container.querySelectorAll("li")).map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(["First item"]);
  });

  it("links accessible bare task IDs without changing protected markdown", async () => {
    const accessibleId = "cautolinkpublic0000000000";
    const inaccessibleId = "cautolinkprivate000000000";

    await act(async () => {
      root.render(
        React.createElement(TaskDescription, {
          markdown: [
            `Read ${accessibleId} and keep ${inaccessibleId} private.`,
            `Inline code: \`${accessibleId}\`.`,
            `[Existing link](/tasks/${accessibleId}).`,
          ].join("\n\n"),
          taskReferences: [
            {
              href: `/tasks/${accessibleId}`,
              id: accessibleId,
              title: "Accessible task title",
            },
          ],
        }),
      );
    });

    expect(
      Array.from(container.querySelectorAll("a")).map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      })),
    ).toEqual([
      {
        href: `/tasks/${accessibleId}`,
        text: "Accessible task title",
      },
      {
        href: `/tasks/${accessibleId}`,
        text: "Existing link",
      },
    ]);
    expect(container.querySelector("code")?.textContent).toBe(accessibleId);
    expect(container.textContent).toContain(inaccessibleId);
  });
});
