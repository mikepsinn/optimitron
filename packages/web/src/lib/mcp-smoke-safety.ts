const DESTRUCTIVE_SCENARIOS = new Set(["signer-reminder", "trigger-roundtrip"]);

const PRODUCTION_HOSTNAMES = new Set([
  "1percenttreaty.org",
  "acceleratedmedicine.org",
  "dfda.earth",
  "dih.earth",
  "optimitron.com",
  "prize.earth",
  "trialabundancesurvey.org",
  "warondisease.org",
]);

function hostnameFromBase(base: string) {
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

function isKnownProductionHostname(hostname: string) {
  const normalized = hostname.replace(/^www\./, "");
  return PRODUCTION_HOSTNAMES.has(normalized);
}

export interface DestructiveMcpSmokeSafetyInput {
  base: string;
  destructiveFlag: boolean;
  remoteTestServerFlag: boolean;
  scenario: string | null;
  testDatabaseFlag: boolean;
}

export type DestructiveMcpSmokeSafetyResult =
  | { ok: true; reason: string }
  | { ok: false; reason: string };

export function evaluateDestructiveMcpSmokeSafety(
  input: DestructiveMcpSmokeSafetyInput,
): DestructiveMcpSmokeSafetyResult {
  if (!input.scenario || !DESTRUCTIVE_SCENARIOS.has(input.scenario)) {
    return { ok: true, reason: "Scenario is non-destructive." };
  }

  if (!input.destructiveFlag) {
    return {
      ok: false,
      reason:
        "Refusing destructive MCP smoke scenario without OPTIMITRON_E2E_DESTRUCTIVE=1.",
    };
  }

  if (!input.testDatabaseFlag) {
    return {
      ok: false,
      reason:
        "Refusing destructive MCP smoke scenario without OPTIMITRON_E2E_TEST_DATABASE=1. Set it only when the target uses a disposable test database.",
    };
  }

  const hostname = hostnameFromBase(input.base);
  if (!hostname) {
    return {
      ok: false,
      reason: `Refusing destructive MCP smoke scenario because MCP_BASE is not a valid URL: ${input.base}`,
    };
  }

  if (isKnownProductionHostname(hostname)) {
    return {
      ok: false,
      reason: `Refusing destructive MCP smoke scenario against known production host: ${hostname}`,
    };
  }

  if (!isLocalHostname(hostname) && !input.remoteTestServerFlag) {
    return {
      ok: false,
      reason:
        "Refusing destructive MCP smoke scenario against a remote host without OPTIMITRON_E2E_REMOTE_TEST_SERVER=1.",
    };
  }

  return { ok: true, reason: "Destructive MCP smoke safety guard passed." };
}
