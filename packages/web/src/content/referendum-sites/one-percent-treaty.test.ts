import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ROUTES } from "@/lib/routes";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/site";
import { onePercentTreatyContent } from "./one-percent-treaty";

const messagesPath = fileURLToPath(
  new URL("../../messages/en-US/war-on-disease.json", import.meta.url),
);

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStrings);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }

  return [];
}

describe("one percent treaty referendum content", () => {
  it("does not redirect the local impact route back to itself", () => {
    expect(onePercentTreatyContent.impactUrl).not.toBe(
      `${WAR_ON_DISEASE_CANONICAL_ORIGIN}${ROUTES.impact}`,
    );
  });

  it("keeps public War on Disease copy in a reviewable JSON message catalog", () => {
    const messagesFileExists = existsSync(messagesPath);
    expect(messagesFileExists).toBe(true);
    if (!messagesFileExists) return;

    const messages = JSON.parse(readFileSync(messagesPath, "utf8"));
    const catalog = messages.onePercentTreaty;

    expect(catalog.metadata.home.description).toContain("{apocalypseCount}");
    expect(onePercentTreatyContent.metadata.home.description).not.toContain(
      "{apocalypseCount}",
    );
    expect(onePercentTreatyContent.home.heroTitle).toBe(
      catalog.home.heroTitle,
    );
    expect(
      onePercentTreatyContent.why.facts.map(({ label }) => label),
    ).toEqual(catalog.why.facts.map(({ label }: { label: string }) => label));
  });

  it("does not leak unresolved message placeholders into runtime copy", () => {
    const unresolved = collectStrings(onePercentTreatyContent).filter((value) =>
      /\{[A-Za-z0-9_]+\}/.test(value),
    );

    expect(unresolved).toEqual([]);
  });
});
