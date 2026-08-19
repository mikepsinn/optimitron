import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  ensurePersonForUser: vi.fn(),
  personUpdate: vi.fn(),
}))

vi.mock("@/lib/person.server", () => ({
  ensurePersonForUser: mocks.ensurePersonForUser,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      update: mocks.personUpdate,
    },
  },
}))

import { applySignatureProfile } from "@/lib/signature-profile.server"

const basePerson = {
  id: "person_1",
  displayName: "Old Name",
  firstName: null,
  middleName: null,
  lastName: null,
  isPublic: false,
}

describe("applySignatureProfile", () => {
  beforeEach(() => {
    mocks.ensurePersonForUser.mockReset()
    mocks.personUpdate.mockReset()
    mocks.ensurePersonForUser.mockResolvedValue(basePerson)
  })

  it("no-ops for plain votes that carry no signature fields", async () => {
    await applySignatureProfile("user_1", {})

    expect(mocks.ensurePersonForUser).not.toHaveBeenCalled()
    expect(mocks.personUpdate).not.toHaveBeenCalled()
  })

  it("updates the person with cleaned signature names and visibility", async () => {
    await applySignatureProfile("user_1", {
      displayName: "  Jane   Q  Signer ",
      firstName: "Jane",
      middleName: "Q",
      lastName: "Signer",
      makePublic: true,
    })

    expect(mocks.personUpdate).toHaveBeenCalledWith({
      where: { id: "person_1" },
      data: {
        displayName: "Jane Q Signer",
        firstName: "Jane",
        middleName: "Q",
        lastName: "Signer",
        isPublic: true,
      },
    })
  })

  it("skips fields that already match the person record", async () => {
    mocks.ensurePersonForUser.mockResolvedValue({
      ...basePerson,
      displayName: "Jane Signer",
      isPublic: true,
    })

    await applySignatureProfile("user_1", {
      displayName: "Jane Signer",
      lastName: "Signer",
      makePublic: true,
    })

    expect(mocks.personUpdate).toHaveBeenCalledWith({
      where: { id: "person_1" },
      data: { lastName: "Signer" },
    })
  })

  it("does not write when every provided field already matches", async () => {
    mocks.ensurePersonForUser.mockResolvedValue({
      ...basePerson,
      displayName: "Jane Signer",
      isPublic: true,
    })

    await applySignatureProfile("user_1", {
      displayName: "Jane Signer",
      makePublic: true,
    })

    expect(mocks.personUpdate).not.toHaveBeenCalled()
  })

  it("ignores non-string names and non-boolean makePublic", async () => {
    await applySignatureProfile("user_1", {
      displayName: 42,
      firstName: { evil: true },
      makePublic: "yes",
    })

    expect(mocks.ensurePersonForUser).not.toHaveBeenCalled()
    expect(mocks.personUpdate).not.toHaveBeenCalled()
  })
})
