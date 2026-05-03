import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    referendum: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

import { GET, POST } from "./route";

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/referendums", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("/api/referendums", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.requireAuth.mockResolvedValue({ userId: "user_1" });
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockImplementation(async ({ data }) => ({
      id: "ref_1",
      status: "ACTIVE",
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
      ...data,
    }));
  });

  it("lists referendum ballot fields and content metadata", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "ref_1",
        title: "Tiny Referendum",
        slug: "tiny-referendum",
        question: "Should this tiny referendum exist?",
        kind: "GENERAL",
        description: "A small test.",
        status: "ACTIVE",
        publishedAt: new Date("2026-05-03T00:00:00.000Z"),
        lockedAt: null,
        contentHash: "a".repeat(64),
        createdAt: new Date("2026-05-03T00:00:00.000Z"),
        _count: { votes: 0 },
      },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      referendums: [
        {
          slug: "tiny-referendum",
          question: "Should this tiny referendum exist?",
          kind: "GENERAL",
          contentHash: "a".repeat(64),
        },
      ],
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          question: true,
          kind: true,
          publishedAt: true,
          lockedAt: true,
          contentHash: true,
        }),
      }),
    );
  });

  it("requires a canonical ballot question when creating a referendum", async () => {
    const res = await POST(
      makePostRequest({
        title: "Tiny Referendum",
        slug: "tiny-referendum",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Title, slug, and question are required",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates API referendums with body markdown and a content hash", async () => {
    const res = await POST(
      makePostRequest({
        title: "Tiny Referendum",
        slug: "tiny-referendum",
        question: "Should this tiny referendum exist?",
        description: "A small test.",
        bodyMarkdown: "Details.",
        kind: "GENERAL",
      }),
    );

    expect(res.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Tiny Referendum",
        slug: "tiny-referendum",
        question: "Should this tiny referendum exist?",
        description: "A small test.",
        bodyMarkdown: "Details.",
        kind: "GENERAL",
        createdByUserId: "user_1",
        publishedAt: expect.any(Date),
        lockedAt: null,
        contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    await expect(res.json()).resolves.toMatchObject({
      referendum: {
        slug: "tiny-referendum",
        question: "Should this tiny referendum exist?",
        bodyMarkdown: "Details.",
        kind: "GENERAL",
      },
    });
  });
});
