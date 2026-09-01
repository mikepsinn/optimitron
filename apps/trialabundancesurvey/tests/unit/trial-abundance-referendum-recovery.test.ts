import { ReferendumStatus } from "@optimitron/db"
import {
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
} from "@optimitron/db/constants"
import { describe, expect, it, vi } from "vitest"

import { getTrialAbundanceReferendums } from "../../lib/trial-abundance-response-store"

const patientAccessReferendum = {
  deletedAt: null,
  id: "patient-access",
  slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  status: ReferendumStatus.ACTIVE,
}
const selfFundedAccessReferendum = {
  deletedAt: null,
  id: "self-funded-access",
  slug: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
  status: ReferendumStatus.ACTIVE,
}

describe("Trial Abundance managed referendum recovery", () => {
  it("syncs managed referendums and reloads them when production records are missing", async () => {
    const findReferendums = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        patientAccessReferendum,
        selfFundedAccessReferendum,
      ])
    const syncReferendums = vi.fn().mockResolvedValue(undefined)

    await expect(
      getTrialAbundanceReferendums({ findReferendums, syncReferendums }),
    ).resolves.toEqual({
      patientAccessReferendum,
      selfFundedAccessReferendum,
    })
    expect(syncReferendums).toHaveBeenCalledOnce()
    expect(findReferendums).toHaveBeenCalledTimes(2)
  })

  it("does not run managed-data writes when both records already exist", async () => {
    const findReferendums = vi
      .fn()
      .mockResolvedValue([patientAccessReferendum, selfFundedAccessReferendum])
    const syncReferendums = vi.fn().mockResolvedValue(undefined)

    await getTrialAbundanceReferendums({ findReferendums, syncReferendums })

    expect(syncReferendums).not.toHaveBeenCalled()
    expect(findReferendums).toHaveBeenCalledOnce()
  })
})
