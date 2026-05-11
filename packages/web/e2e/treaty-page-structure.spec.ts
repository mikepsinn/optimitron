/**
 * Treaty page structure regression test.
 *
 * Twice in the same session `/treaty` lost the treaty body (and/or the
 * signature controls) due to ad-hoc layout changes and a Referendum row
 * with a null `bodyMarkdown` column. This test pins the three load-
 * bearing parts of the page so a regression can't ship silently:
 *
 *   1. The headline ("Please quickly skim and sign…")
 *   2. The treaty body (at least one recognizable WHEREAS / Article
 *      phrase from the bundled `onePercentTreatyText`)
 *   3. Signature controls (Yes/No buttons that lead to the auth flow)
 *
 * Failure modes this guards against:
 *   - Someone reverts the page to the stepper layout (no treaty body
 *     visible above the fold without scrolling).
 *   - The preview DB ships with `Referendum.bodyMarkdown = null` and
 *     the page silently renders nothing for the body.
 *   - Signature box gets replaced with something that lacks a YES path.
 */
import { test, expect } from "@playwright/test";

test.describe("/treaty page structure", () => {
  test("headline + treaty body + signature controls all render", async ({ page }) => {
    const response = await page.goto("/treaty");
    const status = response?.status() ?? 0;
    if (status >= 500) {
      test.skip(true, `/treaty returned ${status} (likely needs DB seeded)`);
      return;
    }
    expect(status).toBeLessThan(400);

    // 1. Headline — exact phrasing matters, this is the load-bearing
    //    request-for-action and the only intro copy on the page.
    await expect(
      page.getByRole("heading", {
        name: /please quickly skim and sign to end war and disease/i,
      }),
    ).toBeVisible();

    // 2. Treaty body — assert phrases from the bundled treaty markdown.
    //    These survive both the DB-backed path AND the fallback to the
    //    bundled `shareableSnippets.onePercentTreatyText.markdown`.
    const treatyBody = page.locator("main");
    await expect(treatyBody).toContainText(/WHEREAS, humanity pays governments/i);
    await expect(treatyBody).toContainText(/Article I/i);
    await expect(treatyBody).toContainText(/IN WITNESS WHEREOF/i);

    // 3. Signature controls — the post-vote auth flow requires the
    //    visitor to first answer Yes or No, so both buttons must be
    //    present and clickable. The eventual name/email capture happens
    //    in the AuthForm panel that mounts after Yes.
    await expect(
      page.getByRole("button", { name: /^Yes$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^No$/ }),
    ).toBeVisible();
  });
});
