/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  EosScenarioExplorer,
  formatScenarioMoney,
} from "./EosScenarioExplorer";

describe("EosScenarioExplorer", () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: PropertyDescriptor | undefined;
  let previousReact: PropertyDescriptor | undefined;

  function restoreGlobalProperty(
    key: "IS_REACT_ACT_ENVIRONMENT" | "React",
    descriptor: PropertyDescriptor | undefined,
  ) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }

  beforeEach(() => {
    previousActEnvironment = Object.getOwnPropertyDescriptor(
      globalThis,
      "IS_REACT_ACT_ENVIRONMENT",
    );
    previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
      configurable: true,
      writable: true,
      value: true,
    });
    Object.defineProperty(globalThis, "React", {
      configurable: true,
      writable: true,
      value: React,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    try {
      await act(async () => {
        root.unmount();
      });
    } finally {
      container.remove();
      restoreGlobalProperty("IS_REACT_ACT_ENVIRONMENT", previousActEnvironment);
      restoreGlobalProperty("React", previousReact);
    }
  });

  it("promotes rounded values to the next compact unit", () => {
    expect(formatScenarioMoney(999_950)).toBe("$1M");
    expect(formatScenarioMoney(999_999)).toBe("$1M");
    expect(formatScenarioMoney(-999_950)).toBe("-$1M");
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
