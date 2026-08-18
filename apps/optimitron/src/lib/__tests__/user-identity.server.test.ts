import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  personFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: { findUnique: mocks.personFindUnique },
    user: { findUnique: mocks.userFindUnique },
  },
}));

import {
  createUniqueHandle,
  generateRandomPlayerName,
} from "../user-identity.server";

describe("createUniqueHandle", () => {
  beforeEach(() => {
    mocks.personFindUnique.mockReset();
    mocks.userFindUnique.mockReset();
  });

  it("checks Person.handle for collisions, not User.username", async () => {
    mocks.personFindUnique.mockResolvedValue(null);

    const handle = await createUniqueHandle();

    expect(handle).toMatch(/^[a-z-]+$/);
    expect(mocks.personFindUnique).toHaveBeenCalledWith({
      where: { handle },
    });
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });

  it("retries on collision until it finds a free handle", async () => {
    mocks.personFindUnique
      .mockResolvedValueOnce({ id: "p1" })
      .mockResolvedValueOnce({ id: "p2" })
      .mockResolvedValueOnce(null);

    await createUniqueHandle();

    expect(mocks.personFindUnique).toHaveBeenCalledTimes(3);
  });

  it("falls back to a numbered suffix after 5 collisions", async () => {
    // First 5 calls collide; 6th (with suffix) is free.
    mocks.personFindUnique
      .mockResolvedValueOnce({ id: "p" })
      .mockResolvedValueOnce({ id: "p" })
      .mockResolvedValueOnce({ id: "p" })
      .mockResolvedValueOnce({ id: "p" })
      .mockResolvedValueOnce({ id: "p" })
      .mockResolvedValueOnce(null);

    const handle = await createUniqueHandle();

    expect(handle).toMatch(/-\d{2}$/);
  });
});

describe("generateRandomPlayerName", () => {
  it("returns adjective-noun shaped strings", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateRandomPlayerName()).toMatch(/^[a-z0-9-]+-[a-z0-9-]+$/);
    }
  });
});
