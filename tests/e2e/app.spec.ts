import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURdU6Nv///9n7FRsAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggcAyUFy2urkwAAAAxJREFUCNdjYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==', 'base64');

test('imports, cycles, bakes, and remains accessible', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([
    { name: 'idle_10.png', mimeType: 'image/png', buffer: png },
    { name: 'idle_2.png', mimeType: 'image/png', buffer: png },
    { name: 'idle_1.png', mimeType: 'image/png', buffer: png }
  ]);
  await expect(page.getByText('3 PNG frames loaded')).toBeVisible();
  await expect(page.locator('.thumb span').first()).toContainText('idle_1.png');
  await page.locator('[data-field="repeats"]').fill('2');
  await page.locator('[data-field="repeats"]').blur();
  await expect(page.getByText('6 baked frames', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('restores its shell and project while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.locator('#png-input').setInputFiles([{ name: 'loop_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Repeat drawings. Not the busywork.' })).toBeVisible();
  await expect(page.getByText('Recovered 1 locally saved frames.')).toBeVisible();
  await expect(page.getByText('Offline — edits still save')).toBeVisible();
});

test('fits the phone viewport and keyboard controls are usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator('#png-input').setInputFiles([
    { name: 'step_1.png', mimeType: 'image/png', buffer: png },
    { name: 'step_2.png', mimeType: 'image/png', buffer: png }
  ]);
  await page.locator('.preview-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#frame-readout')).toHaveText('2 / 2');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
});
