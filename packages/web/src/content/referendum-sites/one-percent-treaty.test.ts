import { describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/routes";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/site";
import { onePercentTreatyContent } from "./one-percent-treaty";

describe("one percent treaty referendum content", () => {
  it("does not redirect the local impact route back to itself", () => {
    expect(onePercentTreatyContent.impactUrl).not.toBe(
      `${WAR_ON_DISEASE_CANONICAL_ORIGIN}${ROUTES.impact}`,
    );
  });
});
