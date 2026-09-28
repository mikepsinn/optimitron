import { expect, test } from "@playwright/test";

test("country budget remembers the country, scales, and exports the selected healthcare system", async ({ page }) => {
  await page.goto("/obg?logout=1");
  const region = page.getByRole("region", { name: "Population budget", exact: true });
  const total = region.getByTestId("population-budget-total");
  const amount = async () => Number(await total.getAttribute("data-amount"));
  await region.getByLabel("Country", { exact: true }).selectOption("JPN");
  await page.reload();
  await expect(region.getByLabel("Country", { exact: true })).toHaveValue("JPN");
  await region.getByLabel("Country", { exact: true }).selectOption("custom");
  await region.getByLabel("Population", { exact: true }).fill("1000000");
  const before = await amount();
  expect(before).toBeGreaterThan(0);
  await region.getByLabel("Population", { exact: true }).fill("2000000");
  await expect.poll(async () => Math.abs(await amount() - before * 2)).toBeLessThanOrEqual(1);
  await region.getByLabel("Healthy years below the best").selectOption("1.5");
  await expect(region.getByTestId("healthcare-reference")).toHaveText("South Korea");
  await expect(region.getByTestId("budget-line-GF07")).toContainText("South Korea");
  await region.getByText("How this budget is calculated", { exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await region.getByRole("button", { name: "Download this budget" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const report = JSON.parse(Buffer.concat(chunks).toString());
  const selected = report.scenarios.find((s: { outcomeQuantile: number; maxHealthyYearGap: number }) => s.outcomeQuantile === report.selectedQuantile && s.maxHealthyYearGap === report.selectedMaxHealthyYearGap);
  expect(selected.population).toBe(2000000);
  expect(selected.annualBudget).toBeCloseTo(selected.totalPerCapita * 2000000, 3);
  expect(selected.annualBudget).toBeCloseTo(await amount(), 3);
  expect(selected.lines.find((line: { id: string }) => line.id === "GF07").peer.id).toBe("KOR");
  expect(report.selectedCountry).toBeNull();
  await region.getByLabel("Outcome target", { exact: true }).selectOption("0.95");
  const strict = report.scenarios.find((s: { outcomeQuantile: number; maxHealthyYearGap: number }) => s.outcomeQuantile === 0.95 && s.maxHealthyYearGap === report.selectedMaxHealthyYearGap);
  if (strict.complete) {
    await expect.poll(async () => Math.abs(await amount() - strict.annualBudget)).toBeLessThanOrEqual(1);
  } else {
    await expect(total).toHaveText("—");
    await expect(region.getByRole("status")).toBeVisible();
  }
  await region.getByLabel("Population", { exact: true }).fill("-1");
  await expect(region.getByRole("alert")).toBeVisible();
  await expect(region.getByRole("button", { name: "Download this budget" })).toBeDisabled();
});
