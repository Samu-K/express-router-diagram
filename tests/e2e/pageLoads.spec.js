import { expect, test } from "@playwright/test";

// Individual tests with setup in each test
test("API root loaded", async ({ page }) => {
  await page.goto("/express-routes");
  await page.locator("g").filter({ hasText: /^API$/ }).locator("circle").click();
});

test("Children popup loads", async ({ page }) => {
  await page.goto("/express-routes");
  await page.locator("g").filter({ hasText: /^api$/ }).locator("circle").click();
  await expect(page.getByText("api × Parent API Children")).toBeVisible();
  await page.getByText("×").click();
});

test("Methods render", async ({ page }) => {
  await page.goto("/express-routes");
  await expect(
    page
      .locator("g")
      .filter({ hasText: /^GETPUTDELETE$/ })
      .locator("text")
      .first()
  ).toBeVisible();
  await expect(page.locator("#diagram-container").getByText("PUT")).toBeVisible();
  await expect(page.locator("#diagram-container").getByText("DELETE")).toBeVisible();
  await expect(page.getByText("POST", { exact: true }).nth(2)).toBeVisible();
});
