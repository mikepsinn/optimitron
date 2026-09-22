import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ballot: vi.fn() }));
vi.mock("@/lib/court-jury-voting.server", () => ({
  getPublicCourtVotingReferendum: mocks.ballot,
}));
vi.mock("@/lib/auth-utils", () => ({ getSessionUserId: async () => null }));
vi.mock("@/components/layout", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("./jury-vote", () => ({ JuryVote: () => null }));

import JuryBallotPage from "./page";

const bodyMarkdown = [
  "## The evidence",
  "",
  "The case requests **public accountability**.",
  "",
  "- Publish the findings.",
  "- [Read the source](https://example.org/evidence).",
  "",
  '<script>alert("unsafe")</script>',
  "",
  "[Unsafe link](javascript:alert%281%29)",
].join("\n");

beforeEach(() => {
  mocks.ballot.mockResolvedValue({
    id: "jury-1",
    title: "Public spending accountability",
    description: "A public jury vote.",
    question: "Should governments publish the evidence?",
    status: "ACTIVE",
    bodyMarkdown,
  });
});

describe("Court ballot body", () => {
  it("renders the published Markdown evidence without executing raw HTML or unsafe links", async () => {
    const html = renderToStaticMarkup(await JuryBallotPage({
      params: Promise.resolve({ slug: "court-visual-jury-verdict" }),
      searchParams: Promise.resolve({}),
    }));
    expect(html).toMatch(/<h2[^>]*>The evidence<\/h2>/);
    expect(html).toContain("<strong>public accountability</strong>");
    expect(html).toContain("<li>Publish the findings.</li>");
    expect(html).toContain('href="https://example.org/evidence"');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
  });
});
