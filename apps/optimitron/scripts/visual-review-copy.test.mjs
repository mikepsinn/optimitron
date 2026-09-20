import assert from "node:assert/strict";
import test from "node:test";
import { getVisualCopySnapshot } from "./visual-review-copy.mjs";

test("same-path app pages cannot consume Optimitron's source or rendered copy", () => {
  const web = getVisualCopySnapshot({ routePath: "/mcp" });
  const dfda = getVisualCopySnapshot({ routePath: "/mcp", appName: "dfda" });
  const war = getVisualCopySnapshot({ routePath: "/mcp", appName: "warondisease" });
  assert.equal(web.repoRelativePath, "apps/optimitron/src/app/mcp/page.logged-out.md");
  assert.equal(dfda.repoRelativePath, "apps/dfda/app/mcp/page.logged-out.md");
  assert.equal(war.repoRelativePath, "apps/warondisease/app/mcp/page.logged-out.md");
  assert.equal(new Set([web, dfda, war].map((snapshot) => snapshot.artifactRelativePath)).size, 3);
  assert.equal(web.artifactRelativePath, "mcp/page.logged-out.md");
});

test("home and authenticated copy retain app ownership and ignore URL state", () => {
  assert.equal(getVisualCopySnapshot({ routePath: "/?logout=1", appName: "dfda" }).repoRelativePath,
    "apps/dfda/app/page.logged-out.md");
  assert.equal(getVisualCopySnapshot({ routePath: "/dashboard?login=demo#main", appName: "courtofhumanity", authenticated: true }).repoRelativePath,
    "apps/courtofhumanity/app/dashboard/page.logged-in.md");
});
