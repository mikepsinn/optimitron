import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { OverdueSignerList } from "../../../../packages/site-kit/src/components/tasks/overdue-signer-list"
import type { TreatySignerTask } from "../../../../packages/site-kit/src/lib/tasks/treaty-signers"

const SERVER_NOW = new Date("2026-08-29T00:00:00.000Z").getTime()

function signer(overrides: Partial<TreatySignerTask>): TreatySignerTask {
  return {
    assigneeAffiliation: "Government of Testland",
    assigneeCountryCode: "US",
    assigneeHandle: null,
    assigneeImage: null,
    assigneeName: "Test President",
    dueAt: new Date("2026-04-14T00:00:00.000Z"),
    estimatedEffortHours: 1 / 120,
    id: "signer-test",
    militarySpendingAnnualUsd: 886_000_000_000,
    title: "Sign the 1% Treaty",
    ...overrides,
  }
}

describe("President task board", () => {
  it("keeps the project, overdue impact, task columns, and reminder actions", () => {
    render(
      <OverdueSignerList
        serverNowMs={SERVER_NOW}
        signerTasks={[
          signer({ id: "signer-us", assigneeName: "Donald Trump" }),
          signer({
            assigneeAffiliation: "Government of China",
            assigneeCountryCode: "CN",
            assigneeName: "Li Qiang",
            id: "signer-cn",
            militarySpendingAnnualUsd: 296_000_000_000,
          }),
        ]}
        treatyProgram={{
          dueAt: new Date("2024-12-31T00:00:00.000Z"),
          estimatedEffortHours: 1.6,
          id: "1-pct-treaty",
          title: "Ratify the 1% Treaty",
        }}
      />,
    )

    expect(
      screen.getByRole("link", { name: "Ratify the 1% Treaty" }),
    ).toBeTruthy()
    expect(
      screen.getByRole("heading", { name: /2 employees have overdue tasks/u }),
    ).toBeTruthy()
    expect(screen.getByText("💀 Deaths from delay")).toBeTruthy()
    expect(screen.getByText("💸 Wasted by delay")).toBeTruthy()
    expect(screen.getAllByRole("link", { name: "Remind" })).toHaveLength(2)
    expect(screen.queryByText("Treaty signatories")).toBeNull()
    expect(screen.queryByText("on time")).toBeNull()
  })

  it("filters the president tasks without removing the project", () => {
    render(
      <OverdueSignerList
        serverNowMs={SERVER_NOW}
        signerTasks={[
          signer({ id: "signer-us", assigneeName: "Donald Trump" }),
          signer({ id: "signer-cn", assigneeName: "Li Qiang" }),
        ]}
        treatyProgram={null}
      />,
    )

    fireEvent.change(screen.getByRole("searchbox", { name: "Filter tasks" }), {
      target: { value: "Li Qiang" },
    })

    expect(screen.getByText(/Li Qiang/u)).toBeTruthy()
    expect(screen.queryByText(/Donald Trump/u)).toBeNull()
    expect(
      screen.getByRole("link", { name: "Ratify the 1% Treaty" }),
    ).toBeTruthy()
  })
})
