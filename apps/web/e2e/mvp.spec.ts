import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("dashboard and core navigation are accessible", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("heading", { name: /make work/i })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Tab"); await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("contribution draft survives reload and reports linked errors", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); }); await page.goto("/contributions/new"); await page.waitForTimeout(1000); expect(errors).toEqual([]); await page.getByLabel("Title").fill("Merged reviewer flow"); await page.getByLabel("What changed and why?").fill("Adds a complete two-wallet review flow."); await expect.poll(() => page.evaluate(() => localStorage.getItem("attestia:contribution-draft"))).toContain("Merged reviewer flow"); await page.reload();
  await expect(page.getByLabel("Title")).toHaveValue("Merged reviewer flow"); await page.getByRole("button", { name: /continue/i }).click(); await expect(page.locator(".error-summary")).toContainText("creator profile ID");
});

test("360px layout has no horizontal overflow and honors reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(parseFloat(await page.locator(".pill-primary").first().evaluate((node) => getComputedStyle(node).transitionDuration))).toBeLessThanOrEqual(.00001);
});

test("public API returns structured validation errors", async ({ request }) => {
  const response = await request.get("/api/profiles/not-a-bytes32"); expect(response.status()).toBe(400); const body = await response.json(); expect(body.error).toMatchObject({ code: "BAD_REQUEST" }); expect(body.error.correlationId).toBeTruthy();
});

test("verification links prefill the public record", async ({ page }) => {
  const id = `0x${"1".repeat(64)}`;
  await page.goto(`/verify?type=profile&id=${id}`);
  await expect(page.getByLabel("Record type")).toHaveValue("profile");
  await expect(page.getByLabel("Record ID")).toHaveValue(id);
});
