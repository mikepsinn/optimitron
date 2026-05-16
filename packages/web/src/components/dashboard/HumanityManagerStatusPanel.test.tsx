/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HumanityManagerStatusInput } from "@/lib/humanity-manager-status-content";

const mocks = vi.hoisted(() => ({
  copyTextToClipboard: vi.fn(),
}));

vi.mock("@/lib/clipboard", () => ({
  copyTextToClipboard: mocks.copyTextToClipboard,
}));

import { HumanityManagerStatusPanel } from "./HumanityManagerStatusPanel";

const STATUS_FIXTURE: HumanityManagerStatusInput = {
  completedEmployees: [
    { completedAt: "2026-05-02", displayName: "Ada Lovelace" },
  ],
  directConversionCount: 2,
  downstreamConversionCount: 7,
  overdueEmployeeCount: 1,
  overdueEmployees: [{ displayName: "Jake Smith" }],
  overduePresidentCount: 1,
  overduePresidents: [
    { countryLabel: "Example Republic", displayName: "President Example" },
  ],
  reminders: [
    {
      id: "employee-invite_1",
      label: "Jake Smith",
      message: "Jake, vote here: https://warondisease.org/vote/mike?invite=invite_1",
      recipientMode: "one_human",
      title: "Employee reminder",
    },
  ],
};

describe("HumanityManagerStatusPanel", () => {
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
    mocks.copyTextToClipboard.mockReset();
    mocks.copyTextToClipboard.mockResolvedValue(undefined);
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

  it("copies the rendered reminder text from the dashboard panel", async () => {
    await act(async () => {
      root.render(<HumanityManagerStatusPanel status={STATUS_FIXTURE} />);
    });

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent === "Copy",
    );
    expect(button).toBeDefined();

    await act(async () => {
      Simulate.click(button!);
    });

    expect(mocks.copyTextToClipboard).toHaveBeenCalledWith(
      STATUS_FIXTURE.reminders[0]?.message,
    );
  });
});
