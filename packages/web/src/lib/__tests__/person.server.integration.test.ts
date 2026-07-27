import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { findOrCreatePerson } from "@/lib/person.server";

const email = `person-upsert-${randomUUID()}@example.test`;

afterAll(async () => {
  await prisma.person.deleteMany({ where: { email } });
});

describe("findOrCreatePerson database concurrency", () => {
  it("normalizes email and converges concurrent retries on one Person", async () => {
    const people = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        findOrCreatePerson({
          displayName: `Concurrent Candidate ${index}`,
          email: index % 2 === 0 ? email.toUpperCase() : ` ${email} `,
          sourceUrl: "https://example.test/candidate",
        }),
      ),
    );

    expect(new Set(people.map((person) => person.id)).size).toBe(1);
    expect(
      await prisma.person.count({ where: { email, deletedAt: null } }),
    ).toBe(1);
  });
});
