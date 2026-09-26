import { defineConfig } from "@playwright/test"
import { fileURLToPath } from "node:url"
import { createSurveyAuthConfig } from "../trialabundancesurvey/tests/e2e/config"

const appRoot = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  ...createSurveyAuthConfig(appRoot, "warondisease.org"),
  testDir: "./tests/e2e",
  testMatch: "allocation-persistence.spec.ts",
  timeout: 120_000,
})
