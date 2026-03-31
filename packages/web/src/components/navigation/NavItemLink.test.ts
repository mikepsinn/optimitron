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
    expect(getNavItemDescriptionMode("custom")).toBe("none");
  });

  it("returns active and inactive class variants for top nav links", () => {
    expect(getNavItemLinkClasses("topNav", true)).toContain("bg-background");
    expect(getNavItemLinkClasses("topNav", false)).toContain("hover:bg-background");
  });

  it("returns footer styling without button chrome", () => {
    const classes = getNavItemLinkClasses("footer", false);

    expect(classes).toContain("text-sm");
    expect(classes).toContain("transition-colors");
    expect(classes).not.toContain("hover:bg-");
    expect(classes).not.toContain("hover:border-");
    expect(classes).not.toContain("bg-yellow-300");
  });

  it("returns no built-in chrome for custom variants", () => {
    expect(getNavItemLinkClasses("custom", false)).toBe("");
  });
});
