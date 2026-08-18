import { describe, expect, it } from "vitest";
import { getOrganizationManagementHref } from "@/lib/organization-links";

describe("getOrganizationManagementHref", () => {
  it("builds the canonical organization management route from the id", () => {
    expect(getOrganizationManagementHref("org_123")).toBe("/organizations/org_123");
  });
});
