import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readVercelConfig(): { crons?: Array<{ path?: string }> } {
  const candidates = [
    path.join(process.cwd(), "packages/web/vercel.json"),
    path.join(process.cwd(), "vercel.json"),
  ];
  const configPath = candidates.find((candidate) => existsSync(candidate));

  if (!configPath) {
    throw new Error("Could not find packages/web/vercel.json");
  }

  return JSON.parse(readFileSync(configPath, "utf8")) as {
    crons?: Array<{ path?: string }>;
  };
}

describe("Vercel cron schedule", () => {
  it("does not schedule the retired generic overdue email sender", () => {
    const paths = readVercelConfig().crons?.map((cron) => cron.path) ?? [];

    expect(paths).not.toContain("/api/cron/task-overdue-reminders");
  });
});
