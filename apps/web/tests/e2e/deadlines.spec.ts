import { test, expect } from "@playwright/test";

test.describe("Deadlines page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/deadlines");
  });

  test("page loads", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /deadline/i });
    await expect(heading).toBeVisible();
  });

  test("shows filter tabs", async ({ page }) => {
    const tabs = page.locator("[role='tab'], button").filter({
      hasText: /all|upcoming|overdue|completed/i,
    });
    await expect(tabs.first()).toBeVisible();
  });

  test("shows deadline items", async ({ page }) => {
    const items = page.locator("table tbody tr, [role='listitem'], [data-testid*='deadline']");
    await expect(items.first()).toBeVisible();
  });
});
