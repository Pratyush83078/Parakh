import { test, expect } from '@playwright/test';

const routes = ['/', '/projects', '/benchmarks', '/about'];

for (const width of [1440, 390]) {
  for (const route of routes) {
    test(`${route} is readable and navigable at ${width}px`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      if (route === '/projects') await expect(page.locator('.directory-table .ln-row-link').first()).toBeVisible();
      if (route === '/benchmarks') await expect(page.locator('.ministry-bar-link').first()).toBeVisible();
      if (route === '/') {
        await expect(page.getByRole('button', { name: 'Open full record' })).toBeVisible();
        await expect(page.locator('.st-marker').first()).toHaveCSS('position', 'absolute');
      }
      await expect(page.locator('h1')).toHaveCSS('text-transform', 'none');
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 239, 230)');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const nav = page.getByRole('navigation', { name: 'Primary navigation' });
      if (width < 720) {
        await page.getByRole('button', { name: 'Open menu' }).click();
        await expect(nav.getByRole('link', { name: 'Benchmarks', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
      } else {
        await expect(nav.getByRole('link', { name: 'Benchmarks', exact: true })).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll('/', '') || 'overview'}-${width}.png`), fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test('empty filters show a valid range and clear without stale URL state', async ({ page }) => {
  await page.goto('/projects?band=Critical&search=zzznomatch987');
  await expect(page.getByText('No projects match these filters.')).toBeVisible();
  await expect(page.getByText('Showing 0–0 of 0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByLabel('Risk band', { exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Search projects' }).or(page.getByRole('searchbox', { name: 'Search projects' }))).toHaveValue('');
  await expect(page.locator('.directory-table .ln-row-link')).toHaveCount(25);
});

test('ministry drill-down, filters, sorting, pagination and page export use the API', async ({ page, request }) => {
  await page.goto('/benchmarks');
  const first = page.locator('.ministry-bar-link').first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute('href');
  await first.click();
  const ministry = new URL(href, 'http://localhost').searchParams.get('ministry');
  await expect(page.getByLabel('Ministry', { exact: true })).toHaveValue(ministry);
  await expect(page.locator('.directory-table .ln-row-link')).toHaveCount(25);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Page 2 of', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Rule score', exact: true }).click();
  await expect(page.locator('th[aria-sort="ascending"]')).toHaveText('Rule score');
  const data = await (await request.get(`/api/projects?ministry=${encodeURIComponent(ministry)}&sort_by=risk_score&order=asc&limit=25`)).json();
  await expect(page.locator('.directory-table .ln-row-link').first()).toContainText(data.data[0].project_name);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export this page' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('parakh-projects-page-1.csv');
  const { readFile } = await import('node:fs/promises');
  const csv = await readFile(await download.path(), 'utf8');
  expect(csv).toContain(data.data[0].project_code.toString());
  const lines = csv.trim().split('\n');
  expect(lines).toHaveLength(26);
  expect(lines.slice(1).map(line => line.split(',').at(-1))).toEqual(data.data.map(p => p.risk_score == null ? '' : p.risk_score.toFixed(1)));
});

test('project record is a keyboard-contained modal with honest model context', async ({ page }, testInfo) => {
  await page.goto('/projects?band=Critical');
  const trigger = page.locator('.directory-table .ln-row-link').first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close project record' })).toBeFocused();
  await expect(dialog.getByText('Cost-model output · not reliable for forecasting')).toBeVisible();
  await expect(dialog.getByText('What might change next report?')).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement.closest('dialog') !== null)).toBe(true);
  await dialog.getByText('Explore an illustrative what-if').click();
  const slider = dialog.getByRole('slider').first();
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByText('Reset scenario')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('project-record.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page).not.toHaveURL(/project=/);
});

test('command search uses real results, supports keyboard selection and restores focus', async ({ page, request }) => {
  const result = await (await request.get('/api/projects?limit=1')).json();
  const code = result.data[0].project_code.toString();
  await page.goto('/about');
  const trigger = page.getByRole('button', { name: 'Search projects', exact: true });
  await trigger.click();
  const search = page.getByRole('combobox', { name: 'Search all projects' });
  await expect(search).toBeFocused();
  await search.fill(code);
  await expect(page.getByRole('option').first()).toContainText(code);
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(new RegExp(`project=${code}`));
  await expect(page.getByRole('dialog')).toContainText(code);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('directory request failure is visible and retry restores the real records', async ({ page }) => {
  await page.route('**/api/projects?*', route => route.abort());
  await page.goto('/projects');
  await expect(page.locator('main').getByRole('alert')).toContainText('The directory could not load.');
  await expect(page.getByRole('button', { name: 'Export this page' })).toBeDisabled();
  await page.unroute('**/api/projects?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.directory-table .ln-row-link')).toHaveCount(25);
});

test('slow obsolete requests cannot replace the current filtered results', async ({ page, request }) => {
  const target = await (await request.get('/api/projects?risk_band=Low&limit=25&sort_by=risk_score&order=desc')).json();
  await page.route('**/api/projects?*', async route => {
    const response = await route.fetch();
    if (new URL(route.request().url()).searchParams.get('risk_band') === 'High') await new Promise(r => setTimeout(r, 700));
    await route.fulfill({ response });
  });
  await page.goto('/projects');
  await expect(page.locator('.directory-table .ln-row-link')).toHaveCount(25);
  const highRequest = page.waitForRequest(r => r.url().includes('risk_band=High'));
  await page.getByLabel('Risk band', { exact: true }).selectOption('High');
  await highRequest;
  await page.getByLabel('Risk band', { exact: true }).selectOption('Low');
  await expect(page.locator('.directory-table .ln-row-link').first()).toContainText(target.data[0].project_name);
  await page.waitForTimeout(900);
  await expect(page.locator('.directory-table .ln-row-link').first()).toContainText(target.data[0].project_name);
  await expect(page.locator('.directory-table .band-Low')).toHaveCount(25);
});

test('normal motion completes; reduced motion remains visible and does not remount state', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ln-hero-lead')).toHaveCSS('opacity', '1');
  const search = page.getByRole('searchbox', { name: 'Search the watchlist' });
  // Scroll the section into view before its entrance reveals the controls.
  await page.locator('#watchlist').scrollIntoViewIfNeeded();
  await search.fill('rail');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(search).toHaveValue('rail');
  await expect(page.locator('.ln-grain')).toHaveCSS('animation-name', 'none');
  expect(await page.locator('.ln-ticker-track').evaluate(e => parseFloat(getComputedStyle(e).animationDuration))).toBeLessThan(.01);
});
