import { test, expect } from '@playwright/test';
import { getProjectSummary } from '../lib/intelligence.js';

test('summary preserves zero and missing values without inventing a cause', () => {
  expect(getProjectSummary({ risk_score: 0, doc_slip_months_so_far: 0 })).toContain('Rule score: 0.0. Reported delay: 0 months.');
  expect(getProjectSummary({})).toContain('Reported delay: not reported.');
  expect(getProjectSummary({ risk_band: 'Critical', doc_slip_months_so_far: 36 })).not.toMatch(/clearance|right-of-way|intervention required/i);
});

test('mobile overview opens a scrollable record; backdrop does not scroll the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const next = page.getByRole('button', { name: 'Next project' });
  await next.click();
  await expect(page.locator('.ln-slip-head')).toContainText('2 /');
  await page.getByRole('button', { name: 'Open full record' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const y = await page.evaluate(() => window.scrollY);
  await dialog.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => dialog.evaluate(el => el.scrollTop)).toBeGreaterThan(100);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open full record' })).toBeFocused();
});

test('failed project detail can be retried without losing filters', async ({ page, request }) => {
  const { data } = await (await request.get('/api/projects?risk_band=Critical&limit=1')).json();
  const code = data[0].project_code;
  await page.route(`**/api/projects/${code}`, route => route.abort());
  await page.goto(`/projects?band=Critical&project=${code}`);
  await expect(page.locator('main').getByRole('alert')).toContainText('This project could not be loaded.');
  await page.unroute(`**/api/projects/${code}`);
  await page.getByRole('button', { name: 'Retry project' }).click();
  await expect(page.getByRole('dialog')).toContainText(data[0].project_name);
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Risk band', { exact: true })).toHaveValue('Critical');
});
