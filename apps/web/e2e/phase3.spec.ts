import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const profileId = "0x6390d5ac32ad1062bbfd9fdf21bf2cf5ae56e296e72610bf5fd93a63d3703a88";
test("public profile explains scores and distinguishes graph relationships", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/profiles/${profileId}`);
  await expect(page.getByRole("heading", { name: "Reputation by outcome" })).toBeVisible();
  const explanation = page.locator("summary", { hasText: "How these signals work" });
  await explanation.focus(); await page.keyboard.press("Enter");
  await expect(page.getByText(/Self-claims remain visible with zero external weight/)).toBeVisible();
  await expect(page.getByText("Claimed relationship", { exact: true })).toBeVisible();
  await expect(page.getByText("Attested relationship", { exact: true })).toBeVisible();
  await page.getByText("Accessible relationship list", { exact: true }).click();
  await expect(page.locator(".node-list")).toContainText("revoked");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("feed filters round-trip and explain neutral workspace relevance", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByLabel("Community", { exact: true }).fill("acceptance-no-match");
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(page).toHaveURL(/community=acceptance-no-match/);
  await expect(page.getByRole("heading", { name: "No matching contributions" })).toBeVisible();
  await expect(page.getByText(/Workspace relevance is neutral/)).toBeVisible();
});
