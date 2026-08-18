#!/usr/bin/env tsx

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveGovernmentSizeSyncPaths,
  syncGovernmentSizeAnalysis,
} from "../src/lib/government-size-artifact-sync";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function run(): void {
  const result = syncGovernmentSizeAnalysis(resolveGovernmentSizeSyncPaths(__dirname));
  console.log(
    `Synced government-size analysis (${result.outcomeCount} outcomes, generated ${result.generatedAt})`,
  );
  console.log(`  Source: ${result.sourcePath}`);
  console.log(`  Target: ${result.targetPath}`);
}

run();
