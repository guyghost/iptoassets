import { test, expect } from "@playwright/test";

test.describe("Assets page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/assets");
  });

  test("loads with title IP Assets", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /IP Assets/i });
    await expect(heading).toBeVisible();
  });

  test("filter buttons are visible", async ({ page }) => {
    const filters = page.locator("button").filter({ hasText: /all|patent|trademark|copyright/i });
    await expect(filters.first()).toBeVisible();
  });

  test("asset table has rows", async ({ page }) => {
    const rows = page.locator("table tbody tr, [role='row']");
    await expect(rows.first()).toBeVisible();
  });

  test("clicking an asset navigates to detail page", async ({ page }) => {
    const firstAssetLink = page.locator("table tbody tr a, [role='row'] a").first();
    await firstAssetLink.click();
    await expect(page).toHaveURL(/\/assets\/.+/);
  });
});
