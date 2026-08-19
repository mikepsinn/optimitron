import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  forceAnimationsComplete,
  prepareFullPageVisualCapture,
} from "./utils/audit-helpers";

const WEB_ROOT = path.resolve(__dirname, "..");
const SMOKE_SCRIPT = path.join(
  WEB_ROOT,
  "scripts",
  "visual-review-page.smoke.mjs",
);
const SMOKE_HTML = path.join(WEB_ROOT, "output", "visual-page-smoke.html");
const SITE_APPS_SMOKE_HTML = path.join(
  WEB_ROOT,
  "output",
  "visual-page-site-apps-smoke.html",
);
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

test("animation normalization stays applied through later Framer updates", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.setContent(
    '<div id="reveal" style="opacity: 0; transform: translateY(30px)">Text</div>',
  );
  const reveal = page.locator("#reveal");

  await forceAnimationsComplete(page);
  await reveal.evaluate((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
  });

  await expect(reveal).toHaveAttribute("data-visual-force-visible", "");
  await expect(reveal).toHaveCSS("opacity", "1");
  await expect(reveal).toHaveCSS("transform", "none");
});

test("full-page preparation completes scroll state and loads a lazy embed", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.route("https://visual.test/embed", (route) =>
    route.fulfill({
      body: '<main id="embed-ready">Loaded survey embed</main>',
      contentType: "text/html",
      status: 200,
    }),
  );
  await page.setContent(`
    <div style="height: 12000px">Scroll-driven page</div>
    <iframe
      id="lazy-embed"
      title="Lazy embed"
      loading="lazy"
      src="https://visual.test/embed"
      style="height: 800px"
    ></iframe>
    <script>
      const updateVisualState = () => {
        document.body.dataset.scrollState =
          window.scrollY >= 8000 ? "complete" : "initial";
        if (window.scrollY > 0) {
          const growth = document.createElement("div");
          growth.style.height = "1000px";
          document.body.append(growth);
        }
      };
      window.addEventListener("scroll", updateVisualState, { passive: true });
      window.addEventListener("optimitron:visual-capture", () => {
        document.body.dataset.scrollState = "complete";
      });
      updateVisualState();
    </script>
  `);

  await prepareFullPageVisualCapture(page);

  await expect(page.locator("body")).toHaveAttribute(
    "data-scroll-state",
    "complete",
  );
  await expect(
    page.frameLocator("#lazy-embed").locator("#embed-ready"),
  ).toHaveText("Loaded survey embed");
  await expect(page.locator("#lazy-embed")).toHaveAttribute("loading", "eager");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
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
  await expect(
    page.locator("#hdr").getByText("1 baseline missing", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('[data-route="calendar"] .dot.changed'),
  ).toHaveCount(0);
  await expect(page.getByText("No screenshots for this viewport.")).toHaveCount(
    0,
  );
});

test("screenshots open in a keyboard-friendly lightbox", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.route("**/assets/after/default/home.png", (route) =>
    route.fulfill({
      body: ONE_PIXEL_PNG,
      contentType: "image/png",
      status: 200,
    }),
  );
  await page.route("**/assets/before/default/home.png", (route) =>
    route.fulfill({
      body: ONE_PIXEL_PNG,
      contentType: "image/png",
      status: 200,
    }),
  );

  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=home`);
  await page.getByRole("button", { name: "Zoom after" }).click();

  const lightbox = page.getByRole("dialog");
  await expect(lightbox).toBeVisible();
  await expect(page.locator("#shot-lightbox-title")).toHaveText(
    "After — Desktop",
  );
  await expect(page.locator("#shot-lightbox-image")).toHaveAttribute(
    "src",
    "assets/after/default/home.png",
  );

  await page.getByRole("button", { name: "Actual pixels" }).click();
  await expect(page.locator("#shot-lightbox-image")).toHaveClass(/actual-size/);
  await expect(page.getByRole("button", { name: "Fit width" })).toBeVisible();

  const stage = page.locator("#shot-lightbox-stage");
  await page.locator("#shot-lightbox-image").evaluate((image) => {
    image.style.width = "2000px";
    image.style.height = "2000px";
  });
  await stage.evaluate((element) => element.scrollTo(120, 160));
  await expect
    .poll(() =>
      stage.evaluate((element) => ({
        left: element.scrollLeft,
        top: element.scrollTop,
      })),
    )
    .toEqual({ left: 120, top: 160 });

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Zoom after" }).click();
  await expect
    .poll(() =>
      stage.evaluate((element) => ({
        left: element.scrollLeft,
        top: element.scrollTop,
      })),
    )
    .toEqual({ left: 0, top: 0 });

  await page.keyboard.press("Escape");
  await expect(lightbox).toBeHidden();

  await page.getByRole("button", { name: "Full page" }).click();
  const afterImage = page.getByRole("button", {
    name: "Open After — this PR full size",
  });
  await afterImage.focus();
  await afterImage.press("Enter");
  await expect(lightbox).toBeVisible();
});

test("mobile review chrome stays compact and exposes controls on demand", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=home`);

  const header = page.locator("#hdr");
  const verdictBar = page.locator(".verdict-bar");
  const screenshotCard = page.locator("section.card").first();

  await expect(page.getByRole("button", { name: "Copy PR comment" })).toBeHidden();
  await expect(page.locator(".toolbar")).toBeHidden();
  await expect(page.locator("#note-input")).toBeHidden();
  expect((await header.boundingBox())?.height).toBeLessThanOrEqual(56);
  expect((await verdictBar.boundingBox())?.height).toBeLessThanOrEqual(56);
  expect((await screenshotCard.boundingBox())?.y).toBeLessThan(320);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);

  await page.locator(".header-tools > summary").click();
  await expect(page.getByRole("button", { name: "Copy PR comment" })).toBeVisible();
  await page.locator(".verdict-bar").click({ position: { x: 1, y: 1 } });
  await expect(page.getByRole("button", { name: "Copy PR comment" })).toBeHidden();

  await page.locator(".header-tools > summary").click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Copy PR comment" })).toBeHidden();

  await page.locator(".route-tools > summary").click();
  await expect(page.locator(".toolbar")).toBeVisible();
  await page.locator(".route-tools > summary").click();

  await page.locator(".verdict-more > summary").click();
  await expect(page.locator("#note-input")).toBeVisible();
  await page.locator("#note-input").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#note-input")).toBeHidden();
});

test("Escape preserves always-visible desktop review controls", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=home`);
  await page.locator("#note-input").focus();
  await page.keyboard.press("Escape");

  await expect(page.locator(".header-tools")).toHaveAttribute("open", "");
  await expect(page.locator(".route-tools")).toHaveAttribute("open", "");
  await expect(page.locator(".verdict-more")).toHaveAttribute("open", "");
  await expect(page.getByRole("button", { name: "Copy PR comment" })).toBeVisible();
  await expect(page.locator(".toolbar")).toBeVisible();
  await expect(page.locator("#note-input")).toBeVisible();
});

test("compatibility routes remain available while filtering", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.goto(pathToFileURL(SMOKE_HTML).toString());

  const optimitronRows = page.locator(
    'details[data-owner-key="optimitron"] .route-row',
  );
  await expect(optimitronRows.nth(0)).toHaveAttribute("data-route", "home");
  await expect(optimitronRows.nth(1)).toHaveAttribute("data-route", "prize");
  await expect(optimitronRows.nth(2)).toHaveAttribute("data-route", "calendar");

  const compatibility = page.locator(
    'details.rail-group[data-key="compatibility"]',
  );
  await expect(compatibility.locator(":scope > summary")).toHaveText(
    "Compatibility checks (1)",
  );
  await expect(compatibility).not.toHaveAttribute("open", "");

  const routeFilter = page.getByRole("searchbox", { name: "Filter routes" });
  await routeFilter.fill("dfda");
  await expect(compatibility).toHaveAttribute("open", "");
  await expect(routeFilter).toHaveValue("dfda");
  const variantRoute = page.locator('[data-route="variant-dfda-home"]');
  await expect(variantRoute).toBeVisible();
  await expect(page.locator('[data-route="home"]')).toBeHidden();

  await variantRoute.click();
  await page
    .getByRole("button", {
      name: "Load live compare (production + preview link)",
    })
    .click();
  await expect(page.locator('iframe[src="https://dfda.earth/"]')).toHaveCount(
    1,
  );
});

test("seven peer apps are separated into collapsible groups", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.goto(pathToFileURL(SITE_APPS_SMOKE_HTML).toString());

  const siteApps = page.locator('.rail-group[data-key="apps"]');
  await expect(siteApps.locator(".rail-group-h")).toHaveText("Apps (7)");

  const warOnDisease = siteApps.locator(
    'details[data-owner-key="warondisease"]',
  );
  const optimitron = siteApps.locator(
    'details[data-owner-key="optimitron"]',
  );
  const dfda = siteApps.locator('details[data-owner-key="dfda"]');
  await expect(siteApps.locator(":scope > details.rail-app").nth(0)).toHaveAttribute(
    "data-owner-key",
    "warondisease",
  );
  await expect(siteApps.locator(":scope > details.rail-app").nth(1)).toHaveAttribute(
    "data-owner-key",
    "optimitron",
  );
  const warOnDiseaseHome = warOnDisease.locator(
    '[data-route="site-app-warondisease-home"]',
  );
  const dfdaHome = dfda.locator('[data-route="site-app-dfda-home"]');

  await expect(warOnDisease).toHaveAttribute("open", "");
  await expect(warOnDiseaseHome).toBeVisible();
  await expect(optimitron).toBeVisible();
  await expect(optimitron).not.toHaveAttribute("open", "");
  await expect(dfda).not.toHaveAttribute("open", "");
  await expect(dfdaHome).toBeHidden();

  await dfda.locator("summary").click();
  await expect(dfda).toHaveAttribute("open", "");
  await expect(dfdaHome).toBeVisible();

  await warOnDisease.locator("summary").click();
  await expect(warOnDisease).not.toHaveAttribute("open", "");
  await expect(warOnDiseaseHome).toBeHidden();

  const routeFilter = page.getByRole("searchbox", { name: "Filter routes" });
  await routeFilter.fill("warondisease");
  await expect(siteApps.locator(".rail-group-h")).toHaveText("Apps (1/7)");
  await expect(warOnDisease).toHaveAttribute("open", "");
  await expect(warOnDiseaseHome).toBeVisible();
  await expect(dfda).toBeHidden();

  await routeFilter.fill("");
  await expect(warOnDisease).not.toHaveAttribute("open", "");
  await expect(dfda).toHaveAttribute("open", "");

  await page.goto(
    `${pathToFileURL(SITE_APPS_SMOKE_HTML)}#route=site-app-dfda-home`,
  );
  await expect(dfda).toHaveAttribute("open", "");
  await expect(dfdaHome).toBeVisible();
});

test("route verdicts persist and advance through every unreviewed route", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=variant-dfda-home`);

  const approve = () =>
    page.getByRole("button", { name: "Looks right 👍", exact: true }).click();

  await approve();
  await expect(page).toHaveURL(/#route=home$/);
  await expect(page.getByRole("status")).toContainText("Saved locally 👍");
  await expect(page.getByRole("status")).toContainText("Next unreviewed: Home");

  await approve();
  await expect(page).toHaveURL(/#route=calendar$/);

  await approve();
  await expect(page).toHaveURL(/#route=prize$/);

  await page
    .getByRole("button", { name: "Needs work 👎", exact: true })
    .click();
  await expect(page).toHaveURL(/#route=prize$/);
  await expect(page.getByRole("status")).toContainText(
    "Review pass complete. Copy the PR comment or export the notes.",
  );
  await expect(page.locator("#chip-reviewed")).toHaveText(
    "3/3 reviewed · 1 flagged",
  );

  const savedVerdicts = await page.evaluate(() => {
    const saved = localStorage.getItem(
      "visualReview:abc1234def5678900000000000000000000000ff",
    );
    return saved ? JSON.parse(saved).verdicts : null;
  });
  expect(savedVerdicts).toMatchObject({
    home: { v: "looks-right" },
    calendar: { v: "looks-right" },
    prize: { v: "needs-work" },
    "variant-dfda-home": { v: "looks-right" },
  });

  await page.reload();
  await expect(page.locator("#chip-reviewed")).toHaveText(
    "3/3 reviewed · 1 flagged",
  );
  await expect(
    page.getByRole("button", { name: "Needs work 👎", exact: true }),
  ).toHaveClass(/\bon\b/);
});

test("copies one consolidated pull request comment", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "default");

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as Window & { copiedReview?: string }).copiedReview = text;
        },
      },
    });
  });
  await page.goto(`${pathToFileURL(SMOKE_HTML)}#route=home`);
  await page
    .getByRole("button", { name: "Looks right 👍", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Copy PR comment", exact: true })
    .click();

  await expect(
    page.getByRole("button", { name: "Copied PR comment", exact: true }),
  ).toBeVisible();
  const copiedReview = await page.evaluate(
    () => (window as Window & { copiedReview?: string }).copiedReview,
  );
  expect(copiedReview).toContain("# Review notes — PR #123 (abc1234)");
  expect(copiedReview).toContain("| Home");
  expect(copiedReview).toContain("looks right");
});
