import { expect, test } from "@playwright/test";
import { formatDecisionMoney } from "@optimitron/obg";
import { usDecisionAnalysis } from "../src/data/us-decision-analysis";

test("policy navigation shows calculated uncertainty and retains earlier hypotheses", async ({ page }) => {
  await page.goto("/?logout=1");
  await page.getByRole("main").getByRole("link", { name: "Compare policies", exact: true }).click();
  await expect(page).toHaveURL(/\/opg(?:\?|$)/);
  await page.getByLabel("Category", { exact: true }).selectOption("health_research");
  await page.getByRole("link", { name: "Pragmatic Clinical Trial Funding Reform", exact: true }).click();
  // Every /opg card carries the same region label, so the locator below matches
  // twice until the soft navigation lands. Wait for the detail route first.
  await expect(page).toHaveURL(/\/opg\/pragmatic-clinical-trial-funding-reform(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Pragmatic Clinical Trial Funding Reform", exact: true })).toBeVisible();
  const estimates = page.getByRole("region", { name: "Modeled policy benefits" });
  await expect(estimates).toContainText("90% model range:");
  await expect(estimates).toContainText("US healthy years gained over 20 years");
  await expect(estimates).not.toContainText("NaN");
  await estimates.getByText("Inputs, sources and uncertainty", { exact: true }).click();
  await expect(estimates).toContainText("0 / 0.5 / 1");
  await page.getByText("Earlier hypotheses retained for comparison", { exact: true }).click();
  const assumptions = page.locator("section").filter({ has: page.getByRole("heading", { name: "Scenario assumptions" }) });
  await expect(assumptions).toBeVisible();
  await expect(assumptions.locator("dd")).toHaveText(["+5%", "+30%"]);
  await expect(page.getByRole("main")).not.toContainText(/\+36mo|\+0\.30 years|\+\$719/);
});

test("program scenarios stay separate from the budget objective and match their download", async ({ page }) => {
  await page.goto("/obg?logout=1");
  const result = page.getByRole("region", { name: "Program funding scenario" });
  await expect(result).not.toBeVisible();
  await page.getByText("Program funding scenarios", { exact: true }).click();
  await expect(result).toBeVisible();
  await expect(result).toContainText("median healthspan");
  await expect(result).toContainText("90% model range:");
  const response = await page.request.get("/reports/us-budget-policy-decision.md");
  expect(response.ok()).toBeTruthy();
  const markdown = await response.text();
  const chosen = usDecisionAnalysis.scenarios.find(scenario => scenario.id === usDecisionAnalysis.recommendedScenarioId)!;
  await expect(result).toContainText(formatDecisionMoney(chosen.netBenefit.mean));
  expect(markdown).toContain(`Expected net present benefit: ${formatDecisionMoney(chosen.netBenefit.mean)}`);
  for (const allocation of chosen.allocations) {
    const row = result.getByRole("row").filter({ hasText: allocation.name });
    await expect(row.getByRole("cell").last()).toHaveText(formatDecisionMoney(allocation.amountUsd));
    expect(markdown).toContain(`| ${allocation.name} | ${formatDecisionMoney(allocation.amountUsd)} |`);
  }
  expect(markdown).toContain("Full budget ledger");
  expect(markdown).toContain("Inputs and sources");
  expect(markdown).not.toContain("NaN");
  const policyLinks = await result.getByRole("table").first().getByRole("link").evaluateAll(links => links.map(link => link.getAttribute("href")!));
  expect(policyLinks).toHaveLength(chosen.allocations.length);
  for (const href of policyLinks) {
    await page.goto(href);
    await expect(page.getByRole("region", { name: "Modeled policy benefits" })).toBeVisible();
  }
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
