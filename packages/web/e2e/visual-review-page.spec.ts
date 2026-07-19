import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const WEB_ROOT = path.resolve(__dirname, "..");
const SMOKE_SCRIPT = path.join(
  WEB_ROOT,
  "scripts",
  "visual-review-page.smoke.mjs",
);
const SMOKE_HTML = path.join(WEB_ROOT, "output", "visual-page-smoke.html");
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.describe.configure({ mode: "serial" });

test.beforeAll(({}, workerInfo) => {
  if (workerInfo.project.name !== "default") return;

  execFileSync(process.execPath, [SMOKE_SCRIPT], {
    cwd: WEB_ROOT,
    stdio: "inherit",
  });
});

test("new routes show their after-only screenshot", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.route("**/assets/after/default/calendar.png", (route) =>
    route.fulfill({
      body: ONE_PIXEL_PNG,
      contentType: "image/png",
      status: 200,
    }),
  );

  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=calendar`);

  await expect(
    page.getByText(
      "This route has no baseline screenshot yet. Showing the version from this PR.",
    ),
  ).toBeVisible();
  await expect(
    page.locator('img[src$="assets/after/default/calendar.png"]'),
  ).toBeVisible();
  await expect(page.getByText("No screenshots for this viewport.")).toHaveCount(
    0,
  );
});

test("collapsed variant routes remain available while filtering", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.goto(pathToFileURL(SMOKE_HTML).toString());

  const variantToggle = page.getByRole("button", {
    name: /Other variants \(1\)/,
  });
  await expect(variantToggle).toBeVisible();

  const routeFilter = page.getByRole("searchbox", { name: "Filter routes" });
  await routeFilter.fill("dfda");
  await expect(variantToggle).toBeVisible();

  await variantToggle.click();
  await expect(routeFilter).toHaveValue("dfda");
  const variantRoute = page.locator('[data-route="variant-dfda-home"]');
  await expect(variantRoute).toBeVisible();
  await expect(page.locator('[data-route="home"]')).toBeHidden();

  await variantRoute.click();
  await page
    .getByRole("button", { name: "Load live compare (production + preview link)" })
    .click();
  await expect(page.locator('iframe[src="https://dfda.earth/"]')).toHaveCount(1);
});
