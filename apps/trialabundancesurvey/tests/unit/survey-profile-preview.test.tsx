import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SurveyProfileSection } from "@optimitron/site-kit/components/survey/SurveyProfileSection"

afterEach(() => vi.unstubAllGlobals())

describe("survey profile visual preview", () => {
  it("cannot write synthetic profile values to the signed-in account", () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const { container } = render(<SurveyProfileSection visualPreview defaultOpen />)

    expect(screen.getByRole("button", { name: "Save details" })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: /^Country/ })).toBeDisabled()
    expect(screen.getByRole("combobox", { name: /^Your role/ })).toBeDisabled()
    // A form submission must also be inert if it bypasses the disabled button.
    fireEvent.submit(container.querySelector("form")!)
    expect(fetch).not.toHaveBeenCalled()
    expect(screen.queryByText("Details saved.")).not.toBeInTheDocument()
  })
})
