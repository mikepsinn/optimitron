/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENDUM_ANSWER } from "@/config/referendums";
import { ReferendumSignatureBox } from "./ReferendumSignatureBox";

const sessionMock = vi.hoisted(() => ({
  status: "authenticated" as "authenticated" | "unauthenticated" | "loading",
  data: { user: { handle: "tester", referralCode: "ref_1" } } as {
    user: { handle: string; referralCode: string };
  } | null,
}));

const routerMock = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("@/components/referendum/ReferendumStepper", () => ({
  ReferendumStepper: () => null,
  splitIntoSlides: (markdown: string) =>
    markdown.split(/\n\n+/).filter(Boolean),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: sessionMock.data,
    status: sessionMock.status,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: () => <div />,
}));

vi.mock("@/components/referendum/SecretChainPitch", () => ({
  SecretChainPitch: () => <div />,
}));

vi.mock("@/components/shared/ShareLinkButtons", () => ({
  ShareLinkButtons: () => <div />,
}));

vi.mock("@/lib/messaging", () => ({
  REFERRAL_SHARE_LABEL: "Share this link",
}));

vi.mock("@/lib/url", () => ({
  buildCourtReferralUrl: () => "https://example.org/court?ref=tester",
  buildUserReferralUrl: () => "https://example.org/ref",
}));

describe("ReferendumSignatureBox", () => {
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
    sessionMock.status = "authenticated";
    sessionMock.data = { user: { handle: "tester", referralCode: "ref_1" } };
    routerMock.replace.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("does not persist an authenticated vote locally when the API rejects it", async () => {
    const storePendingVote = vi.fn();
    const clearPendingVote = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Denied" }),
    } as Response);

    await act(async () => {
      root.render(
        <ReferendumSignatureBox
          referendumSlug="declaration"
          title="Vote"
          authPromptText="Verify"
          storePendingVote={storePendingVote}
          clearPendingVote={clearPendingVote}
          shareText="Share"
          emailSubject="Subject"
        />,
      );
    });

    const yesButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Yes",
    );
    expect(yesButton).toBeDefined();

    await act(async () => {
      Simulate.click(yesButton!);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/referendums/declaration/vote",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(storePendingVote).not.toHaveBeenCalled();
    expect(clearPendingVote).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Denied");
  });

  it("stores an unauthenticated vote so auth can sync it later", async () => {
    sessionMock.status = "unauthenticated";
    sessionMock.data = null;
    const storePendingVote = vi.fn();

    await act(async () => {
      root.render(
        <ReferendumSignatureBox
          referendumSlug="declaration"
          title="Vote"
          authPromptText="Verify"
          storePendingVote={storePendingVote}
          clearPendingVote={vi.fn()}
          shareText="Share"
          emailSubject="Subject"
        />,
      );
    });

    const noButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "No",
    );
    expect(noButton).toBeDefined();

    await act(async () => {
      Simulate.click(noButton!);
    });

    expect(storePendingVote).toHaveBeenCalledWith(
      undefined,
      REFERENDUM_ANSWER.NO,
      undefined,
    );
  });

  it("submits a private vote when the inline flow is not a public-signature surface", async () => {
    const storePendingVote = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await act(async () => {
      root.render(
        <ReferendumSignatureBox
          referendumSlug="court-of-humanity"
          title="Vote"
          authPromptText="Verify"
          storePendingVote={storePendingVote}
          clearPendingVote={vi.fn()}
          shareText="Share"
          emailSubject="Subject"
          publicVoteDefault={false}
        />,
      );
    });

    expect(
      container.textContent?.includes("Display my name publicly"),
    ).toBe(false);

    const yesButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Yes",
    );
    expect(yesButton).toBeDefined();

    await act(async () => {
      Simulate.click(yesButton!);
    });

    const voteBody = JSON.parse(
      String(vi.mocked(globalThis.fetch).mock.calls[0]?.[1]?.body),
    );
    expect(voteBody).toEqual(
      expect.objectContaining({
        answer: REFERENDUM_ANSWER.YES,
        makePublic: false,
      }),
    );
    expect(storePendingVote).toHaveBeenCalledWith(
      undefined,
      REFERENDUM_ANSWER.YES,
      false,
    );
  });
});
