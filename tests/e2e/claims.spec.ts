import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURdU6Nv///9n7FRsAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggcAyUFy2urkwAAAAxJREFUCNdjYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==', 'base64');
const appOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173').origin;

async function openDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo/');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.thumb')).toHaveCount(4);
  await expect(page.locator('#export-status')).toContainText('Ready:');
}

async function downloadJson(page: import('@playwright/test').Page): Promise<Record<string, unknown>> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('JSON download has no local path');
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
}

test('@claim:natural-frame-order keeps numbered sample frames in numeric filename order', async ({ page }) => {
  await openDemo(page);
  expect(await page.locator('.thumb span').allTextContents()).toEqual([
    '1. firefly_1.png', '2. firefly_2.png', '3. firefly_3.png', '4. firefly_10.png'
  ]);
});

test('@claim:png-import-rules rejects non-PNG and mismatched canvases without replacing the project', async ({ page }) => {
  await openDemo(page);
  await page.locator('#png-input').setInputFiles([{ name: 'notes.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not-an-image') }]);
  await expect(page.locator('#import-status')).toContainText('Only PNG files are supported');
  await expect(page.locator('.thumb')).toHaveCount(4);
  await page.evaluate(async () => {
    const makeFile = async (name: string, side: number): Promise<File> => {
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
      return new File([blob], name, { type: 'image/png' });
    };
    const transfer = new DataTransfer();
    transfer.items.add(await makeFile('odd_1.png', 2));
    transfer.items.add(await makeFile('odd_2.png', 3));
    const input = document.querySelector<HTMLInputElement>('#png-input')!;
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#import-status')).toContainText('same canvas dimensions');
  await expect(page.locator('.thumb')).toHaveCount(4);
});

test('@claim:repeat-without-copies repeats a source block without adding source frames', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.thumb')).toHaveCount(4);
  await expect(page.locator('.result-frame')).toHaveCount(12);
  await page.locator('[data-field="repeats"]').fill('2');
  await page.locator('[data-field="repeats"]').blur();
  await expect(page.locator('.thumb')).toHaveCount(4);
  await expect(page.locator('.result-frame')).toHaveCount(8);
});

test('@claim:pass-offset rotates each sample pass by one frame', async ({ page }) => {
  await openDemo(page);
  expect(await page.locator('.result-frame').allTextContents()).toEqual(['1', '2', '3', '4', '2', '3', '4', '1', '3', '4', '1', '2']);
});

test('@claim:preview-and-step previews and steps through the resolved loop', async ({ page }) => {
  await openDemo(page);
  await page.locator('.preview-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#frame-readout')).toHaveText('2 / 12');
  await expect(page.locator('#preview-image')).toHaveAttribute('alt', /source frame 2, firefly_2\.png/);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
});

test('@claim:texture-limit keeps the exported sheet within the selected texture limit', async ({ page }) => {
  await openDemo(page);
  const metadata = await downloadJson(page) as { size: { w: number; h: number } };
  expect(metadata.size.w).toBeLessThanOrEqual(1024);
  expect(metadata.size.h).toBeLessThanOrEqual(1024);
});

test('@claim:png-budget keeps the exported sample within its 64 KiB PNG budget', async ({ page }) => {
  await openDemo(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('PNG download has no local path');
  expect((await stat(path)).size).toBeLessThanOrEqual(64 * 1024);
});

test('@claim:transparent-png exports real transparent pixels', async ({ page }) => {
  await openDemo(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('PNG download has no local path');
  const encoded = (await readFile(path)).toString('base64');
  const alpha = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, 1, 1).data[3];
  }, encoded);
  expect(alpha).toBe(0);
});

test('@claim:json-frame-map exports engine-neutral frame coordinates and timing', async ({ page }) => {
  await openDemo(page);
  const metadata = await downloadJson(page) as { format: string; image: string; frameCount: number; fps: number; frames: Array<{ index: number; source: string; x: number; y: number; durationMs: number }> };
  expect(metadata.format).toBe('cycle-blocks/spritesheet@1');
  expect(metadata.image).toBe('firefly-hover.png');
  expect(metadata.frameCount).toBe(12);
  expect(metadata.frames).toHaveLength(12);
  expect(metadata.frames[1]).toMatchObject({ index: 1, source: 'firefly_2.png', durationMs: 83 });
  expect(metadata.frames.every((frame) => frame.x >= 0 && frame.y >= 0)).toBe(true);
});

test('@claim:local-artwork-processing sends no artwork request during the demo workflow', async ({ page }) => {
  const mutatingRequests: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) mutatingRequests.push(`${request.method()} ${request.url()}`);
  });
  await openDemo(page);
  await page.locator('[data-field="repeats"]').fill('2');
  await page.locator('[data-field="repeats"]').blur();
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  expect(mutatingRequests).toEqual([]);
});

test('@claim:browser-autosave restores a real project after reload', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.locator('#png-input').setInputFiles([{ name: 'saved_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByText('Recovered 1 locally saved frames.')).toBeVisible();
  await expect(page.locator('.thumb span')).toContainText('saved_1.png');
});

test('@claim:offline-reload opens the populated demo without a network connection', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await openDemo(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.locator('.thumb')).toHaveCount(4);
    await expect(page.getByText('Offline — edits still save')).toBeVisible();
  } finally { await context.close(); }
});

test('@claim:project-backup downloads and restores the recipe with original PNG bytes', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-field="repeats"]').fill('2');
  await page.locator('[data-field="repeats"]').blur();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download project' }).click();
  const path = await (await pending).path();
  if (!path) throw new Error('Project download has no local path');
  const project = JSON.parse(await readFile(path, 'utf8')) as { frames: Array<{ data: string }>; blocks: Array<{ repeats: number }> };
  expect(project.frames).toHaveLength(4);
  expect(project.frames.every((frame) => frame.data.startsWith('data:image/png;base64,'))).toBe(true);
  expect(project.blocks[0].repeats).toBe(2);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('[data-field="repeats"]')).toHaveValue('3');
  await page.locator('#project-input').setInputFiles(path);
  await expect(page.locator('#import-status')).toContainText('Restored 4 frames');
  await expect(page.locator('[data-field="repeats"]')).toHaveValue('2');
  await expect(page.locator('.result-frame')).toHaveCount(8);
});

test('@claim:free-frame-limit exports 60 frames and rejects 64', async ({ page }) => {
  await openDemo(page);
  const repeats = page.locator('[data-field="repeats"]');
  await repeats.fill('15');
  await repeats.blur();
  await expect(page.locator('.result-frame')).toHaveCount(60);
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  await repeats.fill('16');
  await repeats.blur();
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('This recipe has 64 frames. Reduce it to 60');
});

test('@claim:free-texture-limit offers and enforces a 2048 px free limit', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('#texture-limit option[value="4096"]')).toHaveAttribute('disabled', '');
  await page.locator('#texture-limit').selectOption('2048');
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  const metadata = await downloadJson(page) as { size: { w: number; h: number } };
  expect(Math.max(metadata.size.w, metadata.size.h)).toBeLessThanOrEqual(2048);
});

test('@claim:studio-export-limits accepts 120 frames and the 8192 px setting with a valid license fixture', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.route('https://api.sociobot.in/api/v1/products/cycle-block-animator/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok' }) }));
  await page.locator('#png-input').setInputFiles([{ name: 'studio_1.png', mimeType: 'image/png', buffer: png }]);
  await page.locator('#license-token').fill('recorded-valid-license-fixture');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.getByText('License active.')).toBeVisible();
  await page.locator('#texture-limit').selectOption('8192');
  await page.locator('[data-field="repeats"]').fill('120');
  await page.locator('[data-field="repeats"]').blur();
  await expect(page.locator('.result-frame')).toHaveCount(120);
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
});

test('@claim:studio-price shows $12 once and opens the product checkout endpoint', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText('$12 once', { exact: true })).toBeVisible();
  await expect(page.getByText('There is no subscription.')).toBeVisible();
  await expect(page.getByText('Sociobot/Dodo handles checkout and refunds.')).toBeVisible();
  await page.route('https://api.sociobot.in/api/v1/products/cycle-block-animator/checkout', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Hosted checkout fixture</title>' }));
  await page.getByRole('link', { name: 'Buy Studio for $12' }).click();
  await expect(page).toHaveURL('https://api.sociobot.in/api/v1/products/cycle-block-animator/checkout');
});

test('@claim:license-check-cache relocks a rejected license and makes only one check per day', async ({ page }) => {
  await openDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  let checks = 0;
  await page.route('https://api.sociobot.in/api/v1/products/cycle-block-animator/verify?*', (route) => {
    checks += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'revoked' }) });
  });
  await page.locator('#license-token').fill('recorded-revoked-license-fixture');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.locator('#license-status')).toContainText('License not active (revoked)');
  await page.getByRole('button', { name: 'Restore license' }).click();
  await expect(page.locator('#license-status')).toContainText('License not active (revoked)');
  expect(checks).toBe(1);
  await expect(page.locator('#texture-limit option[value="4096"]')).toHaveAttribute('disabled', '');
});

test('@claim:no-trackers loads and exports without analytics, CDN, or third-party requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== appOrigin && url.protocol !== 'blob:' && url.protocol !== 'data:') external.push(request.url());
  });
  await openDemo(page);
  await page.getByRole('button', { name: 'Bake to budget' }).click();
  await expect(page.locator('#export-status')).toContainText('Ready:');
  expect(external).toEqual([]);
});

test('@claim:source-memory-limit rejects a source above 16 megapixels and keeps the demo project', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4097;
    canvas.height = 4097;
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], 'too-large.png', { type: 'image/png' }));
    const input = document.querySelector<HTMLInputElement>('#png-input')!;
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#import-status')).toContainText('16 megapixels or smaller');
  await expect(page.locator('.thumb')).toHaveCount(4);
  await expect(page.locator('.thumb span').first()).toContainText('firefly_1.png');
});

test('@claim:demo-isolation resets sample edits and leaves the saved real project unchanged', async ({ page }) => {
  await page.goto('/');
  await page.locator('#png-input').setInputFiles([{ name: 'real_project_1.png', mimeType: 'image/png', buffer: png }]);
  await expect(page.getByText('1 PNG frame loaded')).toBeVisible();
  await page.waitForTimeout(400);
  await page.goto('/demo/');
  await expect(page.locator('.thumb')).toHaveCount(4);
  await page.locator('[data-field="repeats"]').fill('2');
  await page.locator('[data-field="repeats"]').blur();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('[data-field="repeats"]')).toHaveValue('3');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.getByText('Recovered 1 locally saved frames.')).toBeVisible();
  await expect(page.locator('.thumb span')).toContainText('real_project_1.png');
});
