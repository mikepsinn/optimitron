/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REFERENDUM_ANSWER } from "@/config/referendums";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { DECLARATION_SLUG } from "@/lib/declaration";
import { TreatyNameSignatureBox } from "./TreatyNameSignatureBox";

const sessionMock = vi.hoisted(() => ({
  status: "unauthenticated" as "authenticated" | "unauthenticated" | "loading",
  data: null as { user: { handle?: string; referralCode?: string } } | null,
}));

const storageMocks = vi.hoisted(() => ({
  getSignupReferral: vi.fn(),
  setPendingDeclarationVote: vi.fn(),
  setDeclarationSigned: vi.fn(),
  setPendingCourtOfHumanityVote: vi.fn(),
  setPendingTreatyVote: vi.fn(),
}));

const authFormProps = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: sessionMock.data,
    status: sessionMock.status,
  }),
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: (props: Record<string, unknown>) => {
    authFormProps.current = props;
    return (
      <button
        type="button"
        onClick={() => {
          const beforeAuth = props.onBeforeAuth as (() => void) | undefined;
          beforeAuth?.();
        }}
      >
        Mock email auth
      </button>
    );
  },
}));

vi.mock("@/components/dashboard/DashboardShareCard", () => ({
  DashboardShareCard: () => <div />,
}));

vi.mock("@/lib/storage", () => ({
  storage: storageMocks,
}));

vi.mock("@/lib/url", () => ({
  buildCourtReferralUrl: () => "https://example.org/court",
  buildUserReferralUrl: () => "https://example.org/ref",
}));

vi.mock("@/lib/use-hydrated-now", () => ({
  useHydratedNow: () => new Date("2026-05-15T12:00:00.000Z"),
}));

describe("TreatyNameSignatureBox", () => {
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
    sessionMock.status = "unauthenticated";
    sessionMock.data = null;
    storageMocks.getSignupReferral.mockReturnValue("alice");
    storageMocks.setPendingDeclarationVote.mockReset();
    storageMocks.setDeclarationSigned.mockReset();
    storageMocks.setPendingCourtOfHumanityVote.mockReset();
    storageMocks.setPendingTreatyVote.mockReset();
    authFormProps.current = null;
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

  it("prompts a logged-out declaration signer to authenticate after signing", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          TreatyNameSignatureBox as React.ComponentType<
            Record<string, unknown>
          >,
          {
            authCallbackUrl: "/declaration",
            referendumSlug: DECLARATION_SLUG,
          },
        ),
      );
    });

    expect(container.textContent).not.toContain("Mock email auth");

    const nameInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Your name"]',
    );
    expect(nameInput).toBeDefined();
    await act(async () => {
      nameInput!.value = "Mike Sinn";
      Simulate.change(nameInput!);
    });

    const signButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Sign",
    );
    expect(signButton).toBeDefined();

    await act(async () => {
      Simulate.click(signButton!);
    });

    expect(storageMocks.setPendingDeclarationVote).toHaveBeenCalledWith({
      answer: REFERENDUM_ANSWER.YES,
      displayName: "Mike Sinn",
      makePublic: true,
      timestamp: expect.any(String),
    });
    expect(storageMocks.setDeclarationSigned).toHaveBeenCalledWith({
      signedAt: expect.any(String),
      name: "Mike Sinn",
    });
    expect(container.textContent).toContain("Mock email auth");
    expect(authFormProps.current).toMatchObject({
      callbackUrl: "/declaration",
      providers: { demo: false, email: true, google: false },
    });
  });

  it("stages a named public Court signature with the current referral", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          TreatyNameSignatureBox as React.ComponentType<
            Record<string, unknown>
          >,
          {
            authCallbackUrl: "/court",
            referralCode: "court-ref",
            referendumSlug: COURT_OF_HUMANITY_SLUG,
          },
        ),
      );
    });

    expect(container.textContent).not.toContain("Mock email auth");

    const nameInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Your name"]',
    );
    expect(nameInput).toBeDefined();
    await act(async () => {
      nameInput!.value = "Mike Sinn";
      Simulate.change(nameInput!);
    });

    const signButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Sign",
    );
    expect(signButton).toBeDefined();

    await act(async () => {
      Simulate.click(signButton!);
    });

    expect(storageMocks.setPendingCourtOfHumanityVote).toHaveBeenCalledWith({
      answer: REFERENDUM_ANSWER.YES,
      displayName: "Mike Sinn",
      makePublic: true,
      referredBy: "court-ref",
      timestamp: expect.any(String),
    });
    expect(container.textContent).toContain("Mock email auth");
    expect(authFormProps.current).toMatchObject({
      callbackUrl: "/court",
      providers: { demo: false, email: true, google: false },
    });
  });
});
