import type { ReactElement } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  DISEASE_BURDEN_GDP_DRAG_PCT,
  DISEASES_WITHOUT_EFFECTIVE_TREATMENT,
  GLOBAL_WARHEAD_COUNT,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  TREATY_ANNUAL_FUNDING,
  TREATY_REDUCTION_PCT,
  type Parameter,
} from "@optimitron/data/parameters"
import {
  ParameterInline,
  ParameterValue,
} from "../../../../packages/site-kit/src/components/shared/ParameterValue"

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

  it("honours valueOverride in ParameterInline too", () => {
    // ParameterInline takes Omit<ParameterValueProps, "showPopover" | "as">, so
    // it accepts valueOverride from the shared props. It previously ignored it
    // and printed the formatted parameter, silently discarding the caller's
    // number.
    render(<ParameterInline param={bare} display="integer" valueOverride="1.2%" />)
    expect(screen.getByText("1.2%")).toBeTruthy()
    expect(screen.queryByText("42")).toBeNull()
  })
})

/** The text a ParameterValue prints (the dialog stays closed). */
function printed(element: ReactElement): string | null {
  return render(element).container.textContent
}

describe("ParameterValue number format", () => {
  it("prints the same text as the Optimitron app", () => {
    // warondisease.org printed "7K", "13.000%" and "$27B" for these.
    expect(printed(<ParameterValue param={DISEASES_WITHOUT_EFFECTIVE_TREATMENT} />)).toBe("6,650")
    expect(printed(<ParameterValue param={DISEASE_BURDEN_GDP_DRAG_PCT} />)).toBe("13.0%")
    expect(printed(<ParameterValue param={TREATY_ANNUAL_FUNDING} />)).toBe("$27.2 billion/year")
  })

  it("keeps what a compact-era format caller asked for, in the Optimitron notation", () => {
    // precision 0 still prints "1%", not the three-significant-figure "1.00%".
    expect(printed(<ParameterValue param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} />)).toBe("1%")
    // The ratio symbol the compact formatter printed stays, as Optimitron's "x".
    expect(
      printed(
        <ParameterValue
          param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
          format={{ precision: 0 }}
        />,
      ),
    ).toBe("604x")
    // compact: false showed every digit, so every digit stays.
    expect(
      printed(<ParameterValue param={GLOBAL_WARHEAD_COUNT} format={{ compact: false, precision: 0 }} />),
    ).toBe("12,241")
    // An explicit compact request keeps compact notation.
    expect(
      printed(<ParameterValue param={TREATY_ANNUAL_FUNDING} format={{ compact: true, precision: 1 }} />),
    ).toBe("$27.2B")
  })
})
