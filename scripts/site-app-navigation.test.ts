import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

function listPageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listPageFiles(entryPath);
    return /^page\.(?:tsx|ts|jsx|js)$/.test(entry.name) ? [entryPath] : [];
  });
}

function isAuthenticatedPage(filePath: string) {
  const normalized = normalizePath(path.relative(repoRoot, filePath));
  if (/^apps\/[^/]+\/app\/(?:admin|dashboard|profile)(?:\/|$)/.test(normalized)) {
    return true;
  }

  const source = readFileSync(filePath, "utf8");
  return /\b(?:requireAdmin|requireAuth|requireOrganizationAccess|requireUser|getCurrentUser)\s*\(/.test(
    source,
  );
}

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

test("every authenticated site-app page has visual coverage or a documented exemption", async () => {
  const {
    authenticatedSiteAppRouteExemptions,
    authenticatedSiteAppRoutes,
  } = await import("./site-app-visual-routes.mjs");

  const declaredPages = new Set<string>();
  const routeNames = new Set<string>();

  for (const [appName, routes] of Object.entries(authenticatedSiteAppRoutes)) {
    assert.ok(routes.length > 0, `${appName} must declare at least one authenticated route`);
    for (const route of routes) {
      assert.equal(route.authenticated, true, `${appName}:${route.routeName} must be authenticated`);
      assert.ok(route.authRole, `${appName}:${route.routeName} must name its auth role`);
      assert.ok(route.routePath.startsWith("/"), `${appName}:${route.routeName} must use an absolute route path`);
      assert.ok(route.sourcePage, `${appName}:${route.routeName} must name its source page`);
      assert.ok(route.covers.includes(route.sourcePage), `${appName}:${route.routeName} must cover its source page`);
      assert.ok(
        existsSync(path.join(repoRoot, route.sourcePage)),
        `${appName}:${route.routeName} references missing page ${route.sourcePage}`,
      );

      const uniqueRouteName = `${appName}:${route.routeName}`;
      assert.ok(!routeNames.has(uniqueRouteName), `Duplicate visual route ${uniqueRouteName}`);
      routeNames.add(uniqueRouteName);
      declaredPages.add(route.sourcePage);
    }
  }

  const exemptPages = new Set<string>();
  for (const exemption of authenticatedSiteAppRouteExemptions) {
    assert.ok(exemption.reason?.trim(), `${exemption.sourcePage} needs an exemption reason`);
    assert.ok(
      existsSync(path.join(repoRoot, exemption.sourcePage)),
      `Exemption references missing page ${exemption.sourcePage}`,
    );
    exemptPages.add(exemption.sourcePage);
  }

  const authenticatedPages = readdirSync(path.join(repoRoot, "apps"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => listPageFiles(path.join(repoRoot, "apps", entry.name, "app")))
    .filter(isAuthenticatedPage)
    .map((filePath) => normalizePath(path.relative(repoRoot, filePath)))
    .sort();

  const missing = authenticatedPages.filter(
    (filePath) => !declaredPages.has(filePath) && !exemptPages.has(filePath),
  );
  assert.deepEqual(
    missing,
    [],
    `Authenticated pages need desktop/mobile screenshots or an exemption:\n${missing.join("\n")}`,
  );
});
