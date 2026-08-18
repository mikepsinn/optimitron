import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../workflows/ci.yml", import.meta.url),
  "utf8",
);

test("detects large pull-request changes from the local git checkout", () => {
  assert.match(
    workflow,
    /- name: Checkout for local change detection[\s\S]*?fetch-depth: 0[\s\S]*?filter: blob:none[\s\S]*?- name: Detect web-impacting changes[\s\S]*?uses: dorny\/paths-filter@v3[\s\S]*?token: ""/u,
  );
});
