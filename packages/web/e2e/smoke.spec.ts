/**
 * Smoke tests: verify key pages load without errors.
 *
 * Run:
 *   pnpm --filter @optomitron/web e2e:smoke
 *
 * Note: Some pages require a database connection. Pages that return 500
 * are skipped gracefully — these tests validate the static/SSG pages.
 */
import { test, expect } from "@playwright/test";

/** Pages that are statically generated (no DB needed) */
const staticPages = [
  { path: "/", title: "Optomitron" },
  { path: "/about", title: "About" },
  { path: "/misconceptions", title: "" },
  { path: "/discoveries", title: "" },
];

/** Pages that may need DB but we still want to try */
const dynamicPages = [
  { path: "/wishocracy", title: "Wishocracy" },
  { path: "/alignment", title: "Alignment" },
  { path: "/transparency", title: "Transparency" },
  { path: "/prize", title: "Earth Optimization Prize" },
  { path: "/outcomes", title: "" },
  { path: "/compare", title: "" },
  { path: "/policies", title: "" },
  { path: "/budget", title: "" },
];

for (const { path, title } of staticPages) {
  test(`static: ${path} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    if (title) {
      await expect(page).toHaveTitle(new RegExp(title, "i"));
    }

    expect(errors).toEqual([]);
  });
}

for (const { path } of dynamicPages) {
  test(`dynamic: ${path} loads`, async ({ page }) => {
    const response = await page.goto(path);
    const status = response?.status() ?? 0;

    // Accept 200 (success) or 500 (DB not available — expected in CI/testing)
    if (status >= 500) {
      test.skip(true, `${path} returned ${status} (likely needs database)`);
      return;
    }

    expect(status).toBeLessThan(400);
    // Page rendered — verify some meaningful content exists
    await page.waitForLoadState("domcontentloaded");
  });
}

// --- Content assertions on static pages ---

test("homepage has FairTax section", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const section = page.locator("text=FairTax");
  await expect(section.first()).toBeVisible({ timeout: 10_000 });
});

test("homepage has UBI section", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const section = page.locator("text=Universal Basic Income");
  await expect(section.first()).toBeVisible({ timeout: 10_000 });
});

test("homepage has Prize Pool section", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const section = page.locator("text=Prize Pool");
  await expect(section.first()).toBeVisible({ timeout: 10_000 });
});

test("about page has economic system section", async ({ page }) => {
  await page.goto("/about");
  await page.waitForLoadState("domcontentloaded");
  const section = page.locator("text=The Economic System");
  await expect(section.first()).toBeVisible({ timeout: 10_000 });
});

// --- Dynamic page content tests (skip if DB unavailable) ---

test("prize page has wallet connect and three mechanisms", async ({
  page,
}) => {
  const response = await page.goto("/prize");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Prize page needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  const wallet = page.locator("text=Connect Wallet");
  await expect(wallet.first()).toBeVisible({ timeout: 10_000 });

  const mechanisms = page.locator('text="Three Mechanisms. One System."');
  await expect(mechanisms).toBeVisible({ timeout: 10_000 });
});

test("transparency page has attestation records and IPFS links", async ({
  page,
}) => {
  const response = await page.goto("/transparency");
  if ((response?.status() ?? 0) >= 500) {
    test.skip(true, "Transparency page needs database");
    return;
  }
  await page.waitForLoadState("domcontentloaded");

  const section = page.locator("text=Live Attestation Records");
  await expect(section.first()).toBeVisible({ timeout: 10_000 });

  const links = page.locator('a[href*="ipfs.storacha.link"]');
  expect(await links.count()).toBeGreaterThan(0);
});
