import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('attestia.phase0.wireflow.v1')));
async function arm(page, scenario) {
  if (!await page.locator('#scenario').isVisible()) await page.locator('#simulation-lab summary').click();
  await page.locator('#scenario').selectOption(scenario);
}
async function review(page) {
  await page.goto('./#compose');
  await page.locator('#contribution-form button[type=submit]').click();
  await expect(page.locator('#publication-form')).toBeVisible();
  await page.locator('#publication-check').check();
}
async function publish(page) {
  await review(page);
  await page.locator('#publication-form button[type=submit]').click();
  await expect.poll(async () => (await state(page)).contribution?.status).toBe('Indexed');
}
async function issue(page, type = 'COMPLETION', actor = 'jules') {
  await page.goto('./#attest');
  await page.locator('#claim-actor').selectOption(actor);
  await page.locator('#claim-type').selectOption(type);
  await page.locator('#attestation-form button[type=submit]').click();
  await expect(page).toHaveURL(/#contribution$/);
}

test('publish, review twice, dispute, revoke and export an explicitly synthetic record', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await publish(page);
  await issue(page);
  await issue(page, 'AUTHORSHIP', 'noor');
  await page.locator('[data-action=dispute]').first().click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('2 active external claims');
  await expect(page.locator('main')).toContainText('1 undisputed + 1 disputed');
  await page.goto('./#revoke/SIM-CLAIM-0001');
  await page.locator('#revoke-reason').fill('The cited deliverable needs another inspection.');
  await page.locator('#revocation-form button[type=submit]').click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('1 active external claims');
  expect((await state(page)).claims).toHaveLength(2);
  await page.goto('./#verify');
  await page.locator('#verification-form button[type=submit]').click();
  await expect(page.locator('.verify-result')).toContainText('Unverified');
  const download = page.waitForEvent('download');
  await page.locator('[data-action=export-json]').click();
  const exported = JSON.parse(await readFile(await (await download).path(), 'utf8'));
  expect(exported.simulated).toBe(true);
  expect(exported.integrity.transactionHash).toBeNull();
  expect(exported.activeExternalClaims.positive).toBe(1);
  expect(exported.claims.find(claim => claim.id === 'SIM-CLAIM-0001').status).toBe('revoked');
  const csvDownload = page.waitForEvent('download');
  await page.locator('[data-action=export-csv]').click();
  expect(await readFile(await (await csvDownload).path(), 'utf8')).toContain('"simulated","integrity"');
  expect(errors).toEqual([]);
});

for (const scenario of ['reject', 'session', 'mismatch', 'duplicate', 'evidence', 'lag']) {
  test(`${scenario}: visible failure and recovery preserve the contribution`, async ({ page }) => {
    await review(page);
    const before = (await state(page)).draft;
    await arm(page, scenario);
    await page.locator('#publication-form button[type=submit]').click();
    if (scenario === 'lag') {
      await expect.poll(async () => (await state(page)).contribution?.status).toBe('Finalized');
      await page.locator('[data-action=recover-indexer]').click();
    } else {
      await expect(page.locator('#state-notice')).toBeVisible();
      expect((await state(page)).contribution).toBeNull();
      await page.locator('#state-notice button').click();
      if (scenario === 'duplicate') await page.locator('#contribution-form button[type=submit]').click();
      await page.locator('#publication-check').check();
      await page.locator('#publication-form button[type=submit]').click();
    }
    await expect.poll(async () => (await state(page)).contribution?.status).toBe('Indexed');
    expect((await state(page)).draft).toEqual(before);
    await page.reload();
    expect((await state(page)).contribution.id).toBe('SIM-CONTRIBUTION-0001');
  });
}

test('invalid fields focus linked summary; drafts survive reload; unsafe source rejected', async ({ page }) => {
  await page.goto('./#compose');
  await page.locator('#title').fill('x');
  await page.locator('#source').fill('javascript:alert(1)');
  await page.locator('#contribution-form button[type=submit]').click();
  await expect(page.locator('#error-summary')).toBeFocused();
  await page.locator('[data-focus=source]').click();
  await expect(page.locator('#source')).toBeFocused();
  await page.reload();
  await expect(page.locator('#title')).toHaveValue('x');
  await expect(page.locator('#source')).toHaveValue('javascript:alert(1)');
  await page.locator('#source').fill('https://user:password@example.com/evidence');
  await page.locator('#contribution-form button[type=submit]').click();
  await expect(page.locator('#source')).toHaveAttribute('aria-invalid', 'true');
});

test('keyboard skip link focuses the current screen without navigating away', async ({ page }) => {
  await page.goto('./#compose');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveURL(/#compose$/);
});

test('claim and revocation indexing lag preserve previous counts until recovery', async ({ page }) => {
  await publish(page);
  await issue(page);
  await page.goto('./#attest');
  await page.locator('#claim-actor').selectOption('noor');
  await page.locator('#claim-type').selectOption('AUTHORSHIP');
  await arm(page, 'lag');
  await page.locator('#attestation-form button[type=submit]').click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('1 active external claims');
  await page.goto('./#contribution');
  await page.locator('[data-action=recover-indexer]').click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('2 active external claims');
  await page.goto('./#revoke/SIM-CLAIM-0001');
  await page.locator('#revoke-reason').fill('Withdraw this example after fresh evidence.');
  await arm(page, 'lag');
  await page.locator('#revocation-form button[type=submit]').click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('2 active external claims');
  await page.goto('./#contribution');
  await page.locator('[data-action=recover-indexer]').click();
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('1 active external claims');
});

test('self claims have zero external weight; replacement preserves history', async ({ page }) => {
  await publish(page);
  await issue(page, 'COMPLETION', 'mira');
  await issue(page);
  await page.goto('./#attest');
  await page.locator('#claim-actor').selectOption('jules');
  await page.locator('#claim-type').selectOption('COMPLETION');
  await page.locator('#attestation-form button[type=submit]').click();
  await expect(page.locator('#error-summary')).toBeVisible();
  await page.locator('#supersede').check();
  await page.locator('#attestation-form button[type=submit]').click();
  expect((await state(page)).claims.filter(claim => claim.status === 'superseded')).toHaveLength(1);
  await page.goto('./#profile');
  await expect(page.locator('main')).toContainText('1 active external claims');
  await expect(page.locator('main')).toContainText('1 active self-claims');
});

test('responsive screens, accessible controls and reduced motion', async ({ page }) => {
  test.setTimeout(60000);
  await publish(page);
  await issue(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 360, height: 800 }, { width: 800, height: 360 }]) {
    await page.setViewportSize(viewport);
    for (const route of ['dashboard', 'compose', 'review', 'contribution', 'attest', 'revoke/SIM-CLAIM-0001', 'profile', 'verify']) {
      await page.goto(`./#${route}`);
      await expect(page.locator('.prototype-banner')).toContainText('no wallet or chain writes');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${route} overflows at ${viewport.width}px`).toBe(true);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) })), `${route} at ${viewport.width}px`).toEqual([]);
    }
  }
});
