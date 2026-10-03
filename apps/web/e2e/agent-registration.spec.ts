import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("registration draft survives reload, supports keyboard and 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/agents");
  const register = page.getByRole("link", { name: "Register agent", exact: true });
  await register.focus(); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/agents\/new/);
  await page.getByLabel("Agent name", { exact: true }).fill("Acceptance agent");
  await page.getByLabel("Description", { exact: true }).fill("Inactive identity for testing");
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByLabel("Agent name", { exact: true })).toHaveValue("Acceptance agent");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Sign in with Privy" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
