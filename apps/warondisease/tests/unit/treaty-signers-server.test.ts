import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  warn: vi.fn(),
}))

vi.mock("../../../../packages/site-kit/src/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
    },
  },
}))

vi.mock("../../../../packages/site-kit/src/lib/logger", () => ({
  createLogger: () => ({ warn: mocks.warn }),
}))

import { getTreatyPresidentManagementData } from "../../../../packages/site-kit/src/lib/tasks/treaty-signers.server"

describe("the President Management System data boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("keeps the task board available when the preview database has no schema", async () => {
    const missingTable = Object.assign(new Error("The table public.Task does not exist"), {
      code: "P2021",
    })
    mocks.findMany.mockRejectedValue(missingTable)
    mocks.findUnique.mockRejectedValue(missingTable)

    const result = await getTreatyPresidentManagementData()
    const unitedStates = result.signerTasks.find(
      (task) => task.assigneeCountryCode === "US",
    )

    expect(result.signerTasks.length).toBeGreaterThan(180)
    expect(result.treatyProgram).toMatchObject({
      id: "1-pct-treaty",
      title: "Ratify the 1% Treaty",
    })
    expect(unitedStates).toMatchObject({
      assigneeName: "Donald Trump",
      estimatedEffortHours: 1 / 120,
      id: "1-pct-treaty-signer-us",
      title: "Sign the 1% Treaty",
    })
    expect(mocks.warn).toHaveBeenCalledOnce()
  })
})
