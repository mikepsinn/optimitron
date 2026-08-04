/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EosScenarioExplorer } from "./EosScenarioExplorer";

describe("EosScenarioExplorer", () => {
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

  it("recalculates the visitor's number when they choose another Earth", async () => {
    await act(async () => {
      root.render(<EosScenarioExplorer />);
    });

    const fullOptimizationButton = Array.from(
      container.querySelectorAll("button"),
    ).find((button) => button.textContent?.includes("Full optimization"));

    expect(fullOptimizationButton).toBeDefined();
    expect(fullOptimizationButton?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => {
      fullOptimizationButton?.click();
    });

    expect(fullOptimizationButton?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain("$5.7M");
    expect(container.textContent).toContain("not a Class B price forecast");
  });
});
