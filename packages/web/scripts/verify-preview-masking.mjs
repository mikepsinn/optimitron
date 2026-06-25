#!/usr/bin/env node
// Post-anonymization smoke check for Neon preview branches.
//
// Runs AFTER Apply preview database anonymization and asserts that
// a sample of high-risk PII columns actually contains masked shapes,
// not real prod data. The anonymization step itself can succeed at the
// API level (state "anonymized") while leaving rows untouched if the
// rules silently mismatch the live schema (column renames, new tables,
// upstream extension changes). This is the cheap belt-and-braces gate.
//
// Fails closed on:
//   - any sampled row in a tracked column NOT matching the masked shape
//   - zero rows in a column we expect to be populated on a prod-fork
//
// Exit codes:
//   0  all checks pass
//   1  at least one check failed; real prod data may be on this preview
//   2  config error (missing DATABASE_URL) — environment problem, not a leak signal

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("::error::DATABASE_URL[_UNPOOLED] is required to verify preview masking.");
  process.exit(2);
}

const HASH_HEX = /^[a-f0-9]{4,}$/;
const DEMO_EMAIL = "demo@thinkbynumbers.org";

const checks = [
  {
    name: "Person.handle",
    sql: `SELECT handle FROM "Person" WHERE handle IS NOT NULL AND email IS DISTINCT FROM '${DEMO_EMAIL}' LIMIT 25`,
    column: "handle",
    expected: "starts with 'person-' followed by hex hash",
    test: (value) => typeof value === "string" && value.startsWith("person-") && HASH_HEX.test(value.slice("person-".length)),
    requireRows: true,
  },
  {
    name: "Person.email",
    sql: `SELECT email FROM "Person" WHERE email IS NOT NULL AND email <> '${DEMO_EMAIL}' LIMIT 25`,
    column: "email",
    expected: "person-<hex>@preview.invalid",
    test: (value) => typeof value === "string" && /^person-[a-f0-9]+@preview\.invalid$/.test(value),
    requireRows: false,
  },
  {
    name: "Person.bio",
    sql: 'SELECT bio FROM "Person" WHERE bio IS NOT NULL LIMIT 25',
    column: "bio",
    expected: "exactly '[preview redacted]'",
    test: (value) => value === "[preview redacted]",
    requireRows: false,
  },
  {
    name: "User.email",
    sql: `SELECT email FROM "User" WHERE email IS NOT NULL AND email <> '${DEMO_EMAIL}' LIMIT 25`,
    column: "email",
    expected: "user-<hex>@preview.invalid",
    test: (value) => typeof value === "string" && /^user-[a-f0-9]+@preview\.invalid$/.test(value),
    requireRows: true,
  },
  {
    name: "User.password",
    sql: `SELECT password FROM "User" WHERE email IS DISTINCT FROM '${DEMO_EMAIL}' LIMIT 25`,
    column: "password",
    expected: "NULL",
    test: (value) => value === null,
    requireRows: true,
  },
  {
    name: "User.referralCode",
    sql: `SELECT "referralCode" FROM "User" WHERE "referralCode" IS NOT NULL AND email <> '${DEMO_EMAIL}' LIMIT 25`,
    column: "referralCode",
    expected: "ref-<hex>",
    test: (value) => typeof value === "string" && value.startsWith("ref-") && HASH_HEX.test(value.slice("ref-".length)),
    requireRows: false,
  },
  {
    name: "User.demoAccount",
    sql: `SELECT CASE WHEN password IS NOT NULL AND "referralCode" = 'DEMO' THEN 'ok' ELSE 'bad' END AS status FROM "User" WHERE email = '${DEMO_EMAIL}' LIMIT 1`,
    column: "status",
    expected: "demo account present with password and DEMO referralCode",
    test: (value) => value === "ok",
    requireRows: true,
  },
  {
    name: "TaskComment.message",
    sql: 'SELECT message FROM "TaskComment" LIMIT 25',
    column: "message",
    expected: "exactly '[preview redacted]'",
    test: (value) => value === "[preview redacted]",
    requireRows: false,
  },
  {
    name: "ReferralInvitation.messageText",
    sql: 'SELECT "messageText" FROM "ReferralInvitation" WHERE "messageText" IS NOT NULL LIMIT 25',
    column: "messageText",
    expected: "exactly '[preview redacted]'",
    test: (value) => value === "[preview redacted]",
    requireRows: false,
  },
];

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 30_000,
});

let failed = false;

try {
  await client.connect();

  for (const check of checks) {
    const { rows } = await client.query(check.sql);
    if (rows.length === 0) {
      if (check.requireRows) {
        console.error(
          `::error::${check.name}: zero rows returned. Preview branch should be a prod fork with populated data. Either the fork is empty (CI/Neon setup broken) or masking dropped the rows.`,
        );
        failed = true;
      } else {
        console.log(`${check.name}: 0 rows (column is optional on a fresh prod-fork — skipped).`);
      }
      continue;
    }

    const violators = rows.filter((row) => !check.test(row[check.column]));
    if (violators.length > 0) {
      console.error(
        `::error::${check.name}: ${violators.length}/${rows.length} rows fail mask check. Expected ${check.expected}. Sample values are intentionally suppressed to avoid leaking production data into CI logs.`,
      );
      failed = true;
    } else {
      console.log(`${check.name}: ${rows.length}/${rows.length} rows match (${check.expected}).`);
    }
  }
} catch (error) {
  console.error(`::error::Preview masking smoke check threw: ${error.message}`);
  failed = true;
} finally {
  await client.end().catch(() => {});
}

if (failed) {
  console.error(
    "::error::Preview masking smoke check FAILED. Real prod PII may be exposed on this Neon preview branch. Do NOT promote any artifacts (screenshots, log dumps, anonymized-status pages). Investigate the masking pipeline before re-running.",
  );
  process.exit(1);
}

console.log("Preview masking smoke check: all sampled PII columns are correctly masked.");
