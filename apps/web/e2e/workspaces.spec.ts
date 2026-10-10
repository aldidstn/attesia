import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("workspace console is keyboard accessible at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workspaces");
  await expect(page.getByRole("heading", { name: "Workspaces" })).toBeVisible();
  await page.getByLabel("Name").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Slug")).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
