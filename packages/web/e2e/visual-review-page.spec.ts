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

test("new routes show their after-only screenshot", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  execFileSync(process.execPath, [SMOKE_SCRIPT], {
    cwd: WEB_ROOT,
    stdio: "inherit",
  });
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
  await expect(
    page.getByText("No screenshots for this viewport."),
  ).toHaveCount(0);
});
