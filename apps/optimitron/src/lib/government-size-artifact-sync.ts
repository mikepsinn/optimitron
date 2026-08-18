import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

interface GovernmentSizeSyncPayload {
  generatedAt: string;
  outcomes: unknown[];
  predictor: {
    id: string;
  };
}

export interface GovernmentSizeSyncPaths {
  sourcePath: string;
  targetPath: string;
}

export interface GovernmentSizeSyncResult extends GovernmentSizeSyncPaths {
  generatedAt: string;
  outcomeCount: number;
}

export function resolveGovernmentSizeSyncPaths(baseDir: string): GovernmentSizeSyncPaths {
  return {
    sourcePath: resolve(baseDir, "../../../packages/examples/output/us-government-size-analysis.json"),
    targetPath: resolve(baseDir, "../src/data/us-government-size-analysis.json"),
  };
}

export function readGovernmentSizeSyncPayload(sourcePath: string): GovernmentSizeSyncPayload {
  const parsed = JSON.parse(readFileSync(sourcePath, "utf-8")) as Partial<GovernmentSizeSyncPayload>;

  if (typeof parsed.generatedAt !== "string" || parsed.generatedAt.length === 0) {
    throw new Error(`Government size artifact at ${sourcePath} is missing generatedAt.`);
  }

  if (!Array.isArray(parsed.outcomes)) {
    throw new Error(`Government size artifact at ${sourcePath} is missing outcomes.`);
  }

  if (typeof parsed.predictor?.id !== "string" || parsed.predictor.id.length === 0) {
    throw new Error(`Government size artifact at ${sourcePath} is missing predictor.id.`);
  }

  return {
    generatedAt: parsed.generatedAt,
    outcomes: parsed.outcomes,
    predictor: {
      id: parsed.predictor.id,
    },
  };
}

export function syncGovernmentSizeAnalysis(paths: GovernmentSizeSyncPaths): GovernmentSizeSyncResult {
  const payload = readGovernmentSizeSyncPayload(paths.sourcePath);
  mkdirSync(dirname(paths.targetPath), { recursive: true });
  copyFileSync(paths.sourcePath, paths.targetPath);

  return {
    sourcePath: paths.sourcePath,
    targetPath: paths.targetPath,
    generatedAt: payload.generatedAt,
    outcomeCount: payload.outcomes.length,
  };
}
