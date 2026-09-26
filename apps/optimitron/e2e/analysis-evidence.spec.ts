import { expect, test } from "@playwright/test";

test("policy navigation retains assumptions in their declared units", async ({ page }) => {
  await page.goto("/?logout=1");
  await page.getByRole("main").getByRole("link", { name: "Compare policies", exact: true }).click();
  await expect(page).toHaveURL(/\/opg(?:\?|$)/);
  await page.getByLabel("Category", { exact: true }).selectOption("health_research");
  await page.getByRole("link", { name: "Pragmatic Clinical Trial Funding Reform", exact: true }).click();
  const assumptions = page.locator("section").filter({ has: page.getByRole("heading", { name: "Scenario assumptions" }) });
  await expect(assumptions).toBeVisible();
  await expect(assumptions.locator("dd")).toHaveText(["+5%", "+30%"]);
  await expect(page.getByRole("main")).not.toContainText(/\+36mo|\+0\.30 years|\+\$719/);
});

test("budget comparisons cannot turn overlapping national gaps into a dividend", async ({ page }) => {
  await page.goto("/obg?logout=1");
  const cards = page.getByRole("region", { name: "National spending comparisons" }).locator("article");
  const fields = await cards.evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(fields.length).toBeGreaterThan(0);
  expect(new Set(fields).size).toBe(fields.length);
  await page.getByText("Federal spending context", { exact: true }).click();
  await page.getByRole("link", { name: "Military", exact: true }).last().click();
  await expect(page).toHaveURL(/\/obg\/military(?:\?|$)/);
  await expect(page.getByRole("main")).not.toContainText(/Optimal allocation|81\.1%|718\.83/);
  await page.goto("/dividend?logout=1");
  await expect(page.getByRole("heading", { name: "A dividend estimate is not yet available" })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText(/\$25\.3T|98,246|8,187/);
  await expect(page.getByRole("spinbutton")).toHaveCount(0);
});
