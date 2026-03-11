import { expect, test } from "@playwright/test";

test("renders the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Empresas Modernas/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Acceso Clientes" })).toBeVisible();
});
