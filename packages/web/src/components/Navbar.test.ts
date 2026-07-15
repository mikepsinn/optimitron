import { describe, expect, it } from "vitest";

import {
  collectionsLink,
  documentsLink,
  editProfileLink,
  publicProfileLink,
} from "@/lib/routes";
import { getAuthenticatedProfileLinks } from "./Navbar";

describe("Navbar profile links", () => {
  it("keeps profile editing reachable when a public profile exists", () => {
    expect(getAuthenticatedProfileLinks(null)).toEqual([
      documentsLink,
      collectionsLink,
      editProfileLink,
    ]);

    expect(getAuthenticatedProfileLinks("/people/mike")).toEqual([
      documentsLink,
      collectionsLink,
      editProfileLink,
      {
        ...publicProfileLink,
        href: "/people/mike",
      },
    ]);
  });
});
