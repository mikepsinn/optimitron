import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RightToTrialImpactExplorer } from "@/components/impact/right-to-trial-impact-explorer";

describe("RightToTrialImpactExplorer", () => {
  it("updates the visible treatment timeline when the discovery rate changes", () => {
    render(<RightToTrialImpactExplorer />);

    fireEvent.change(screen.getByLabelText("Treatment discovery"), {
      target: { value: "10" },
    });

    expect(screen.getByText("10.00× faster")).toBeInTheDocument();
    expect(screen.getByText("22.2")).toBeInTheDocument();
    expect(screen.getByText("200 years sooner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByText("5.48× faster")).toBeInTheDocument();
    expect(screen.getByText("181 years sooner")).toBeInTheDocument();
  });

  it("updates both participant counts when the trial budget changes", () => {
    render(<RightToTrialImpactExplorer />);

    fireEvent.change(screen.getByLabelText(/Trial budget/), {
      target: { value: "2000000" },
    });

    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("2,152")).toBeInTheDocument();
  });
});
