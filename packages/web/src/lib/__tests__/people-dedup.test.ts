import { PersonLifeStatus } from "@optimitron/db";
import { describe, expect, it, vi } from "vitest";
import {
  canonicalizePersonName,
  findCandidateDuplicateDeceasedPersons,
} from "../people-dedup.server";

describe("canonicalizePersonName", () => {
  it("collapses case, accents, punctuation, and whitespace", () => {
    expect(canonicalizePersonName("  Wishónia! ")).toBe("wishonia");
    expect(canonicalizePersonName("St. Jude")).toBe("st jude");
    expect(canonicalizePersonName("O'Brien")).toBe("obrien");
    expect(canonicalizePersonName("Jean-Luc  Picard")).toBe("jean-luc picard");
    expect(canonicalizePersonName('"José" Martínez')).toBe("jose martinez");
  });

  it("returns empty for whitespace-only input", () => {
    expect(canonicalizePersonName("   ")).toBe("");
    expect(canonicalizePersonName("")).toBe("");
  });
});

function makeFakeDb(rows: Array<Record<string, unknown>>) {
  return {
    person: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
  } as unknown as Parameters<
    typeof findCandidateDuplicateDeceasedPersons
  >[1];
}

describe("findCandidateDuplicateDeceasedPersons", () => {
  it("returns no candidates for too-short input", async () => {
    const db = makeFakeDb([]);
    expect(
      await findCandidateDuplicateDeceasedPersons({ displayName: "x" }, db),
    ).toEqual([]);
    expect(
      (db as unknown as { person: { findMany: ReturnType<typeof vi.fn> } })
        .person.findMany,
    ).not.toHaveBeenCalled();
  });

  it("re-filters case+diacritic variants the SQL match would let through", async () => {
    // Postgres `mode: insensitive` ignores case but not diacritics, so the
    // server-side filter is what makes "Wishónia" match "Wishonia".
    const rows = [
      {
        id: "p_1",
        displayName: "Wishónia",
        handle: null,
        birthDate: null,
        deathDate: null,
        image: null,
        isPublic: true,
      },
      {
        id: "p_2",
        displayName: "Different Person",
        handle: null,
        birthDate: null,
        deathDate: null,
        image: null,
        isPublic: true,
      },
    ];
    const db = makeFakeDb(rows);
    const result = await findCandidateDuplicateDeceasedPersons(
      { displayName: "Wishonia" },
      db,
    );
    expect(result.map((r) => r.id)).toEqual(["p_1"]);
  });

  it("filters by death-date-or-null when deathDate provided", async () => {
    const db = makeFakeDb([]);
    await findCandidateDuplicateDeceasedPersons(
      {
        displayName: "Eleanor Roosevelt",
        deathDate: new Date("1962-11-07T00:00:00Z"),
      },
      db,
    );
    const call = (
      db as unknown as { person: { findMany: ReturnType<typeof vi.fn> } }
    ).person.findMany.mock.calls[0]![0] as {
      where: { OR?: Array<Record<string, unknown>> };
    };
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toHaveLength(2);
    // First branch: same UTC day window. Second: deathDate null + lifeStatus DECEASED.
    expect(call.where.OR![1]).toMatchObject({
      deathDate: null,
      lifeStatus: PersonLifeStatus.DECEASED,
    });
  });

  it("uses a canonical token prefilter instead of exact display-name equality", async () => {
    const db = makeFakeDb([]);
    await findCandidateDuplicateDeceasedPersons(
      { displayName: "St Jude" },
      db,
    );
    const call = (
      db as unknown as { person: { findMany: ReturnType<typeof vi.fn> } }
    ).person.findMany.mock.calls[0]![0] as {
      where: { displayName?: { contains?: string; equals?: string } };
    };
    expect(call.where.displayName).toMatchObject({ contains: "jude" });
    expect(call.where.displayName?.equals).toBeUndefined();
  });

  it("restricts to deceased rows when no deathDate is supplied", async () => {
    const db = makeFakeDb([]);
    await findCandidateDuplicateDeceasedPersons(
      { displayName: "Anyone" },
      db,
    );
    const call = (
      db as unknown as { person: { findMany: ReturnType<typeof vi.fn> } }
    ).person.findMany.mock.calls[0]![0] as {
      where: { lifeStatus?: PersonLifeStatus };
    };
    expect(call.where.lifeStatus).toBe(PersonLifeStatus.DECEASED);
  });
});
