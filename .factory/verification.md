# Independent product verification — FAIL

Verified: 2026-08-28 UTC  
Candidate: `8224a10283f31b35447fd093105e6a0e1531901e`  
Production URL: <https://cycle-block-animator.sociobot.in>  
Environment: Linux, Node `v22.23.2`, npm `10.9.8`, Playwright/Chromium `1.58.2`

## Verdict

**FAIL. Do not promote this candidate.** The online editor and constrained export
workflow work, and production content exactly matches the candidate build. However,
the deployed service worker always fails installation, so the required offline PWA
and update flow do not exist on the live origin. The advertised Studio checkout also
returns 404. Keyboard and responsive accessibility defects independently violate the
acceptance contract.

## Blocking defects

### Critical — the deployed PWA cannot install, reload offline, or update

`dist/sw.js` precaches `/staticwebapp.config.json`. Azure Static Web Apps correctly
does not publish that deployment configuration file and returns `404` for it.
`cache.addAll(SHELL)` rejects, leaving the worker in `redundant` state.

Fresh Chromium evidence:

- Manual registration lifecycle: `installing -> redundant`.
- `navigator.serviceWorker.getRegistrations()` returned `0` afterward.
- `navigator.serviceWorker.ready` did not resolve within five seconds.
- The created `cycle-blocks-1kbdx59` cache contained zero entries.
- `GET /staticwebapp.config.json` returned `404`; every other precache URL returned
  `200`.
- Therefore offline reload and the waiting-worker update toast cannot work live.

The repository test passes only because Vite preview serves
`staticwebapp.config.json`; it does not reproduce the deployment boundary.

### High — advertised one-time Studio purchase is unavailable

Both `HEAD` and `GET` of the exact Buy Studio target,
`https://api.sociobot.in/api/v1/products/cycle-block-animator/checkout`, returned
`404` with `{"error":"enabled factory product","status":404}`. The invalid-license
verification endpoint itself returned the expected `200`/`valid:false` response and
correct product-origin CORS, so the failure is specific to checkout/product setup.

### High — the primary import control has no visible keyboard focus

On an empty project, Tab order reaches the hidden `#png-input`, but the focused input
has `opacity: 0`, no outline, and its visible `.file-trigger` label receives no
`:focus-within` styling. A keyboard user cannot see focus on the primary “Choose PNG
frames” action. The skip link, preview stepping, and Space play/pause behavior work.

## Other defects

### Medium — long timelines contain a serious axe violation

At the 61-frame boundary (and likewise at 180 resolved frames), axe reports
`scrollable-region-focusable` with serious impact on `.result-strip`. The horizontal
resolved-frame strip has no focusable content and is not keyboard-scrollable. Empty
state and a short three-frame project have zero serious/critical axe findings.

### Medium — 200% text resizing causes horizontal loss

At a 390 px viewport with the root text size enlarged to 200%, document width becomes
415 px. The “4” step badge in the Constrained export panel extends 25 px beyond the
viewport. Standard-size 390 px layout has no horizontal overflow.

### Medium — pass-offset validation contradicts the control

For a three-frame block the offset input declares `max="2"`, but entering `100` is
accepted and rerendered as `100`. The description then says each pass starts 100
frames later even though resolution applies modulo three. Input should be clamped or
the advertised bound removed and the normalized meaning explained.

### Medium — production caching misses the stated static-asset policy

Hashed JS/CSS and images are returned with
`Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable
caching. `/sw.js` correctly uses `no-cache, no-store, must-revalidate`, and the
manifest uses `no-cache`.

### Low — browser response hardening is incomplete

The root has HSTS, `X-Content-Type-Options: nosniff`, and
`Referrer-Policy: strict-origin-when-cross-origin`. It has no CSP, clickjacking policy
(`frame-ancestors` or `X-Frame-Options`), Permissions Policy, or COOP. HSTS advertises
`preload` with `max-age=10886400`, shorter than the usual preload minimum. The
manifest is served as `application/octet-stream`, although Chromium parsed it with
zero manifest errors.

## Local quality gates

Started from a clean checkout at the exact candidate SHA.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 61 packages, 0 audit vulnerabilities |
| `npm test` | PASS; 8/8 Vitest tests |
| `npm run typecheck` | PASS |
| Lint | Not available; no lint script/config is defined |
| `npm run build` | PASS; exact production command; 18 files precached |
| `npm run test:e2e` | PASS; 5/5 repository Playwright tests |

Build output: app JS 25.82 kB raw / 9.29 kB gzip, auxiliary JS 0.76 kB raw,
CSS 10.23 kB raw / 3.32 kB gzip, no bundled fonts, 15.41 kB mobile hero, and
334,592 bytes for all of `dist/` including source maps. The initial JS and CSS
budgets pass comfortably.

## Product workflow evidence

The following passed against the live URL in fresh browser contexts:

- Empty state clearly identifies numbered PNG import and local-only handling.
- Non-PNG and corrupt-PNG inputs are rejected without losing recovery access;
  mismatched dimensions preserve the existing recipe in the repository regression.
- `idle_1.png`, `idle_2.png`, `idle_10.png` retain natural order.
- Three passes with offset 1 resolve to `1,2,3,2,3,1,3,1,2`.
- Downloaded JSON reports the same sources, nine frames, 12 FPS, duration, geometry,
  padding, image name, and PNG byte count.
- Downloaded PNG has a valid signature/dimensions, matches metadata and budget, and
  sampled frame centers follow `RGBGBRBRG`, proving the baked pixel order.
- A deterministic noisy 60-frame case under a 64 KiB limit exported at 132 × 220 px,
  14,611 bytes, and 17% source scale.
- Exactly 60 free frames export; 61 are blocked with guidance to reduce or unlock.
- Project backup contains recipe and original PNG data, restores end to end, and an
  invalid backup gives an error while retaining the active project.
- IndexedDB refresh recovery works locally; live offline recovery is blocked by the
  service-worker defect above.
- Returned license tokens are stored, removed from the URL, verified only against
  `api.sociobot.in`, and an invalid token relocks with a visible notice.

## Live identity, privacy, and browser quality

- The root HTML SHA-256 is identical locally and live:
  `75938ab34844f3c1e7a1f99017628d0b2b16d16a3cbb397d4d44d4d280af37c8`.
- All 18 deployable files (HTML, hashed JS/CSS, images/icons, manifest, service
  worker, robots and sitemap) matched the candidate build byte for byte.
- TLS is valid for the branded hostname through 2027-02-28.
- `/`, `/privacy/`, and `/terms/` return 200 with the expected title, `lang="en"`,
  one h1, a main landmark, labeled buttons, image alternatives, and no console/page
  errors. The factory `verify-url.sh` passed all three routes.
- A fresh first load and the complete import/bake/download/backup flow contacted only
  the product origin. No analytics, CDN fonts/scripts, uploads, or trackers appeared.
  The only expected external request was license verification after a token existed.
- Desktop and standard 390 × 844 mobile layouts were visually inspected. Both retain
  a clear authoring order and have no normal-size horizontal overflow.
- `prefers-reduced-motion: reduce` matches, disables smooth scrolling, and reduces
  transitions to `0.01ms`.
- No console or page errors occurred through the tested online workflows.

Three Lighthouse 12.8.2 mobile runs scored performance **88 / 97 / 98** (median 97),
accessibility **100**, best practices **100**, and SEO **100**. Median metrics were
approximately FCP 0.79 s, LCP 1.08 s, TBT 197 ms, CLS 0, and TTI 1.12 s; an observed
interaction sequence measured a maximum Event Timing interaction duration of 160 ms.
The first performance run was an outlier at 465 ms TBT, so performance is good but
not perfectly stable in this shared worker environment.

## Required next verification

Exclude deployment-only files from the service-worker shell, add a deployment-level
offline/install regression, enable the Sociobot product checkout, and fix the three
accessibility/input issues. Then rerun the exact commands above plus live worker
activation, offline reload, worker replacement/update toast, checkout redirect, axe
on a 60+ frame project, keyboard focus, and 200% text reflow.
