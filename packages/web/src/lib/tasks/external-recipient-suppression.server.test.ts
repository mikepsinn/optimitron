import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    taskCommunication: {
      findFirst: mocks.findFirst,
    },
  },
}));

import {
  findExternalRecipientSuppression,
  persistExternalRecipientSuppressionForEmailLog,
} from "./external-recipient-suppression.server";

describe("external recipient suppression", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        taskCommunication: {
          findMany: mocks.findMany,
          update: mocks.update,
        },
      }),
    );
  });

  it("matches durable suppression by Person id or normalized email", async () => {
    mocks.findFirst.mockResolvedValue({
      errorMessage: null,
      id: "comm_1",
      metadataJson: {
        externalRecipientSuppression: {
          active: true,
          reason: "hard_bounce",
        },
      },
    });

    await expect(
      findExternalRecipientSuppression({
        recipientEmail: " Lawyer@Example.org ",
        recipientPersonId: "person_1",
      }),
    ).resolves.toEqual({
      communicationId: "comm_1",
      reason: "hard_bounce",
    });
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [
                { recipientEmail: "lawyer@example.org" },
                { recipientPersonId: "person_1" },
              ],
            },
          ]),
        }),
      }),
    );
  });

  it("persists provider suppression without requiring a User", async () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    mocks.findMany.mockResolvedValue([
      { id: "comm_1", metadataJson: { batchKey: "batch_12345678" } },
    ]);
    mocks.update.mockResolvedValue({ id: "comm_1" });

    await expect(
      persistExternalRecipientSuppressionForEmailLog({
        emailLogId: "log_1",
        now,
        reason: "complaint",
      }),
    ).resolves.toBe(1);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "comm_1" },
      data: {
        metadataJson: {
          batchKey: "batch_12345678",
          externalRecipientSuppression: {
            active: true,
            reason: "complaint",
            recordedAt: now.toISOString(),
            scope: "all",
          },
        },
      },
    });
  });
});
