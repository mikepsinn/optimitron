import { describe, expect, it, vi } from "vitest";
import {
  upsertWishoniaUser,
  WISHONIA_EMAIL,
  type WishoniaUserClient,
} from "./system-users.js";

function makeClient(existingUserForPerson: { id: string } | null = null) {
  const client = {
    person: {
      upsert: vi.fn(async () => ({
        handle: "wishonia",
        id: "person_wishonia",
      })),
    },
    user: {
      findFirst: vi.fn(async () => existingUserForPerson),
      update: vi.fn(async () => ({ id: existingUserForPerson?.id ?? "user_1" })),
      upsert: vi.fn(async (args) => {
        const input = args as {
          create: { email: string };
          where: { email: string };
        };
        if (
          input.where.email !== WISHONIA_EMAIL ||
          input.create.email !== WISHONIA_EMAIL
        ) {
          throw new Error("Wishonia system user must use the reserved email.");
        }
        return { id: "user_wishonia" };
      }),
    },
  } satisfies WishoniaUserClient;

  return client;
}

describe("upsertWishoniaUser", () => {
  it("migrates an existing Wishonia-linked user to the reserved system email", async () => {
    const now = new Date("2026-05-10T12:00:00.000Z");
    const client = makeClient({ id: "legacy_user" });

    await upsertWishoniaUser(client, now);

    expect(client.user.update).toHaveBeenCalledWith({
      where: { id: "legacy_user" },
      data: {
        email: WISHONIA_EMAIL,
        emailVerified: now,
        isSystem: true,
        person: { connect: { id: "person_wishonia" } },
      },
    });
    expect(client.user.upsert).not.toHaveBeenCalled();
  });

  it("creates the system user by reserved email when no linked user exists", async () => {
    const client = makeClient();

    const result = await upsertWishoniaUser(client);

    expect(result).toEqual({
      person: {
        handle: "wishonia",
        id: "person_wishonia",
      },
      user: { id: "user_wishonia" },
    });
    expect(client.user.update).not.toHaveBeenCalled();
  });
});
