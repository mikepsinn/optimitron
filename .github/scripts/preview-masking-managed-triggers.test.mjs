import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const MANAGED_TRIGGER_KEYS = [
  "user-onboarding:treaty",
  "referral:vote-invitation",
  "treaty:signer-reminder",
  "treaty:ratify",
  "user-onboarding:treaty:hmt-gate",
  "treaty:signer",
];

const anonymizationSql = readFileSync(
  new URL("../../packages/db/prisma/anonymization-updates.sql", import.meta.url),
  "utf8",
);
const verifierScript = readFileSync(
  new URL("../../packages/web/scripts/verify-preview-masking.mjs", import.meta.url),
  "utf8",
);

test("preview anonymization preserves managed task-trigger blueprints", () => {
  assert.match(
    anonymizationSql,
    /Preserve repository-owned managed trigger blueprints/u,
  );

  for (const key of MANAGED_TRIGGER_KEYS) {
    assert.ok(
      anonymizationSql.includes(`'${key}'`),
      `missing managed trigger exemption for ${key}`,
    );
  }

  assert.match(
    anonymizationSql,
    /UPDATE public\."TaskTrigger" SET "eventFilter" = [^;]+AND "triggerKey" NOT IN/u,
  );
  assert.match(
    anonymizationSql,
    /UPDATE public\."TaskSpawnSpec" SET "titleTemplate" = [^;]+SELECT "id" FROM public\."TaskTrigger" WHERE "triggerKey" IN/u,
  );
});

test("preview masking verifier catches a scrubbed onboarding trigger", () => {
  assert.match(verifierScript, /name: "TaskTrigger\.userOnboardingTreaty"/u);
  assert.match(verifierScript, /name: "TaskSpawnSpec\.userOnboardingTreaty"/u);
  assert.match(verifierScript, /program:one-percent-treaty:user:\{\{user\.id\}\}/u);
  assert.match(verifierScript, /"eventFilter" = 'null'::jsonb/u);
  assert.match(verifierScript, /Give your first human the 1% Treaty voting task/u);
});
