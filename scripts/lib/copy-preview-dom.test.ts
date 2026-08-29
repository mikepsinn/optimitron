import assert from "node:assert/strict";
import test from "node:test";

import { extractVisibleCopyMarkdown } from "./copy-preview-dom";

class FakeTextNode {
  readonly nodeType = 3;

  constructor(readonly textContent: string) {}
}

class FakeElement {
  readonly nodeType = 1;
  readonly className = "";
  readonly attributes = new Map<string, string>();
  readonly childNodes: Array<FakeElement | FakeTextNode>;
  parentElement: FakeElement | null = null;

  constructor(
    readonly tagName: string,
    ...children: Array<FakeElement | FakeTextNode>
  ) {
    this.tagName = tagName.toUpperCase();
    this.childNodes = children;
    for (const child of children) {
      if (child instanceof FakeElement) child.parentElement = this;
    }
  }

  get children(): FakeElement[] {
    return this.childNodes.filter(
      (child): child is FakeElement => child instanceof FakeElement,
    );
  }

  get innerText(): string {
    return this.childNodes
      .map((child) =>
        child instanceof FakeElement ? child.innerText : child.textContent,
      )
      .join("");
  }

  get textContent(): string {
    return this.innerText;
  }

  closest(selector: string): FakeElement | null {
    const tagName = selector.toUpperCase();
    let current: FakeElement | null = this;
    while (current) {
      if (current.tagName === tagName) return current;
      current = current.parentElement;
    }
    return null;
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  querySelectorAll(selector: string): FakeElement[] {
    const attribute = selector.match(/^\[([^\]]+)\]$/)?.[1];
    const tags = new Set(
      selector
        .split(",")
        .map((tag) => tag.trim().toUpperCase())
        .filter(Boolean),
    );
    const matches: FakeElement[] = [];
    const visit = (element: FakeElement) => {
      for (const child of element.children) {
        if (
          (attribute && child.hasAttribute(attribute)) ||
          (!attribute && tags.has(child.tagName))
        ) {
          matches.push(child);
        }
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  replaceChildren(...children: Array<FakeElement | FakeTextNode>): void {
    this.childNodes.splice(0, this.childNodes.length, ...children);
  }
}

const text = (value: string) => new FakeTextNode(value);
const element = (
  tagName: string,
  ...children: Array<FakeElement | FakeTextNode>
) => new FakeElement(tagName, ...children);

function extractFrom(root: FakeElement): string {
  const globals = globalThis as Record<string, unknown>;
  const previous = {
    document: globals.document,
    getComputedStyle: globals.getComputedStyle,
    window: globals.window,
  };
  globals.window = {};
  globals.document = {
    body: root,
    querySelector: (selector: string) => (selector === "main" ? root : null),
  };
  globals.getComputedStyle = () => ({
    display: "block",
    textTransform: "none",
    visibility: "visible",
  });
  try {
    return extractVisibleCopyMarkdown();
  } finally {
    globals.document = previous.document;
    globals.getComputedStyle = previous.getComputedStyle;
    globals.window = previous.window;
  }
}

test("renders a standalone pre element as a fenced block", () => {
  const markdown = extractFrom(element("main", element("pre", text("alpha"))));

  assert.equal(markdown, "```text\nalpha\n```\n");
});

test("renders nested pre elements once as standalone fenced blocks", () => {
  const markdown = extractFrom(
    element(
      "main",
      element(
        "li",
        text("Instruction"),
        element("pre", text("list-code")),
        text("After"),
      ),
      element("blockquote", element("pre", text("quote-code"))),
      element(
        "table",
        element("tr", element("td", element("pre", text("cell-code")))),
      ),
    ),
  );

  assert.match(markdown, /- Instruction\n\n```text\nlist-code\n```\n\nAfter/);
  assert.doesNotMatch(markdown, /- ```text/);
  for (const value of ["list-code", "quote-code", "cell-code"]) {
    assert.equal(markdown.split(value).length - 1, 1);
    assert.match(markdown, new RegExp("```text\\n" + value + "\\n```"));
  }
});
