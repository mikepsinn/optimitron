import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET ??=
  "test-secret-minimum-32-characters-long-for-validation";
process.env.NEXTAUTH_URL ??= "http://127.0.0.1:3001";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const pageExtensions = ["tsx", "ts", "jsx", "js"];

test("every internal site-app navigation route has a Next.js page", async (t) => {
  const { getInternalNavigationRoutesForVariant, VARIANTS } = await import(
    "../packages/site-kit/src/lib/site-config.ts"
  );
  const apps = [
    ["warondisease", VARIANTS.WAR_ON_DISEASE],
    ["dfda", VARIANTS.DFDA],
    ["wishocracy", VARIANTS.WISHOCRACY],
    ["trialabundancesurvey", VARIANTS.SURVEY],
    ["curedao", VARIANTS.CUREDAO],
    ["acceleratedmedicine", VARIANTS.ACCELERATED_MEDICINE],
  ] as const;

  for (const [appName, siteVariant] of apps) {
    await t.test(appName, () => {
      const routes = getInternalNavigationRoutesForVariant(siteVariant);
      assert.ok(routes.length > 0, `${appName} must expose at least one route`);

      for (const route of routes) {
        const routeSegments =
          route.path === "/" ? [] : route.path.slice(1).split("/");
        const pageStem = path.join(
          repoRoot,
          "apps",
          appName,
          "app",
          ...routeSegments,
          "page",
        );
        const pageExists = pageExtensions.some((extension) =>
          existsSync(`${pageStem}.${extension}`),
        );
        assert.ok(
          pageExists,
          `${appName} navigation links to ${route.path}, but no page exists at ${pageStem}.{${pageExtensions.join(",")}}`,
        );
      }
    });
  }
});
