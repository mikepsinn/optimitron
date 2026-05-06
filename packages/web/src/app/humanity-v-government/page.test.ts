import { describe, expect, it, vi } from "vitest";
import { HUMANITY_V_GOVERNMENT_MANUAL_URL } from "@/lib/routes";

const mocks = vi.hoisted(() => ({
  permanentRedirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect: mocks.permanentRedirect,
}));

import HumanityVGovernmentPage from "./page";

describe("HumanityVGovernmentPage", () => {
  it("redirects to the manual appendix", () => {
    expect(() => HumanityVGovernmentPage()).toThrow(
      `redirect:${HUMANITY_V_GOVERNMENT_MANUAL_URL}`,
    );
  });
});
