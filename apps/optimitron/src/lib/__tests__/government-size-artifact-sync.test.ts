import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  readGovernmentSizeSyncPayload,
  resolveGovernmentSizeSyncPaths,
  syncGovernmentSizeAnalysis,
} from "../government-size-artifact-sync";

describe("government size artifact sync", () => {
  it("resolves the examples source and web target paths from the scripts directory", () => {
    const scriptsDir = resolve("repo/apps/optimitron/scripts");
    const paths = resolveGovernmentSizeSyncPaths(scriptsDir);

    expect(paths.sourcePath).toBe(
      resolve(scriptsDir, "../../../packages/examples/output/us-government-size-analysis.json"),
    );
    expect(paths.targetPath).toBe(
      resolve(scriptsDir, "../src/data/us-government-size-analysis.json"),
    );
  });

  it("copies a valid generated artifact into the target location", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "gov-size-sync-"));

    try {
      const sourcePath = resolve(tempDir, "examples/output/us-government-size-analysis.json");
      const targetPath = resolve(tempDir, "web/src/data/us-government-size-analysis.json");
      mkdirSync(resolve(tempDir, "examples/output"), { recursive: true });

      writeFileSync(
        sourcePath,
        JSON.stringify({
          generatedAt: "2026-03-22T20:00:00.000Z",
          predictor: { id: "government_expenditure_pct_gdp" },
          outcomes: [{ id: "after_tax_median_income_ppp" }, { id: "healthy_life_expectancy_years" }],
        }),
        "utf-8",
      );

      const result = syncGovernmentSizeAnalysis({ sourcePath, targetPath });

      expect(result.generatedAt).toBe("2026-03-22T20:00:00.000Z");
      expect(result.outcomeCount).toBe(2);
      expect(JSON.parse(readFileSync(targetPath, "utf-8"))).toEqual(
        JSON.parse(readFileSync(sourcePath, "utf-8")),
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed generated artifacts before copying", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "gov-size-sync-invalid-"));

    try {
      const sourcePath = resolve(tempDir, "examples/output/us-government-size-analysis.json");
      mkdirSync(resolve(tempDir, "examples/output"), { recursive: true });
      writeFileSync(sourcePath, JSON.stringify({ outcomes: [] }), "utf-8");

      expect(() => readGovernmentSizeSyncPayload(sourcePath)).toThrow(/generatedAt/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
