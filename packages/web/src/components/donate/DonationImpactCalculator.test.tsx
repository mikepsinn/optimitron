/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/retroui/Dialog", () => {
  function Dialog({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  }
  Dialog.Content = function DialogContent({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div>{children}</div>;
  };
  return { Dialog };
});

import { DonationImpactCalculator } from "./DonationImpactCalculator";

describe("DonationImpactCalculator", () => {
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

  it("targets the visible derivation content from the calculation anchor", async () => {
    await act(async () => {
      root.render(<DonationImpactCalculator />);
    });

    const details = container.querySelector("details");
    expect(details?.getAttribute("id")).toBeNull();
    expect(
      container.querySelectorAll("#how-this-is-calculated"),
    ).toHaveLength(1);
    expect(
      container.querySelector("details #how-this-is-calculated"),
    ).not.toBeNull();
  });
});
