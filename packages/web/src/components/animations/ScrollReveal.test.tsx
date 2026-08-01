// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "./ScrollReveal";

const hookState = vi.hoisted(() => ({
  hydrated: false,
  observedRef: null as { current: HTMLDivElement | null } | null,
  reducedMotion: false,
}));

vi.mock("@/lib/use-hydrated", () => ({
  useHydrated: () => hookState.hydrated,
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();

  return {
    ...actual,
    useInView: (ref: { current: HTMLDivElement | null }) => {
      hookState.observedRef = ref;
      return false;
    },
    useReducedMotion: () => hookState.reducedMotion,
  };
});

describe("ScrollReveal", () => {
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
    hookState.hydrated = false;
    hookState.observedRef = null;
    hookState.reducedMotion = false;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it.each([
    { hydrated: false, reducedMotion: false },
    { hydrated: true, reducedMotion: true },
  ])(
    "keeps the observer target mounted when hydrated=$hydrated and reducedMotion=$reducedMotion",
    async ({ hydrated, reducedMotion }) => {
      hookState.hydrated = hydrated;
      hookState.reducedMotion = reducedMotion;

      await act(async () => {
        root.render(<ScrollReveal>Visible content</ScrollReveal>);
      });

      expect(hookState.observedRef?.current).toBe(container.firstElementChild);
      expect(container.textContent).toBe("Visible content");
    },
  );
});
