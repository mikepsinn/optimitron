/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const referendumConfigMocks = vi.hoisted(() => ({
  getReferendumConfig: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  getSignupReferral: vi.fn(),
  setSignupReferral: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("remark-gfm", () => ({
  default: () => null,
}));

vi.mock("@/config/referendums", () => ({
  getReferendumConfig: referendumConfigMocks.getReferendumConfig,
}));

vi.mock("@/components/referendum/ReferendumStepper", () => ({
  readerMarkdownComponents: {},
}));

vi.mock("@/components/site/ReferendumSiteInlineSign", () => ({
  ReferendumSiteInlineSign: () => null,
}));

vi.mock("@/lib/storage", () => ({
  storage: storageMocks,
}));

import { TreatyContent } from "./TreatyContent";

describe("TreatyContent", () => {
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
    vi.resetAllMocks();
    referendumConfigMocks.getReferendumConfig.mockReturnValue({
      introText: "Treaty intro",
      slides: ["Treaty body"],
    });
    storageMocks.getSignupReferral.mockReturnValue(null);
    window.history.replaceState({}, "", "/treaty");
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

  async function renderCourtHref() {
    await act(async () => {
      root.render(<TreatyContent />);
    });

    const courtLink = container.querySelector("a");
    return courtLink?.getAttribute("href");
  }

  it("carries the current referral code into the Court of Humanity link", async () => {
    window.history.replaceState({}, "", "/treaty?ref=url-ref");
    storageMocks.getSignupReferral.mockReturnValue("stored-ref");

    await expect(renderCourtHref()).resolves.toBe("/court?ref=url-ref");
    expect(storageMocks.setSignupReferral).toHaveBeenCalledWith("url-ref");
  });

  it("falls back to the stored signup referral in the Court of Humanity link", async () => {
    storageMocks.getSignupReferral.mockReturnValue("stored-ref");

    await expect(renderCourtHref()).resolves.toBe("/court?ref=stored-ref");
  });
});
