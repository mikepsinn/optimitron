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
    expect(
      screen.getByText("200 years returned to patients"),
    ).toBeInTheDocument();
  });
});
