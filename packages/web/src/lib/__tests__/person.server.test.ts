import { describe, expect, it, vi } from "vitest";
import {
  derivePersonSourceRef,
  findOrCreatePerson,
  mergeDuplicatePerson,
} from "../person.server";

describe("person server", () => {
  it("derives stable public-figure source refs from name, office, and affiliation", () => {
    expect(
      derivePersonSourceRef({
        currentAffiliation: "United States Government",
        displayName: "Donald Trump",
        isPublicFigure: true,
        roleTitle: "President",
      }),
    ).toBe("public-figure:donald-trump:president:united-states-government");
  });

  it("reuses existing imported public figures by derived source ref", async () => {
    const existingPerson = {
      countryCode: null,
      currentAffiliation: "United States Government",
      displayName: "Donald Trump",
      email: null,
      id: "person_1",
      image: null,
      isPublicFigure: true,
      sourceRef: "public-figure:donald-trump:president:united-states-government",
      sourceUrl: "https://manual.example/president",
    };
    const db = {
      person: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(existingPerson),
        findUnique: vi.fn().mockResolvedValue(existingPerson),
        update: vi.fn().mockResolvedValue(existingPerson),
      },
    } as const;

    const result = await findOrCreatePerson(
      {
        currentAffiliation: "United States Government",
        displayName: "Donald Trump",
        isPublicFigure: true,
        roleTitle: "President",
        sourceUrl: "https://manual.example/president",
      },
      db as never,
    );

    expect(db.person.findUnique).toHaveBeenCalledWith({
      where: {
        sourceRef: "public-figure:donald-trump:president:united-states-government",
      },
    });
    expect(db.person.update).toHaveBeenCalledWith({
      data: {
        countryCode: null,
        currentAffiliation: "United States Government",
        displayName: "Donald Trump",
        email: null,
        image: null,
        isPublicFigure: true,
        sourceRef: "public-figure:donald-trump:president:united-states-government",
        sourceUrl: "https://manual.example/president",
      },
      where: { id: "person_1" },
    });
    expect(db.person.create).not.toHaveBeenCalled();
    expect(result.id).toBe("person_1");
  });

  it("moves duplicate person references onto the canonical person and soft-deletes the duplicate", async () => {
    const now = new Date("2026-04-25T12:00:00.000Z");
    const canonicalPerson = {
      bio: null,
      countryCode: null,
      currentAffiliation: null,
      displayName: "Jake Smith",
      email: null,
      handle: null,
      id: "person_canonical",
      image: null,
      isPublicFigure: false,
      links: null,
      sourceRef: null,
      sourceUrl: null,
      user: null,
    };
    const duplicatePerson = {
      bio: "Treaty voter",
      countryCode: "US",
      currentAffiliation: "Earth Optimization Services",
      displayName: "Jake Smith",
      email: "jake@example.test",
      handle: "jake-smith",
      id: "person_duplicate",
      image: "https://example.test/jake.png",
      isPublicFigure: false,
      links: { website: "https://example.test/jake" },
      sourceRef: "email:jake@example.test",
      sourceUrl: "https://example.test/source",
      user: { id: "user_1" },
    };
    const db = {
      person: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => (
          where.id === "person_canonical" ? canonicalPerson : duplicatePerson
        )),
        update: vi.fn().mockResolvedValue(canonicalPerson),
      },
      referralInvitation: {
        updateMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
      task: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      user: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as const;

    const result = await mergeDuplicatePerson(
      {
        canonicalPersonId: "person_canonical",
        duplicatePersonId: "person_duplicate",
        now,
      },
      db as never,
    );

    expect(db.task.updateMany).toHaveBeenCalledWith({
      data: { assigneePersonId: "person_canonical" },
      where: { assigneePersonId: "person_duplicate" },
    });
    expect(db.referralInvitation.updateMany).toHaveBeenCalledWith({
      data: { recipientPersonId: "person_canonical" },
      where: { recipientPersonId: "person_duplicate" },
    });
    expect(db.user.updateMany).toHaveBeenCalledWith({
      data: { personId: "person_canonical" },
      where: { personId: "person_duplicate" },
    });
    expect(db.person.update).toHaveBeenCalledWith({
      data: {
        deletedAt: now,
        email: null,
        handle: null,
        sourceRef: null,
      },
      where: { id: "person_duplicate" },
    });
    expect(db.person.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bio: "Treaty voter",
        countryCode: "US",
        currentAffiliation: "Earth Optimization Services",
        email: "jake@example.test",
        handle: "jake-smith",
        image: "https://example.test/jake.png",
        sourceRef: "email:jake@example.test",
        sourceUrl: "https://example.test/source",
      }),
      where: { id: "person_canonical" },
    });
    expect(result).toEqual({
      canonicalPersonId: "person_canonical",
      duplicatePersonId: "person_duplicate",
      reassignedReferralInvitations: 3,
      reassignedTasks: 2,
      reassignedUsers: 1,
    });
  });

  it("refuses to merge people that are linked to different users", async () => {
    const db = {
      person: {
        findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => ({
          bio: null,
          countryCode: null,
          currentAffiliation: null,
          displayName: "Jake Smith",
          email: null,
          handle: null,
          id: where.id,
          image: null,
          isPublicFigure: false,
          links: null,
          sourceRef: null,
          sourceUrl: null,
          user: { id: where.id === "person_canonical" ? "user_1" : "user_2" },
        })),
        update: vi.fn(),
      },
      referralInvitation: {
        updateMany: vi.fn(),
      },
      task: {
        updateMany: vi.fn(),
      },
      user: {
        updateMany: vi.fn(),
      },
    } as const;

    await expect(
      mergeDuplicatePerson(
        {
          canonicalPersonId: "person_canonical",
          duplicatePersonId: "person_duplicate",
        },
        db as never,
      ),
    ).rejects.toThrow("Cannot merge two Person records that are linked to different users");
    expect(db.task.updateMany).not.toHaveBeenCalled();
    expect(db.referralInvitation.updateMany).not.toHaveBeenCalled();
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });
});
