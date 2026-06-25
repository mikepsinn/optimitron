import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const DEMO_EMAIL = "demo@thinkbynumbers.org";

const anonymizationSql = readFileSync(
  new URL("../../packages/db/prisma/anonymization-updates.sql", import.meta.url),
  "utf8",
);
const verifierScript = readFileSync(
  new URL("../../packages/web/scripts/verify-preview-masking.mjs", import.meta.url),
  "utf8",
);

test("preview anonymization preserves the managed demo login fixture", () => {
  assert.match(
    anonymizationSql,
    new RegExp(
      `UPDATE public\\."User" SET "email" = [^;]+WHERE "email" IS NOT NULL AND "email" <> '${DEMO_EMAIL}';`,
      "u",
    ),
  );
  assert.match(
    anonymizationSql,
    new RegExp(
      `UPDATE public\\."User" SET "password" = NULL WHERE "password" IS NOT NULL AND "email" <> '${DEMO_EMAIL}';`,
      "u",
    ),
  );
  assert.match(
    anonymizationSql,
    new RegExp(
      `UPDATE public\\."User" SET "referralCode" = [^;]+WHERE "referralCode" IS NOT NULL AND "email" <> '${DEMO_EMAIL}';`,
      "u",
    ),
  );
});

test("preview masking verifier requires the demo account to remain sign-in capable", () => {
  assert.match(verifierScript, /name: "User\.demoAccount"/u);
  assert.match(
    verifierScript,
    /password IS NOT NULL AND "referralCode" = 'DEMO'/u,
  );
});
