import { describe, expect, it } from "vitest";

import {
  getNavItemDescriptionMode,
  getNavItemLinkClasses,
} from "./NavItemLink";

describe("NavItemLink helpers", () => {
  it("uses tooltips for compact nav surfaces and inline descriptions for menu surfaces", () => {
    expect(getNavItemDescriptionMode("topNav")).toBe("tooltip");
    expect(getNavItemDescriptionMode("footer")).toBe("tooltip");
    expect(getNavItemDescriptionMode("dropdown")).toBe("inline");
    expect(getNavItemDescriptionMode("mobile")).toBe("inline");
  });

  it("returns active and inactive class variants for top nav links", () => {
    expect(getNavItemLinkClasses("topNav", true)).toContain("bg-yellow-300");
    expect(getNavItemLinkClasses("topNav", false)).toContain("hover:bg-cyan-200");
  });

  it("returns footer styling without button chrome", () => {
    const classes = getNavItemLinkClasses("footer", false);

    expect(classes).toContain("text-sm");
    expect(classes).toContain("hover:text-black");
    expect(classes).not.toContain("bg-yellow-300");
  });
});
