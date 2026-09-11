import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { BudgetAllocationBars } from "./BudgetAllocationBars"
import { BUDGET_CATEGORIES } from "@/lib/wishocracy-data"
import type { BudgetCategoryId } from "@/lib/wishocracy-data"

const allocations = Object.fromEntries(Object.keys(BUDGET_CATEGORIES).map((id) => [id, 0])) as Record<BudgetCategoryId, number>
const category = Object.keys(BUDGET_CATEGORIES)[0] as BudgetCategoryId
allocations[category] = 100

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it("shows public averages without personal allocations or participant counts", () => {
  render(<BudgetAllocationBars initialResults={{ averageAllocations: allocations, totalUsers: 123456 }} />)
  expect(screen.getAllByRole("figure").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Average preferred allocation", { exact: true }).length).toBeGreaterThan(0)
  expect(screen.queryByText("Your preferred allocation", { exact: true })).toBeNull()
  expect(screen.queryByText(/123456/)).toBeNull()
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "no matching program" } })
  expect(screen.queryAllByRole("figure")).toHaveLength(0)
  expect(screen.getByText(/No programs match/)).toBeTruthy()
})

it("does not show missing or failed averages as zero, and supports retry", async () => {
  const fetch = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({
    ok: true, json: async () => ({ averageAllocations: allocations, totalUsers: 1 }),
  })
  vi.stubGlobal("fetch", fetch)
  render(<BudgetAllocationBars comparisons={[]} />)
  expect(screen.getByRole("status")).toBeTruthy()
  expect(screen.queryByText("Average preferred allocation", { exact: true })).toBeNull()
  await screen.findByRole("alert")
  expect(screen.queryByText("Average preferred allocation", { exact: true })).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Try again" }))
  expect(await screen.findByText("100.0%", { exact: true })).toBeTruthy()
  expect(screen.queryByRole("alert")).toBeNull()
  expect(screen.getAllByText("Your preferred allocation", { exact: true }).length).toBeGreaterThan(0)
})

it("keeps government allocations available when no responses exist", () => {
  render(<BudgetAllocationBars initialResults={{ averageAllocations: allocations, totalUsers: 0 }} />)
  expect(screen.queryByText("Average preferred allocation", { exact: true })).toBeNull()
  expect(screen.getAllByText("Current government allocation", { exact: true }).length).toBeGreaterThan(0)
})
