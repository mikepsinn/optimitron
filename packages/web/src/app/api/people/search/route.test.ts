import { PersonLifeStatus } from "@optimitron/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  personFindMany: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: {
      findMany: mocks.personFindMany,
    },
  },
}));

import { GET } from "./route";

describe("people search route", () => {
  beforeEach(() => {
    mocks.personFindMany.mockReset();
    mocks.requireAuth.mockReset();
  });

  it("returns 401 without auth", async () => {
    mocks.requireAuth.mockRejectedValue(new Error("Unauthorized"));

    const response = await GET(
      new Request("http://localhost/api/people/search?q=ada"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mocks.personFindMany).not.toHaveBeenCalled();
  });

  it("returns an empty result set for short queries", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });

    const response = await GET(
      new Request("http://localhost/api/people/search?q=a"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [],
      success: true,
    });
    expect(mocks.personFindMany).not.toHaveBeenCalled();
  });

  it("searches live people and maps person links", async () => {
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.personFindMany.mockResolvedValue([
      {
        currentAffiliation: "Analytical Engine",
        displayName: "Ada Lovelace",
        handle: "ada",
        headline: "Treaty math reviewer",
        id: "person_ada",
        image: null,
        isPublicFigure: false,
      },
    ]);

    const response = await GET(
      new Request("http://localhost/api/people/search?q=ada%40example.org"),
    );

    expect(response.status).toBe(200);
    expect(mocks.personFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isPublicFigure: "desc" }, { displayName: "asc" }],
        take: 8,
        where: expect.objectContaining({
          deletedAt: null,
          lifeStatus: { not: PersonLifeStatus.DECEASED },
          OR: expect.arrayContaining([
            { email: { equals: "ada@example.org" } },
            {
              handle: {
                contains: "ada@example.org",
                mode: "insensitive",
              },
            },
          ]),
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          affiliation: "Analytical Engine",
          displayName: "Ada Lovelace",
          handle: "ada",
          headline: "Treaty math reviewer",
          href: "/people/ada",
          id: "person_ada",
          image: null,
          isPublicFigure: false,
        },
      ],
      success: true,
    });
  });
});
