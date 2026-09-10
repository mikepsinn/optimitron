import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { OverdueSignerList } from "../../../../packages/site-kit/src/components/tasks/overdue-signer-list"
import type { TreatySignerTask } from "../../../../packages/site-kit/src/lib/tasks/treaty-signers"
import {
  DAILY_DISEASE_COST_USD,
  DAILY_DISEASE_DEATHS,
  GLOBAL_MILITARY_USD,
} from "../../../../packages/site-kit/src/lib/tasks/delay-attribution"

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
  it("updates treaty and signer costs within a day and catches up after a delayed tick", () => {
    vi.useFakeTimers()
    vi.setSystemTime(SERVER_NOW)
    const dayMs = 86_400_000
    const { container, unmount } = render(
      <OverdueSignerList
        serverNowMs={SERVER_NOW}
        signerTasks={[signer({
          dueAt: new Date(SERVER_NOW - dayMs / 2),
          militarySpendingAnnualUsd: GLOBAL_MILITARY_USD / 2,
        })]}
        treatyProgram={{
          dueAt: new Date(SERVER_NOW - dayMs * 1.5),
          estimatedEffortHours: null,
          id: "1-pct-treaty",
          title: "Ratify the 1% Treaty",
        }}
      />,
    )
    const amount = (field: string) => Number(
      container.querySelector(`[data-volatile="${field}"]`)!.textContent!.replace(/\D/gu, ""),
    )
    const expectTotals = (elapsedMs: number) => {
      const treatyDays = 1.5 + elapsedMs / dayMs
      const signerDays = 0.5 + elapsedMs / dayMs
      expect(amount("treaty-deaths-from-delay")).toBe(Math.floor(DAILY_DISEASE_DEATHS * treatyDays))
      expect(amount("treaty-money-wasted")).toBe(Math.floor(DAILY_DISEASE_COST_USD * treatyDays))
      expect(amount("signer-deaths-from-delay")).toBe(Math.floor(DAILY_DISEASE_DEATHS * signerDays / 2))
      expect(amount("signer-money-wasted")).toBe(Math.floor(DAILY_DISEASE_COST_USD * signerDays / 2))
    }
    try {
      expectTotals(0)
      act(() => vi.advanceTimersByTime(2_000))
      expectTotals(2_000)

      // Background tabs can delay timers; the next tick must use elapsed wall time.
      vi.setSystemTime(SERVER_NOW + 3_600_000)
      act(() => vi.advanceTimersByTime(1_000))
      expectTotals(3_601_000)
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

  it("starts accumulating when a due time passes without a page reload", () => {
    vi.useFakeTimers()
    vi.setSystemTime(SERVER_NOW)
    const { container, unmount } = render(
      <OverdueSignerList
        serverNowMs={SERVER_NOW}
        signerTasks={[signer({ dueAt: new Date(SERVER_NOW + 1_000) })]}
        treatyProgram={null}
      />,
    )
    try {
      expect(container.querySelector('[data-volatile="treaty-money-wasted"]')).toBeNull()
      expect(container.querySelector('[data-volatile="signer-money-wasted"]')!.textContent).toContain("—")
      act(() => vi.advanceTimersByTime(2_000))
      expect(container.querySelector('[data-volatile="treaty-money-wasted"]')).not.toBeNull()
      expect(container.querySelector('[data-volatile="signer-money-wasted"]')!.textContent).toContain("$")
      expect(screen.getByRole("heading", { name: /1 employees have overdue tasks/u })).toBeTruthy()
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

  it("marks the treaty overdue during the first delayed day", () => {
    // The cost block and the "N employees have overdue tasks" heading both
    // start the moment a due time passes. A badge keyed to whole days used to
    // stay hidden until hour 24, so the card claimed deaths from a delay it
    // was not calling overdue.
    vi.useFakeTimers()
    vi.setSystemTime(SERVER_NOW)
    const dayMs = 86_400_000
    const { unmount } = render(
      <OverdueSignerList
        serverNowMs={SERVER_NOW}
        signerTasks={[signer({ dueAt: new Date(SERVER_NOW - dayMs / 4) })]}
        treatyProgram={{
          dueAt: new Date(SERVER_NOW - dayMs / 4),
          estimatedEffortHours: null,
          id: "1-pct-treaty",
          title: "Ratify the 1% Treaty",
        }}
      />,
    )
    try {
      expect(screen.getByText("6 hours overdue")).toBeTruthy()
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

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
