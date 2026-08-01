/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >(function MotionDiv({ children, ...props }, ref) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    );
  });

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    motion: {
      div: MotionDiv,
    },
  };
});

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/auth/AuthForm", () => ({
  AuthForm: () => <div data-testid="auth-form" />,
}));

vi.mock("@/components/landing/TreatyPostVoteShareFlow", () => ({
  TreatyPostVoteShareFlow: () => <div data-testid="share-flow" />,
}));

vi.mock("@/components/shared/ParameterValue", () => ({
  ParameterValue: ({ valueOverride }: { valueOverride?: string }) => (
    <span>{valueOverride ?? "parameter value"}</span>
  ),
}));

vi.mock("@/components/shared/ParameterTemplate", () => ({
  ParameterTemplate: ({ template }: { template: string }) => (
    <span>{template}</span>
  ),
}));

vi.mock("@/lib/analytics", () => ({
  trackSliderSubmitted: vi.fn(),
  trackTreatyFlowScreenAdvanced: vi.fn(),
  trackVoteSubmitted: vi.fn(),
}));

vi.mock("@/lib/referendum-vote-sync", () => ({
  syncPendingReferendumVotes: vi.fn(),
}));

import { TreatyVoteFlow } from "./TreatyVoteFlow";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

describe("TreatyVoteFlow", () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
        React: typeof React;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    vi.useFakeTimers();
    window.localStorage.clear();
    window.IntersectionObserver = TestIntersectionObserver;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("uses the requested heading level when embedded in a page", async () => {
    await act(async () => {
      root.render(
        <TreatyVoteFlow
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          respectStoredFlowVariant={false}
          sliderHeadingLevel="h2"
        />,
      );
    });

    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toContain(
      "PLEASE TAKE 30 SECONDS",
    );
  });

  it("scrolls the choice card to the top after the slider is submitted", async () => {
    await act(async () => {
      root.render(
        <TreatyVoteFlow
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          respectStoredFlowVariant={false}
        />,
      );
    });

    const slider = container.querySelector<HTMLInputElement>(
      'input[type="range"]',
    );
    expect(slider).not.toBeNull();

    await act(async () => {
      slider!.value = "70";
      Simulate.change(slider!);
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("SUBMIT"),
    );
    expect(submitButton).toBeDefined();

    scrollIntoView.mockClear();
    await act(async () => {
      Simulate.click(submitButton!);
    });

    expect(
      container.querySelector('[data-testid="treaty-vote-choice-card"]'),
    ).not.toBeNull();
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("centers the submit button after slider release", async () => {
    await act(async () => {
      root.render(
        <TreatyVoteFlow
          defaultFlowVariant={TREATY_FLOW_VARIANTS.voteFirstV1}
          respectStoredFlowVariant={false}
        />,
      );
    });

    const slider = container.querySelector<HTMLInputElement>(
      'input[type="range"]',
    );
    expect(slider).not.toBeNull();

    await act(async () => {
      slider!.value = "70";
      Simulate.change(slider!);
    });

    scrollIntoView.mockClear();
    await act(async () => {
      Simulate.pointerUp(slider!);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(75);
    });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
