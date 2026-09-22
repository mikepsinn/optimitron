import { describe, expect, it } from "vitest";
import { isOAuthConsentFlowRequest } from "@/lib/oauth-consent-flow";

describe("isOAuthConsentFlowRequest", () => {
  it("treats the consent screen itself as the flow, with or without a callback", () => {
    expect(isOAuthConsentFlowRequest("/mcp/authorize", null)).toBe(true);
  });

  it("does not match the sibling route that merely shares a name prefix", () => {
    expect(isOAuthConsentFlowRequest("/mcp/authorized-clients", null)).toBe(
      false,
    );
  });

  it("matches auth pages only while they carry the user back to consent", () => {
    expect(
      isOAuthConsentFlowRequest("/auth/signin", "/mcp/authorize?x=1"),
    ).toBe(true);
    expect(
      isOAuthConsentFlowRequest("/auth/verify-request", "/mcp/authorize"),
    ).toBe(true);
    expect(isOAuthConsentFlowRequest("/auth/signin", "/dashboard")).toBe(false);
    expect(isOAuthConsentFlowRequest("/auth/signin", null)).toBe(false);
  });

  it("leaves ordinary pages alone even when a callback points at consent", () => {
    expect(isOAuthConsentFlowRequest("/dashboard", "/mcp/authorize")).toBe(
      false,
    );
  });

  it("reads the path out of an absolute callback and survives a malformed one", () => {
    expect(
      isOAuthConsentFlowRequest(
        "/auth/signin",
        "https://optimitron.com/mcp/authorize?client_id=abc",
      ),
    ).toBe(true);
    expect(isOAuthConsentFlowRequest("/auth/signin", "%%%")).toBe(false);
  });
});
