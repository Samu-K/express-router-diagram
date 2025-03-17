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
  await page
    .locator("g")
    .filter({ hasText: /^usersGETPOST$/ })
    .locator("text")
    .nth(1)
    .click({
      button: "right"
    });
  await expect(
    page
      .locator("g")
      .filter({ hasText: /^usersGETPOST$/ })
      .locator("text")
      .nth(1)
  ).toBeVisible();
  await expect(page.getByText("POST").nth(3)).toBeVisible();
  await expect(page.locator("#diagram-container").getByText("PUT")).toBeVisible();
  await expect(page.locator("#diagram-container").getByText("DELETE")).toBeVisible();
});
