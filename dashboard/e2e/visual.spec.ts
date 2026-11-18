import { expect, test, type Page } from '@playwright/test';

/**
 * Visual baselines are captured with reduced motion so the tour is static, the
 * reveal is already visible and the SVG flow dot is removed. Snapshots are
 * committed next to this file and regenerated with:
 *
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 */
async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll('animateMotion').forEach((node) => node.remove());
  });
  await page.addStyleTag({ content: '.flow circle { display: none !important; }' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('visual', () => {
  // Baselines are generated on Windows. The smoke suite still runs on every
  // platform; run this spec locally with --update-snapshots to refresh them.
  test.skip(process.platform !== 'win32', 'Visual baselines are captured on Windows.');

  test('desktop home', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page);
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
    });
  });

  test('mobile home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await prepare(page);
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
    });
  });

  test('seeded simulator', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page);
    await page.goto('./#try');
    await page.evaluate(() => {
      document.querySelectorAll('animateMotion').forEach((node) => node.remove());
    });
    await page.addStyleTag({ content: '.flow circle { display: none !important; }' });
    await page.getByRole('button', { name: 'Replay scenario' }).click();
    await expect(page.locator('#sim')).toContainText('Reproduced · 19/20 failed');
    await expect(page.locator('#sim')).toHaveScreenshot('simulator-seeded.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.03,
    });
  });
});
