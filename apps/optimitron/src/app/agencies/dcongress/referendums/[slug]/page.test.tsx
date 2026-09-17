import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  referendum: vi.fn(),
  getCurrentUser: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { referendum: { findUnique: mocks.referendum } },
}));
vi.mock("@/lib/auth-utils", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/components/referendum/ReferendumVoteSection", () => ({
  ReferendumVoteSection: () => null,
}));
vi.mock("@/components/referendum/reader-markdown-components", () => ({
  readerMarkdownComponents: {},
}));
vi.mock("@/components/site/ReferendumSiteInlineSign", () => ({
  ReferendumSiteInlineSign: () => null,
}));
vi.mock("@/components/treaty/TreatyNameSignatureBox", () => ({
  TreatyNameSignatureBox: () => null,
}));
import ReferendumPage, { generateMetadata } from "./page";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.referendum.mockResolvedValue({
    kind: "COURT_CASE",
    title: "Private case title",
    question: "Private question",
    description: "Private description",
  });
});
describe("Court ballot host cutover", () => {
  it("redirects generic Court ballots with referral attribution before loading host voting state", async () => {
    await expect(
      ReferendumPage({
        params: Promise.resolve({ slug: "court-visual-jury-verdict" }),
        searchParams: Promise.resolve({ ref: "friend code" }),
      }),
    ).rejects.toThrow(
      "redirect:https://courtofhumanity.org/referendums/court-visual-jury-verdict?ref=friend+code",
    );
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });
  it("does not expose a Court ballot's details in retired host metadata", async () => {
    expect(
      await generateMetadata({
        params: Promise.resolve({ slug: "court-visual-jury-verdict" }),
        searchParams: Promise.resolve({}),
      }),
    ).toEqual({ title: "Jury ballot | Court of Humanity" });
  });
});
