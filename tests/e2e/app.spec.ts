import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURdU6Nv///9n7FRsAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggcAyUFy2urkwAAAAxJREFUCNdjYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==', 'base64');
const appOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173').origin;
const productionCsp = "default-src 'self'; base-uri 'self'; connect-src 'self' https://api.sociobot.in; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' blob: data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'";

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
  await expect(page.getByRole('heading', { name: 'Build offset sprite loops from PNG frames' })).toBeVisible();
  await expect(page.getByText('Recovered 1 locally saved frames.')).toBeVisible();
  await expect(page.getByText('Offline — edits still save')).toBeVisible();
});

test('serves the correct legal documents on direct offline navigation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1, name: 'Terms' })).toBeVisible();
  await expect(page).toHaveURL(/\/terms\/$/);
});

test('round-trips a project backup under the production CSP', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    const headers = response.headers();
    if (route.request().resourceType() === 'document') headers['content-security-policy'] = productionCsp;
    await route.fulfill({ response, headers });
  });
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([
    { name: 'backup_1.png', mimeType: 'image/png', buffer: png },
    { name: 'backup_2.png', mimeType: 'image/png', buffer: png }
  ]);
  await expect(page.getByText('2 PNG frames loaded')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download project' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Clear project' }).click();
  await expect(page.locator('.thumb')).toHaveCount(0);
  await page.locator('#project-input').setInputFiles(backupPath!);
  await expect(page.locator('#import-status')).toContainText('Restored 2 frames');
  await expect(page.locator('.thumb')).toHaveCount(2);
  expect(errors).toEqual([]);
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

test('recovers from corrupt PNG and invalid backup inputs', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([{ name: 'good_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.locator('#png-input').setInputFiles([{ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not-png-data') }]);
  await expect(page.locator('#import-status')).toHaveAttribute('data-tone', 'danger');
  await expect(page.locator('.thumb span')).toContainText('good_1.png');
  await page.locator('#project-input').setInputFiles([{ name: 'broken.cycleblocks.json', mimeType: 'application/json', buffer: Buffer.from('{"version":0}') }]);
  await expect(page.locator('#import-status')).toContainText('not a Cycle Blocks v1 project');
  await expect(page.locator('.thumb span')).toContainText('good_1.png');
});

test('shows a useful retry message when license verification is rate limited', async ({ page }) => {
  await page.goto('/');
  await page.route('https://api.sociobot.in/api/v1/products/cycle-block-animator/verify?*', (route) => route.fulfill({ status: 429, headers: { 'Retry-After': '30' }, contentType: 'application/json', body: '{"error":"rate_limited"}' }));
  await page.locator('#license-token').fill('rate-limit-fixture');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.locator('#license-status')).toHaveText('Too many license checks. Try again later.');
});

test('first-load privacy is local-only and the PWA update script bypasses caches', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== appOrigin && url.protocol !== 'blob:') externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Build offset sprite loops from PNG frames' })).toBeVisible();
  expect(externalRequests).toEqual([]);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.updateViaCache;
  })).toBe('none');
});

test('states the job, audience, first action, and three facts before scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Build offset sprite loops from PNG frames' })).toBeVisible();
  await expect(page.getByText('For 2D game animators who need repeated motion without copying source frames.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('.plain-facts li')).toHaveCount(3);
  const facts = await page.locator('.plain-facts').boundingBox();
  expect(facts).not.toBeNull();
  expect(facts!.y).toBeLessThan(664);
});

test('serves complete route metadata and a 1200 by 630 social image', async ({ page, request }) => {
  for (const [path, canonical] of [['/', '/'], ['/demo/', '/demo/'], ['/privacy/', '/privacy/'], ['/terms/', '/terms/']]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://cycle-block-animator.sociobot.in${canonical}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Cycle Blocks/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /cycle-blocks-social\.png$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png');
  }
  const image = Buffer.from(await (await request.get('/assets/cycle-blocks-social.png')).body());
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
});

test('returns a designed 404 response with recovery links', async ({ page }) => {
  const response = await page.goto('/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Cycle Blocks');
  await expect(page.getByRole('heading', { level: 1, name: 'This page does not exist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the editor' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'Try sample data' })).toHaveAttribute('href', '/demo/');
});

test('keeps every public route semantic and free of serious axe findings', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  for (const path of ['/', '/demo/', '/privacy/', '/terms/', '/does-not-exist']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
  expect(errors.filter((message) => !message.includes('server responded with a status of 404'))).toEqual([]);
});

test('removes decorative transitions when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/');
  await expect(page.locator('.thumb')).toHaveCount(4);
  await expect(page.locator('#export-status')).toContainText('Ready:');
  const duration = await page.locator('[data-action="bake"]').evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration));
  expect(duration).toBeLessThanOrEqual(.001);
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

test('keeps every mobile brand and legal link target at least 44px square', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const targets = page.locator('.brand, .pro-box small a, .site-footer nav a');
  await expect(targets).toHaveCount(5);
  for (let index = 0; index < await targets.count(); index += 1) {
    const box = await targets.nth(index).boundingBox();
    expect(box, `target ${index} has geometry`).not.toBeNull();
    expect(box!.width, `target ${index} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `target ${index} height`).toBeGreaterThanOrEqual(44);
  }
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

test('invalidates a stale ready result after recipe or export-setting edits', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([{ name: 'edit_1.png', mimeType: 'image/png', buffer: png }]);
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');

  await page.locator('[data-field="repeats"]').fill('4');
  await page.locator('[data-field="repeats"]').blur();
  await expect(page.locator('#export-status')).toHaveText('Recipe changed. Bake again to refresh the export.');
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeDisabled();

  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  await page.locator('#fps').fill('24');
  await page.locator('#fps').blur();
  await expect(page.locator('#export-status')).toHaveText('Export settings changed. Bake again to refresh the export.');
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled();
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
    await expect(page.getByRole('heading', { name: 'Build offset sprite loops from PNG frames' })).toBeVisible();
    await expect(page.locator('#update-toast')).toBeHidden();
  } finally {
    await writeFile(workerPath, original);
  }
});
