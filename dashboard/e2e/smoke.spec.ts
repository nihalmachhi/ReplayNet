import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('renders the page and every section without horizontal overflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Turn one outage into a test you can re-run.',
    );
    await expect(page).toHaveTitle(/ReplayNet/);

    for (const id of ['how', 'try', 'results', 'features', 'start', 'scope', 'faq']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });

  test('renders at mobile width without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('marks every external link noopener noreferrer', async ({ page }) => {
    await page.goto('./');
    const links = await page.locator('a[href^="http"]').evaluateAll((anchors) =>
      anchors.map((anchor) => ({
        href: anchor.getAttribute('href') ?? '',
        rel: anchor.getAttribute('rel') ?? '',
      })),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.rel, link.href).toBe('noopener noreferrer');
    }
  });

  test('replays the default scenario and selects a normalized event', async ({ page }) => {
    await page.goto('./#try');
    await page.getByRole('button', { name: 'Replay scenario' }).click();

    await expect(page.locator('.shead .chip')).toHaveText('Reproduced · 19/20 failed');
    await expect(page.locator('.trial')).toHaveCount(20);
    await expect(page.locator('.trial.no')).toHaveCount(19);

    await page.getByRole('button', { name: /evt-3/ }).click();
    const sim = page.locator('#sim');
    await expect(
      sim.getByText('Synthetic prior next hop restored; token=[REDACTED]'),
    ).toBeVisible();
    await expect(sim.getByText('Route change coincides with packet loss')).toBeVisible();
  });

  test('replays the fixed build as regression guarded', async ({ page }) => {
    await page.goto('./#try');
    await page.getByRole('combobox', { name: 'Build' }).selectOption('fixed');
    await page.getByRole('button', { name: 'Replay scenario' }).click();

    await expect(page.locator('.shead .chip')).toHaveText('Regression guarded · 0/20 failed');
    await expect(page.locator('.trial.no')).toHaveCount(0);
    await expect(page.locator('#sim')).toContainText('0 of 20 trials reproduced the fault');
  });

  test('switches to the MTU bundle and shows its hypothesis', async ({ page }) => {
    await page.goto('./#try');
    await page.getByRole('combobox', { name: 'Fault' }).selectOption('mtu_blackhole');
    await expect(page.locator('#sim')).toContainText('2 normalized events · mtu-change.jsonl');
    await page.getByRole('button', { name: 'Replay scenario' }).click();
    await expect(page.locator('.shead .chip')).toHaveText('Reproduced · 18/20 failed');
    await expect(page.locator('#sim')).toContainText(
      'Path MTU signal coincides with retransmission',
    );
  });

  test('supports arrow-key navigation in the hero tour', async ({ page }) => {
    await page.goto('./');
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(5);
    await expect(page.getByRole('tab', { selected: true })).toHaveText('Ingest');

    await page.getByRole('tab', { name: 'Ingest' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { selected: true })).toHaveText('Sanitize');

    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { selected: true })).toHaveText('Measure');

    await page.keyboard.press('Home');
    await expect(page.getByRole('tab', { selected: true })).toHaveText('Ingest');
  });

  test('shows the computed results and comparison table', async ({ page }) => {
    await page.goto('./#results');
    const results = page.locator('#results');
    await expect(results.getByText('19 of 20 trials failed at seed 7.')).toBeVisible();
    await expect(results.getByText('0 of 20 trials failed after the fix.')).toBeVisible();
    await expect(results.getByText('Where the signal is')).toBeVisible();

    const table = page.locator('#cmp');
    await expect(table).toContainText('route blackhole');
    await expect(table).toContainText('MTU blackhole');
    await expect(table).toContainText('loss during failover');
  });

  test('opens a FAQ answer with the native disclosure', async ({ page }) => {
    await page.goto('./#faq');
    await page.getByText('Does it replay real traffic?').click();
    await expect(
      page.locator('#faq details').first().locator('p'),
    ).toContainText('deterministic toy simulator');
  });
});
