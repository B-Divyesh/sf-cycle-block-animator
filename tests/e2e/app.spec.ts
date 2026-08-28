import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURdU6Nv///9n7FRsAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggcAyUFy2urkwAAAAxJREFUCNdjYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==', 'base64');
const appOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173').origin;

function collectConsoleErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('imports, cycles, bakes, and remains accessible', async ({ page }) => {
  const errors = collectConsoleErrors(page);
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
  expect(errors).toEqual([]);
});

test('restores its shell and project while offline', async ({ page, context }) => {
  const requestedPaths: string[] = [];
  context.on('request', (request) => requestedPaths.push(new URL(request.url()).pathname));
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.state)).toBe('activated');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  expect(requestedPaths).not.toContain('/staticwebapp.config.json');
  const cachedShell = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await caches.open(names.find((name) => name.startsWith('cycle-blocks-'))!).then((cache) => cache.keys());
    return requests.map((request) => new URL(request.url).pathname);
  });
  expect(cachedShell).toContain('/index.html');
  expect(cachedShell).not.toContain('/staticwebapp.config.json');
  await page.locator('#png-input').setInputFiles([{ name: 'loop_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Repeat drawings. Not the busywork.' })).toBeVisible();
  await expect(page.getByText('Recovered 1 locally saved frames.')).toBeVisible();
  await expect(page.getByText('Offline — edits still save')).toBeVisible();
});

test('rejects mismatched PNG canvases without losing the current recipe', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([{ name: 'walk_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.evaluate(async () => {
    const pngFile = async (name: string, side: number): Promise<File> => {
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
      return new File([blob], name, { type: 'image/png' });
    };
    const files = new DataTransfer();
    files.items.add(await pngFile('walk_1.png', 2));
    files.items.add(await pngFile('walk_2.png', 1));
    const input = document.querySelector<HTMLInputElement>('#png-input')!;
    input.files = files.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#import-status')).toContainText('All source PNGs need the same canvas dimensions');
  await expect(page.locator('.source-summary')).toContainText('1');
  await expect(page.locator('.thumb')).toHaveCount(1);
});

test('first-load privacy is local-only and the PWA update script bypasses caches', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== appOrigin && url.protocol !== 'blob:') externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Repeat drawings. Not the busywork.' })).toBeVisible();
  expect(externalRequests).toEqual([]);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.updateViaCache;
  })).toBe('none');
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

test('shows keyboard focus on the primary file picker', async ({ page }) => {
  await page.goto('/');
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.id === 'png-input')) break;
  }
  await expect(page.locator('#png-input')).toBeFocused();
  const trigger = page.locator('.file-trigger').filter({ has: page.locator('#png-input') });
  await expect(trigger).toHaveCSS('outline-style', 'solid');
  await expect(trigger).toHaveCSS('outline-width', '4px');
});

test('keeps long timelines keyboard-scrollable and axe-clean', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([{ name: 'long_1.png', mimeType: 'image/png', buffer: png }]);
  await page.locator('[data-field="repeats"]').fill('61');
  await page.locator('[data-field="repeats"]').blur();
  await expect(page.locator('.result-frame')).toHaveCount(61);
  await expect(page.locator('.result-strip')).toHaveAttribute('tabindex', '0');
  const results = await new AxeBuilder({ page: page as never }).include('.result-strip').analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('clamps pass offset to its advertised block bound', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([
    { name: 'offset_1.png', mimeType: 'image/png', buffer: png },
    { name: 'offset_2.png', mimeType: 'image/png', buffer: png },
    { name: 'offset_3.png', mimeType: 'image/png', buffer: png }
  ]);
  const offset = page.locator('[data-field="offset"]');
  await expect(offset).toHaveAttribute('max', '2');
  await offset.fill('100');
  await offset.blur();
  await expect(offset).toHaveValue('2');
  await expect(page.locator('.block-result')).toContainText('starts 2 frames later');
});

test('reflows at 200% text size on a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const step = await page.locator('#export-panel .step').boundingBox();
  expect(step).not.toBeNull();
  expect(step!.x + step!.width).toBeLessThanOrEqual(390);
});

test('discovers and applies a waiting service-worker update', async ({ page }) => {
  const workerPath = new URL('../../dist/sw.js', import.meta.url);
  const original = await readFile(workerPath, 'utf8');
  try {
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await writeFile(workerPath, `${original}\n// update-regression-${Date.now()}\n`);
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.locator('#update-toast')).toBeVisible();
    await page.getByRole('button', { name: 'Update now' }).click();
    await expect(page.getByRole('heading', { name: 'Repeat drawings. Not the busywork.' })).toBeVisible();
    await expect(page.locator('#update-toast')).toBeHidden();
  } finally {
    await writeFile(workerPath, original);
  }
});
