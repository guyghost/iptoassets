import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads and shows greeting", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/IPMS|IP/i);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigation links exist", async ({ page }) => {
    await page.goto("/");

    const navLinks = ["Home", "Assets", "Portfolios", "Deadlines", "Documents"];

    for (const linkText of navLinks) {
      const link = page.getByRole("link", { name: linkText });
      await expect(link).toBeVisible();
    }
  });

  test("clicking Assets navigates to /assets", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Assets" }).click();
    await expect(page).toHaveURL(/\/assets/);
  });

  test("clicking Portfolios navigates to /portfolios", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Portfolios" }).click();
    await expect(page).toHaveURL(/\/portfolios/);
  });

  test("clicking Deadlines navigates to /deadlines", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Deadlines" }).click();
    await expect(page).toHaveURL(/\/deadlines/);
  });

  test("clicking Documents navigates to /documents", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(/\/documents/);
  });
});
