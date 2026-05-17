import { describe, expect, it } from "vitest";

import { editProfileLink, publicProfileLink } from "@/lib/routes";
import { getAuthenticatedProfileLinks } from "./Navbar";

describe("Navbar profile links", () => {
  it("keeps profile editing reachable when a public profile exists", () => {
    expect(getAuthenticatedProfileLinks(null)).toEqual([editProfileLink]);

    expect(getAuthenticatedProfileLinks("/people/mike")).toEqual([
      editProfileLink,
      {
        ...publicProfileLink,
        href: "/people/mike",
      },
    ]);
  });
});
