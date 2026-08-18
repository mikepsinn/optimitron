import { describe, expect, it } from "vitest";
import { evaluateDestructiveMcpSmokeSafety } from "@/lib/mcp-smoke-safety";

describe("evaluateDestructiveMcpSmokeSafety", () => {
  it("allows non-destructive smoke runs without extra flags", () => {
    expect(
      evaluateDestructiveMcpSmokeSafety({
        base: "https://optimitron.com",
        destructiveFlag: false,
        remoteTestServerFlag: false,
        scenario: null,
        testDatabaseFlag: false,
      }).ok,
    ).toBe(true);
  });

  it("requires the destructive flag for destructive scenarios", () => {
    const result = evaluateDestructiveMcpSmokeSafety({
      base: "http://localhost:3001",
      destructiveFlag: false,
      remoteTestServerFlag: false,
      scenario: "trigger-roundtrip",
      testDatabaseFlag: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("OPTIMITRON_E2E_DESTRUCTIVE=1");
  });

  it("requires an explicit test database marker even on localhost", () => {
    const result = evaluateDestructiveMcpSmokeSafety({
      base: "http://localhost:3001",
      destructiveFlag: true,
      remoteTestServerFlag: false,
      scenario: "signer-reminder",
      testDatabaseFlag: false,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("OPTIMITRON_E2E_TEST_DATABASE=1");
  });

  it("allows localhost when destructive and test database markers are set", () => {
    expect(
      evaluateDestructiveMcpSmokeSafety({
        base: "http://127.0.0.1:3001",
        destructiveFlag: true,
        remoteTestServerFlag: false,
        scenario: "trigger-roundtrip",
        testDatabaseFlag: true,
      }).ok,
    ).toBe(true);
  });

  it("blocks known production hosts even with all flags set", () => {
    const result = evaluateDestructiveMcpSmokeSafety({
      base: "https://www.optimitron.com",
      destructiveFlag: true,
      remoteTestServerFlag: true,
      scenario: "trigger-roundtrip",
      testDatabaseFlag: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("known production host");
  });

  it("requires an explicit remote test-server marker for remote hosts", () => {
    const result = evaluateDestructiveMcpSmokeSafety({
      base: "https://optimitron-preview.example.test",
      destructiveFlag: true,
      remoteTestServerFlag: false,
      scenario: "trigger-roundtrip",
      testDatabaseFlag: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("OPTIMITRON_E2E_REMOTE_TEST_SERVER=1");
  });
});
