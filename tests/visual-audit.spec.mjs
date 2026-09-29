import { test } from '@playwright/test';

// Ad-hoc visual audit for the kimi/awwwards-redesign branch.
// Captures each landing section with full motion at 1440x900.
// Not part of the shipped suite — used during the design pass.

const SHOTS = [
  ['hero', '#top'],
  ['problem', '#problem'],
  ['method', '#method'],
  ['portfolio', '#portfolio'],
  ['watchlist', '#watchlist'],
  ['evidence', '#evidence'],
];

test('landing visual audit (motion on)', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(2600); // hero intro + count-ups settle

  await page.screenshot({ path: testInfo.outputPath('audit-hero.png') });

  for (const [name, sel] of SHOTS.slice(1)) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1400); // scrub + entrance settle
    await page.screenshot({ path: testInfo.outputPath(`audit-${name}.png`) });
  }

  // Footer wordmark
  await page.locator('.ln-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: testInfo.outputPath('audit-footer.png') });

  // Dossier: open the first watchlist row
  await page.locator('#watchlist').scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.locator('.ln-row-link').first().click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: testInfo.outputPath('audit-dossier.png') });

  if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
});
