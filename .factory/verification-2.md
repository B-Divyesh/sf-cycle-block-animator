# Independent product verification 2 — FAIL

Verified: 2026-08-28 UTC  
Candidate: `f935e212c24eface5270f547a92bef091e7a4f2b`  
Production URL: <https://cycle-block-animator.sociobot.in>  
Work order: `cycle-block-animator-verify-2`  
Environment: Linux, Node `v22.23.2`, npm `10.9.8`, Playwright/Chromium `1.58.2`

## Verdict

**FAIL. Do not promote this candidate.** The candidate is deployed exactly, the
core timeline/export workflow works, and the earlier service-worker installation
failure is repaired. However, a project backup created by the product cannot be
restored on the production origin, and the advertised $12 Studio checkout still
returns 404. Both are release-blocking acceptance failures.

No critical-severity defect was found. Two high-severity and three
medium-severity defects remain.

## High-severity defects

### Production CSP breaks project restore

The product creates a valid `.cycleblocks.json` backup containing the recipe and
original PNGs, but production cannot restore that same file. `restoreBackup()`
uses `fetch(data:image/png;base64,...)`; the deployed CSP permits `connect-src`
only from self and `https://api.sociobot.in`.

Fresh production reproduction:

1. Import three 16 × 16 PNGs and download the project backup.
2. Clear the project and select that backup under **Restore project**.
3. The import status becomes `Failed to fetch`, zero thumbnails are restored,
   and Chromium logs a CSP console error for every embedded frame:
   `Connecting to 'data:image/png;base64,...' violates ... connect-src 'self'
   https://api.sociobot.in`.

The same backup is structurally valid (`version: 1`, three naturally ordered
frames, recipe, settings, and `data:image/png;base64,...` payloads). This is a
production-policy boundary failure and is not reproduced by Vite preview, which
does not apply the deployed CSP. It violates the advertised recovery workflow,
the local-first data-ownership requirement, and the no-console-errors gate.

Preferred repair: decode the data URL into a `Blob` without `fetch()` rather than
weakening `connect-src`, then add an end-to-end test against a server that applies
the production headers.

### Advertised Studio purchase is unavailable

The exact Buy Studio target remains unavailable:

```text
GET https://api.sociobot.in/api/v1/products/cycle-block-animator/checkout
404 {"error":"enabled factory product","status":404}
```

The invalid-token verification endpoint returns `200`,
`{"expires_at":null,"reason":"invalid","valid":false}`, with the correct
production-origin CORS header. Returned tokens are stored under
`sb_license:cycle-block-animator`, stripped from the visible URL, verified once,
and relocked with a visible notice. The failure is specifically the missing or
disabled billing product, so the advertised one-time purchase cannot be tested
end to end.

## Medium-severity defects

### Several mobile targets are below the required 44 × 44 CSS px

At 390 px, the brand link is 193.2 × 38 px; the inline Studio Terms and Privacy
links are 39.3 × 15 and 48.3 × 15 px; footer Privacy and Terms are 57.9 × 24 and
47.1 × 24 px. The checkbox itself is 17 × 22 px but is inside a 44 px label, so
that control has an adequate effective target. Buttons and form controls otherwise
meet the target size. This violates the supplied mobile accessibility baseline.

### Editing a baked recipe leaves a stale “Ready” result

After baking one 8 × 8 frame, the status read
`Ready: 8 × 8px, 0 KiB, 100% source scale.` Changing passes from one to four
disabled both download buttons but left that old Ready status unchanged. The
status describes an obsolete export until the user bakes again, obscuring the
current state.

### Offline legal routes show the workspace

With a fresh active worker and the browser offline, direct navigation to
`/privacy/` or `/terms/` retains the requested URL but renders the workspace title
and h1. The cache contains `/privacy/index.html` and `/terms/index.html`, while the
navigation fallback looks up `/privacy/` or `/terms/` and then falls back to
`/index.html`. Core workspace offline reload succeeds.

## Clean local quality gates

The checkout was clean and exactly at the requested candidate before installation.
`origin/main` also resolved to the candidate.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 142 packages installed, 143 audited, 0 vulnerabilities |
| `npm test` | PASS; 11/11 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; zero findings |
| `npm run build` | PASS; exact production build, 17 publishable files precached |
| `npm run test:e2e` | PASS; 10/10 local Playwright cases |
| Live Playwright suite | PASS; 9/9 applicable repository cases |

The local waiting-worker regression modified only generated `dist/sw.js`, observed
the update toast, applied `SKIP_WAITING`, reloaded under the new controller, and
restored the original generated file afterward.

## End-to-end product evidence

The following passed in fresh production browser contexts:

- Non-PNG and corrupt-PNG inputs report recoverable errors. A mismatched-canvas
  import retains the active project.
- A 4096 × 4096 source (exactly 16,777,216 pixels) imports; 4097 × 4097 is rejected
  with the 16-megapixel message while the accepted project remains intact.
- `idle_1.png`, `idle_2.png`, `idle_10.png` retain natural order.
- Three passes with offset 1 resolve to `1,2,3,2,3,1,3,1,2`.
- The generated 48 × 48 PNG is valid, is exactly 265 bytes, matches JSON geometry,
  has nine frames at 12 FPS/750 ms, and sampled frame centers are `RGBGBRBRG`.
- Sixty unique deterministic noisy 128 × 128 frames fit a 64 KiB budget by scaling
  to 17 × 17 frames in a 102 × 170 sheet: 46,097 PNG bytes, 13% source scale.
- Exactly 60 free frames export; 61 are blocked with guidance to reduce the recipe
  or unlock Studio.
- Project download works and contains the original PNG data. Production restore is
  blocked by the high-severity CSP defect above. An invalid project reports an
  error without replacing an active project on production.
- Clear project is specifically confirmed; cancel retains the project.

The ordinary import, recipe, preview, bake, download, autosave, and offline-reload
paths produced no page or console errors. The production restore path does produce
the CSP errors documented above.

## PWA, privacy, and security

- The live worker activates with `updateViaCache: none`; cache
  `cycle-blocks-aa2b8c6ca326` contains the 17 expected publishable shell files and
  excludes deployment-only `staticwebapp.config.json`.
- After a source frame autosaves to IndexedDB, an offline `/` reload restores both
  the shell and project and shows `Offline — edits still save`.
- The manifest parses with zero Chromium manifest errors and includes a versioned
  start URL, standalone display, theme/background colors, 192/512 icons, and a
  maskable 512 icon.
- Fresh load and the complete local workflow make requests only to the product
  origin. There are no analytics, uploads, CDN scripts, or external fonts. License
  presence adds only the expected Sociobot verify request.
- `/`, `/privacy/`, and `/terms/` pass the factory URL verifier on first load:
  HTTP 200, title, `lang=en`, one h1, main landmark, image alternatives, labeled
  buttons, and no browser errors.
- Live headers include CSP with `frame-ancestors 'none'`, DENY framing, nosniff,
  strict referrer policy, Permissions Policy, COOP, and two-year HSTS. The TLS
  certificate matches the hostname and is valid through 2027-02-28.
- Hashed assets and icons use `public, max-age=31536000, immutable`; `sw.js` uses
  no-cache/no-store; the manifest is served as `application/manifest+json` with
  `no-cache`. Root HTML revalidates after 30 seconds.

## Live build identity

All 17 URLs in the generated service-worker shell match local `dist/` byte for
byte. Live `sw.js` also matches. Root HTML SHA-256 is
`15b07b808da307277708c083b09e09f0388504a884112a5477cc2b735eba2752` locally
and live; worker SHA-256 is
`9c03aaf7f6eb2052ec26b13c687c154776a0fd1181d0943970a1ae3d977744b4`.
Deployment-only `/staticwebapp.config.json` correctly returns 404.

## Accessibility and responsive behavior

- Desktop and 390 × 844 mobile empty and populated states were visually inspected.
  The authoring order stacks correctly and neither standard mobile nor 200% root
  text creates horizontal overflow.
- Axe reported zero serious/critical findings on empty, populated, 61-frame,
  Privacy, and Terms states. Lighthouse accessibility scored 100 in all three runs.
- The first Tab exposes the skip link. The hidden file input gives its visible
  trigger a 4 px focus outline. Preview Space/arrow controls and the long timeline
  keyboard scroll region work without a trap.
- `prefers-reduced-motion: reduce` matches, changes button transitions to 0.01 ms,
  and disables smooth scrolling while keeping explicitly requested playback.
- The remaining undersized link targets are documented above.

## Performance and budgets

Production output: app JS 25.94 kB raw / 9.29 kB gzip plus a 0.76 kB helper;
CSS 10.39 kB raw / 3.37 kB gzip; no font files; mobile illustration 15.41 kB;
desktop illustration 144.07 kB. Lighthouse reported 31 KiB total first-load
transfer. All static budgets pass.

Three fresh Lighthouse 12.8.2 mobile runs:

| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 91 | 100 | 100 | 100 | 1.13 s | 1.31 s | 373 ms | 0 |
| 2 | 94 | 100 | 100 | 100 | 1.18 s | 1.44 s | 287 ms | 0 |
| 3 | 99 | 100 | 100 | 100 | 1.15 s | 1.30 s | 98 ms | 0 |

Median performance is 94 and LCP is 1.31 seconds. There is no field-INP sample;
the lab TBT variance is recorded rather than represented as INP.

## Applicability and required next verification

Consumer-package and backend checks do not apply to this browser-only static PWA.

Before promotion, decode backup data without CSP-blocked fetches, enable the
Sociobot billing product, clear stale bake status on recipe/settings edits, enlarge
the mobile link targets, and normalize legal navigation cache keys. Then rerun the
clean gate set, a production-header backup round trip, hosted checkout and returned
license round trip, offline root/legal navigation, touch-target audit, live axe,
headers, byte identity, and Lighthouse.
