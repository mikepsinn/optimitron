/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createReferralInvitationRequest: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  writeText: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/referral-invitation-client", () => ({
  createReferralInvitationRequest: mocks.createReferralInvitationRequest,
}));

import { DashboardShareCard } from "./DashboardShareCard";

describe("DashboardShareCard", () => {
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

    vi.useFakeTimers();
    mocks.createReferralInvitationRequest.mockReset();
    mocks.createReferralInvitationRequest.mockResolvedValue({
      id: "invite_1",
      inviteToken: "token_123",
      recipientEmail: "ada@example.org",
      recipientName: "Ada Lovelace",
    });
    mocks.fetch.mockReset();
    mocks.fetch.mockResolvedValue({ ok: true });
    mocks.refresh.mockReset();
    mocks.writeText.mockReset();
    mocks.writeText.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", mocks.fetch);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: mocks.writeText },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
    container.remove();
  });

  it("creates a tracked employee task and copies the invite-link message", async () => {
    const referralUrl = "https://warondisease.org/vote/mike";

    await act(async () => {
      root.render(
        <DashboardShareCard referralUrl={referralUrl} showAssignmentForm />,
      );
    });

    const firstName = container.querySelector<HTMLInputElement>(
      'input[name="employeeFirstName"]',
    );
    const lastName = container.querySelector<HTMLInputElement>(
      'input[name="employeeLastName"]',
    );
    const email = container.querySelector<HTMLInputElement>(
      'input[name="employeeEmail"]',
    );
    expect(firstName).not.toBeNull();
    expect(lastName).not.toBeNull();
    expect(email).not.toBeNull();

    await act(async () => {
      Simulate.change(firstName!, { target: { value: "Ada" } } as never);
      Simulate.change(lastName!, { target: { value: "Lovelace" } } as never);
      Simulate.change(email!, { target: { value: "ada@example.org" } } as never);
    });

    await act(async () => {
      Simulate.submit(container.querySelector("form")!);
    });

    expect(mocks.createReferralInvitationRequest).toHaveBeenCalledWith({
      contactMethod: "COPY",
      messageFormat: "SINCERE",
      messageText: expect.stringContaining(referralUrl),
      recipientEmail: "ada@example.org",
      recipientName: "Ada Lovelace",
    });
    expect(mocks.writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://warondisease.org/vote/mike?invite=token_123",
      ),
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });
  });
});
