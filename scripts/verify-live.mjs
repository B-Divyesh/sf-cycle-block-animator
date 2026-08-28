import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const liveUrl = new URL(process.env.LIVE_URL ?? 'https://cycle-block-animator.sociobot.in');
const billingBase = 'https://api.sociobot.in/api/v1/products/cycle-block-animator';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };

for (const [path, title] of [['/', 'Cycle Blocks — loop sprites without duplicate drawings'], ['/privacy/', 'Privacy — Cycle Blocks'], ['/terms/', 'Terms — Cycle Blocks']]) {
  const response = await fetch(new URL(path, liveUrl));
  const html = await response.text();
  check(response.ok, `${path} returned ${response.status}`);
  check(html.includes(`<title>${title}</title>`) && html.includes('<html lang="en">'), `${path} has the wrong document identity`);
}

const rootResponse = await fetch(liveUrl);
check(rootResponse.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"), 'CSP is missing frame protection');
check(rootResponse.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is not DENY');
check(rootResponse.headers.get('permissions-policy')?.includes('camera=()'), 'Permissions-Policy is missing');

const manifestResponse = await fetch(new URL('/manifest.webmanifest', liveUrl));
check(manifestResponse.headers.get('content-type')?.startsWith('application/manifest+json'), 'Manifest MIME type is incorrect');

const checkoutResponse = await fetch(`${billingBase}/checkout`, { redirect: 'manual' });
check(checkoutResponse.status === 303, `Checkout returned ${checkoutResponse.status}, expected 303`);
const checkoutLocation = checkoutResponse.headers.get('location');
check(checkoutLocation && new URL(checkoutLocation).hostname === 'checkout.dodopayments.com', 'Checkout did not redirect to hosted Dodo checkout');

const verifyResponse = await fetch(`${billingBase}/verify?license=qa-invalid-token`, { headers: { Origin: liveUrl.origin } });
const verdict = await verifyResponse.json();
check(verifyResponse.ok && verdict.valid === false && verdict.reason === 'invalid', 'Invalid-license response contract changed');
check(verifyResponse.headers.get('access-control-allow-origin') === liveUrl.origin, 'License verification CORS origin is incorrect');

const localWorker = await readFile(resolve('dist/sw.js'));
const liveWorker = Buffer.from(await (await fetch(new URL('/sw.js', liveUrl))).arrayBuffer());
check(hash(localWorker) === hash(liveWorker), 'Live service worker differs from dist/sw.js');
const shellMatch = localWorker.toString().match(/const SHELL=(\[[^;]+\]);/);
check(shellMatch, 'Could not read the generated service-worker shell');
const shell = JSON.parse(shellMatch[1]);
for (const path of shell) {
  const localFile = await readFile(resolve('dist', path.slice(1)));
  const response = await fetch(new URL(path, liveUrl));
  const liveFile = Buffer.from(await response.arrayBuffer());
  check(response.ok, `Live shell file ${path} returned ${response.status}`);
  check(hash(localFile) === hash(liveFile), `Live shell file ${path} differs from dist`);
}

console.log(`live release gate: ${shell.length} shell files match; checkout, license, routes, MIME, and response policies pass`);
