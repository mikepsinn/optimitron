import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../workflows/ci.yml", import.meta.url),
  "utf8",
);
const updaterWorkflow = readFileSync(
  new URL("../workflows/update-pr-branches.yml", import.meta.url),
  "utf8",
);

test("detects large pull-request changes from the local git checkout", () => {
  assert.match(
    workflow,
    /- name: Checkout for local change detection[\s\S]*?fetch-depth: 0[\s\S]*?filter: blob:none[\s\S]*?- name: Detect web-impacting changes[\s\S]*?uses: dorny\/paths-filter@v3[\s\S]*?token: ""/u,
  );
});

test("runs expensive validation only for affected surfaces", () => {
  assert.match(workflow, /core: \$\{\{[\s\S]*?core_files_changed/u);
  assert.match(
    workflow,
    /core-validate:[\s\S]*?fromJSON\(needs\.changes\.outputs\.core/u,
  );
  assert.match(
    workflow,
    /web-static-validate:[\s\S]*?fromJSON\(needs\.changes\.outputs\.web/u,
  );
  assert.match(
    workflow,
    /web-e2e-validate:[\s\S]*?fromJSON\(needs\.changes\.outputs\.web/u,
  );
  assert.match(
    workflow,
    /sync-preview-managed-data:[\s\S]*?needs: \[changes, web-validate, site-apps-validate\]/u,
  );
});

test("refreshes only pull requests that opt in", () => {
  assert.match(updaterWorkflow, /gh pr list[\s\S]*?--label auto-update/u);
});
