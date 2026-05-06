import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setRequiredEnv() {
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
}

async function loadServerEnv() {
  vi.resetModules();
  const { getServerEnv } = await import("@/lib/env");
  return getServerEnv();
}

describe("server env validation", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("treats blank optional R2 URL variables as unset", async () => {
    process.env = { ...ORIGINAL_ENV };
    setRequiredEnv();
    process.env.R2_ENDPOINT = "";
    process.env.R2_PUBLIC_URL = "   ";

    const env = await loadServerEnv();

    expect(env.R2_ENDPOINT).toBeUndefined();
    expect(env.R2_PUBLIC_URL).toBeUndefined();
  });

  it("rejects malformed non-blank R2_ENDPOINT values", async () => {
    process.env = { ...ORIGINAL_ENV };
    setRequiredEnv();
    process.env.R2_ENDPOINT = "not-a-url";
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadServerEnv()).rejects.toThrow(/R2_ENDPOINT: Invalid url/);
  });

  it("rejects malformed non-blank R2_PUBLIC_URL values", async () => {
    process.env = { ...ORIGINAL_ENV };
    setRequiredEnv();
    process.env.R2_PUBLIC_URL = "not-a-url";
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadServerEnv()).rejects.toThrow(/R2_PUBLIC_URL: Invalid url/);
  });
});
