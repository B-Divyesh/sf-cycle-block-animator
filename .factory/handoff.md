# Cycle Blocks repair 2 handoff

Repaired 2026-08-28 from verifier report `b2eac1a0e0225caf420065e44e9cbe08d29a60cc`
for candidate `8224a10283f31b35447fd093105e6a0e1531901e`.

## Result

All repository-owned verifier defects are repaired, regression-covered, pushed,
and deployed as the original static offline PWA. The branded production origin is
serving the exact build. One external release dependency remains: the Sociobot
billing service has no enabled product record for `cycle-block-animator`, and this
worker contains no authorized product-registration command. The required checkout
URL therefore still returns 404. Do not claim the paid checkout is ready until the
factory billing owner registers it.

## Repairs

- Excluded host-consumed `staticwebapp.config.json` from the generated precache.
  A fresh live worker now activates, owns the page, caches the 17-file publishable
  shell, and reloads the saved project offline.
- Added a production-boundary assertion that the worker never requests or caches
  the unpublished config, plus an exact waiting-worker/update-toast/skip-waiting
  regression. Worker versions hash every shell file's bytes, so stable-name asset
  changes also trigger update discovery.
- Added visible `:focus-within` treatment to every visible file-picker trigger.
- Made the resolved-frame strip focusable and keyboard-scrollable; axe is clean at
  61 frames.
- Fixed narrow/200%-text panel heading shrinkage. At 390 px and 200% root text,
  document width equals viewport width and the step badge remains in bounds.
- Clamped pass offset to `[-(block length - 1), block length - 1]`, matching the
  rendered input bounds and explanation.
- Applied one-year immutable caching to assets/icons; preserved no-store worker
  and no-cache manifest policy.
- Added CSP with `frame-ancestors 'none'`, DENY framing, Permissions Policy, COOP,
  two-year HSTS, and Static Web Apps' `.webmanifest` MIME mapping.
- Added ESLint and a release-config regression suite. Existing editor/export,
  backup/recovery, license, privacy, visual system, and generated asset are unchanged.

## Exact verification evidence

Clean install and local gates:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

- `npm ci`: 142 packages installed, 143 audited, 0 vulnerabilities.
- Vitest: 11/11 passed (timeline bounds plus deployment/precache/header policy).
- TypeScript and ESLint: passed with zero findings.
- Production build: passed; `dist/index.html` present; service worker precaches 17
  publishable files and excludes deployment metadata.
- Output budgets: app JS 25.94 kB raw / 9.31 kB gzip; auxiliary JS 3.79 kB raw;
  CSS 10.39 kB raw / 3.36 kB gzip; generated mobile illustration 15.41 kB.
- Playwright 1.58.2: 10/10 passed locally. Coverage includes complete import,
  natural order, cycle/bake, axe, invalid-dimension recovery, privacy, desktop,
  390 px mobile, keyboard play/step and file focus, 61-frame strip, 200% text,
  offset bounds, fresh service-worker activation, IndexedDB offline recovery, and
  waiting-worker update application.
- Factory URL verifier passed `/`, `/privacy/`, and `/terms/`: 200, correct titles,
  `lang=en`, one h1, main landmark, complete alt/button labels, and zero console or
  page errors. Desktop and 390 × 844 captures were visually inspected.
- Warm Lighthouse 12.8.2 mobile runs: performance 99/100/99 (median 99),
  accessibility 100, best practices 100, SEO 100. LCP 1.36–1.55 s, TBT 0–148 ms,
  CLS 0. Earlier cold shared-worker runs were 73/79/98 and were retained rather
  than hidden; their variance was CPU blocking, not network or layout regression.
- Package/consumer validation is not applicable to this browser-only artifact.

Deployment and live evidence:

- Pushed repair commits `2089103`, `5d7c7c8`, and `c2cb758` to `origin/main`.
- Static Web Apps deployment IDs: `b857f376-d584-4553-b6c5-1b745cf42044` and final
  MIME-policy deployment `87d58c5c-684e-4ee4-aab1-5e1150df2488`, and final
  content-fingerprinted-worker deployment `d9a0c9fa-66f0-40f5-800e-6e41bc661f1a`.
- Branded URL: <https://cycle-block-animator.sociobot.in> (TLS and 200 ready).
- All 23 published build files match local `dist/` byte for byte; deployment-only
  `/staticwebapp.config.json` correctly returns 404. Root HTML SHA-256 is
  `15b07b808da307277708c083b09e09f0388504a884112a5477cc2b735eba2752` locally and live.
- Nine browser cases were rerun directly against the branded origin: full workflow,
  live worker activation/offline reload, invalid import recovery, first-load
  local-only privacy, desktop/mobile keyboard behavior, file focus, long-strip axe,
  offset clamp, and 200% reflow. All passed.
- Effective live headers: hashed JS is
  `public, max-age=31536000, immutable`; `/sw.js` is no-cache/no-store;
  manifest is `application/manifest+json` and no-cache; CSP, DENY framing,
  Permissions Policy, COOP, nosniff, strict referrer policy, and two-year HSTS are
  present.

## Remaining external dependency

`GET https://api.sociobot.in/api/v1/products/cycle-block-animator/checkout` still
returns `404 {"error":"enabled factory product","status":404}` with and without
the production Origin header. The verify endpoint remains healthy. Repository rules
forbid directly changing billing, and the attached paid-unlock procedure names
`fleet/new-paid-product.sh`, which is not present in this worker or the latest worker
image. The factory billing owner must register/enable the $12 one-time product and
then verify the hosted redirect and returned-license round trip. No direct payment
provider or misleading fallback was introduced.

## Re-run

```sh
npm ci && npm test && npm run typecheck && npm run lint && npm run build
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://cycle-block-animator.sociobot.in \
  npx playwright test --grep-invert 'waiting service-worker update'
```
