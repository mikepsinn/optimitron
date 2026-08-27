import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { Parameter } from "@optimitron/data/parameters"
import { ParameterValue } from "../../../../packages/site-kit/src/components/shared/ParameterValue"

/**
 * The campaign pages migrated out of Optimitron call ParameterValue with two
 * props the shared component did not originally accept: `valueOverride` and
 * `presentation`. Both change what the reader sees, so they are covered here
 * rather than left to a visual check — dropping `valueOverride` silently
 * prints a different number than the page did before the move.
 */

/** Carries metadata, so the popover path is live unless something suppresses it. */
const withMetadata: Parameter = {
  value: 1234.5678,
  unit: "USD",
  displayName: "Test Parameter",
  description: "A parameter used to exercise the popover path.",
}

/** No metadata at all: the component renders plain text whatever the props say. */
const bare: Parameter = { value: 42 }

describe("ParameterValue", () => {
  it("prints the parameter's own formatted value by default", () => {
    render(<ParameterValue param={bare} display="integer" />)
    expect(screen.getByText("42")).toBeTruthy()
  })

  it("prints valueOverride instead of the formatted value", () => {
    render(
      <ParameterValue
        param={bare}
        display="integer"
        valueOverride="1.2%"
      />,
    )
    expect(screen.getByText("1.2%")).toBeTruthy()
    expect(screen.queryByText("42")).toBeNull()
  })

  it("keeps the popover when a valueOverride is supplied", () => {
    // The override changes the printed text only. The parameter's citation and
    // description must stay reachable, otherwise overriding the text would
    // quietly strip the sourcing from the figure.
    render(<ParameterValue param={withMetadata} valueOverride="about $1.2k" />)
    expect(screen.getByRole("button", { name: "about $1.2k" })).toBeTruthy()
  })

  it("suppresses the popover for presentation=inline", () => {
    render(<ParameterValue param={withMetadata} presentation="inline" />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("keeps the popover for presentation=interactive", () => {
    render(<ParameterValue param={withMetadata} presentation="interactive" />)
    expect(screen.getByRole("button")).toBeTruthy()
  })

  it("defaults to the popover when neither prop is passed", () => {
    // Guards the existing site-kit call sites: before `presentation` existed,
    // `showPopover` defaulted to true, and that must not change.
    render(<ParameterValue param={withMetadata} />)
    expect(screen.getByRole("button")).toBeTruthy()
  })

  it("lets an explicit showPopover=false win over presentation=interactive", () => {
    render(
      <ParameterValue
        param={withMetadata}
        presentation="interactive"
        showPopover={false}
      />,
    )
    expect(screen.queryByRole("button")).toBeNull()
  })
})
