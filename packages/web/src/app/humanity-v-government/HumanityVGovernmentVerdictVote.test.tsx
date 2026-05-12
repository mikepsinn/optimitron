/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanityVGovernmentVerdictVote } from "./HumanityVGovernmentVerdictVote";

const sessionMock = vi.hoisted(() => ({
  status: "authenticated" as "authenticated" | "unauthenticated" | "loading",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionMock.status }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: () => <div data-testid="auth-form" />,
}));

describe("HumanityVGovernmentVerdictVote", () => {
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

  it("records a Humanity verdict vote through the referendum vote API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ vote: { answer: "YES" } }),
    } as Response);

    await act(async () => {
      root.render(
        <HumanityVGovernmentVerdictVote
          abstainCount={0}
          existingAnswer={null}
          fullDamagesLabel="$2.74 million"
          noCount={0}
          question="Should governments owe full damages?"
          referendumSlug="court-humanity-v-government-verdict"
          yesCount={0}
        />,
      );
    });

    const yesButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Find for Humanity"),
    );
    expect(yesButton).toBeDefined();

    await act(async () => {
      Simulate.click(yesButton!);
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/referendums/court-humanity-v-government-verdict/vote",
      expect.objectContaining({
        body: expect.stringContaining('"answer":"YES"'),
        method: "POST",
      }),
    );
    expect(container.textContent).toContain("Verdict recorded");
    expect(container.textContent).toContain("Find for Humanity");
  });

  it("asks unauthenticated voters to verify before recording the verdict", async () => {
    sessionMock.status = "unauthenticated";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await act(async () => {
      root.render(
        <HumanityVGovernmentVerdictVote
          abstainCount={0}
          existingAnswer={null}
          fullDamagesLabel="$2.74 million"
          noCount={0}
          question="Should governments owe full damages?"
          referendumSlug="court-humanity-v-government-verdict"
          yesCount={0}
        />,
      );
    });

    const noButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Find for Governments"),
    );
    expect(noButton).toBeDefined();

    await act(async () => {
      Simulate.click(noButton!);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Finish your verdict");
    expect(container.textContent).toContain("Find for Governments");
  });
});
