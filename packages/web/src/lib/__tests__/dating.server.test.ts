import { beforeEach, describe, expect, it, vi } from "vitest";
import { DatingInteractionKind, DatingProfilePhotoStatus } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  datingProfileFindFirst: vi.fn(),
  datingProfileFindMany: vi.fn(),
  datingInteractionCreate: vi.fn(),
  datingInteractionFindFirst: vi.fn(),
  datingMatchUpsert: vi.fn(),
  datingConversationUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    datingProfile: {
      findFirst: mocks.datingProfileFindFirst,
      findMany: mocks.datingProfileFindMany,
    },
    $transaction: mocks.transaction,
  },
}));

import { createDatingInteraction, getDatingDiscoverData } from "@/lib/dating.server";

describe("dating server helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.datingProfileFindFirst
      .mockResolvedValueOnce({ id: "profile_z", userId: "user_1" })
      .mockResolvedValueOnce({ id: "profile_a", userId: "user_2" });
    mocks.datingInteractionCreate.mockResolvedValue({
      id: "interaction_1",
    });
    mocks.datingInteractionFindFirst.mockResolvedValue({
      id: "interaction_0",
    });
    mocks.datingMatchUpsert.mockResolvedValue({
      id: "match_1",
      profileAId: "profile_a",
      profileBId: "profile_z",
    });
    mocks.datingConversationUpsert.mockResolvedValue({
      id: "conversation_1",
      matchId: "match_1",
    });
    mocks.transaction.mockImplementation((callback) =>
      callback({
        datingConversation: {
          upsert: mocks.datingConversationUpsert,
        },
        datingInteraction: {
          create: mocks.datingInteractionCreate,
          findFirst: mocks.datingInteractionFindFirst,
        },
        datingMatch: {
          upsert: mocks.datingMatchUpsert,
        },
      }),
    );
  });

  it("creates a canonical match and conversation for reciprocal likes", async () => {
    const result = await createDatingInteraction("user_1", {
      kind: DatingInteractionKind.LIKE,
      toProfileId: "profile_a",
    });

    expect(result.match?.id).toBe("match_1");
    expect(result.conversation?.id).toBe("conversation_1");
    expect(mocks.datingMatchUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          profileAId: "profile_a",
          profileBId: "profile_z",
        }),
        where: {
          profileAId_profileBId: {
            profileAId: "profile_a",
            profileBId: "profile_z",
          },
        },
      }),
    );
    expect(mocks.datingConversationUpsert).toHaveBeenCalledWith({
      create: { matchId: "match_1" },
      update: {},
      where: { matchId: "match_1" },
    });
  });

  it("only includes approved photos in public discovery profiles", async () => {
    mocks.datingProfileFindFirst.mockReset();
    mocks.datingProfileFindMany.mockReset();
    mocks.datingProfileFindFirst.mockResolvedValue({
      id: "profile_z",
      userId: "user_1",
    });
    mocks.datingProfileFindMany.mockResolvedValue([]);

    await getDatingDiscoverData("user_1");

    expect(mocks.datingProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          photos: expect.objectContaining({
            where: {
              deletedAt: null,
              status: DatingProfilePhotoStatus.APPROVED,
            },
          }),
        }),
      }),
    );
  });
});
