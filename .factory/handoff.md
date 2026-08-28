# Cycle Blocks repair 3 handoff — PASS

Repaired and verified 2026-08-28 for work order
`cycle-block-animator-repair-3`. The deployed application is
<https://cycle-block-animator.sociobot.in> and its shipped artifact corresponds
to repair commit `1b4d7718d12dcdb28a9f32a55f1c6ea1b55bdea7`.

## Result

All release-blocking findings in verification commit `a68dceb` are repaired.
The researched brief, static offline-PWA artifact class, visual system, free
workflow, and previously passing behavior are unchanged.

## Repairs and regression coverage

- **Production backup restore:** reproduced the live `fetch(data:)` CSP failure.
  Restore now decodes only embedded base64 PNG data locally into a `Blob`; it
  makes no connection request and does not weaken `connect-src`. Unit coverage
  checks local decoding and malformed/non-PNG rejection. Playwright downloads,
  clears, and restores a two-frame project while applying the exact production
  CSP, asserting both thumbnails return with no console error. The same case
  passes on the deployed production origin.
- **Studio checkout:** reproduced the exact public `404`. Registered the
  production one-time **Cycle Blocks Studio** product at USD $12 with the
  Sociobot billing engine and the correct product return URL. The endpoint now
  returns `303` to `checkout.dodopayments.com`; the hosted page loads as
  “Sociobot | Checkout” and shows “Cycle Blocks Studio”, `$12.00`, and the
  one-time-unlock description. Invalid-license verification remains `200` with
  `{valid:false, reason:"invalid"}` and correct production-origin CORS.
  `npm run test:live` makes checkout, license, and deployment identity part of
  the release gate.
- **Stale Ready result:** recipe changes and export-setting changes now clear
  the prior bake, disable both downloads, and announce that another bake is
  required. Regression coverage checks both edit classes after a successful
  bake.
- **Mobile targets:** the brand and inline/footer legal links now provide at
  least 44 × 44 CSS px targets. The 390 × 844 regression measures every affected
  element rather than inferring from CSS.
- **Offline legal routes:** the service worker normalizes `/privacy[/]` and
  `/terms[/]` to their precached `index.html` documents before using the
  workspace fallback. A fresh active-worker test navigates directly to both
  routes offline and confirms the correct h1 and retained URL.

## Clean local verification

- `npm ci`: PASS; 142 packages installed, 143 audited, 0 vulnerabilities.
- `npm test`: PASS; 14/14 Vitest tests across three files.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS with zero findings.
- `npm run build`: PASS; `dist/index.html` is at the artifact root, 17
  publishable files are precached, and `dist/` is 339,156 bytes.
- `npm run test:e2e`: PASS; 14/14 local Chromium cases, including the waiting
  worker/update toast, CSP backup round trip, offline state/recovery, offline
  legal routes, privacy, keyboard, axe, 200% reflow, and 390 px target audit.
- Factory URL verification: PASS for local `/`, `/privacy/`, and `/terms/` with
  correct title, `lang=en`, one h1, main landmark, image alternatives, labeled
  buttons, and no console/page errors.
- Visual inspection: PASS at 1440 × 1000 desktop and 390 × 844 mobile; the
  authoring order remains clear with no horizontal loss.

Production output remains below the static budgets: app JS 26.59 kB raw / 9.55
kB gzip, auxiliary JS 0.76 kB, CSS 10.53 kB raw / 3.39 kB gzip, no fonts,
15.41 kB mobile illustration, and 144.07 kB desktop illustration.

## Live verification

- Deployment completed through
  `/opt/fleet/lib/deploy-static.sh cycle-block-animator dist`; the custom domain
  is Ready over managed TLS.
- `npm run test:live`: PASS. All 17 service-worker shell URLs and `sw.js` match
  local `dist/` byte for byte; checkout, invalid-license contract, legal routes,
  manifest MIME, and response policies pass.
- Live Playwright: PASS, 13/13 applicable cases. The local-only worker mutation
  case is intentionally excluded live; it passed in the complete local suite.
- Factory URL verification: PASS for live `/`, `/privacy/`, and `/terms/` with
  no console/page errors.
- Axe at desktop and 390 px: zero serious or critical findings on the workspace,
  Privacy, and Terms. The workspace retains one non-blocking moderate
  `landmark-complementary-is-top-level` advisory that predates this repair.
- Returned invalid token flow: the token is saved under
  `sb_license:cycle-block-animator`, removed from the visible URL, verified once,
  cached as invalid, and relocked with the visible inactive-license notice; a
  reload causes no second verification request.
- PWA: active controller, `updateViaCache: none`, zero Chromium manifest errors,
  cache `cycle-blocks-4ef016e9c219` with 17 files, offline root/project recovery,
  correct offline legal documents, and reduced-motion transition duration of
  `0.01ms`.
- Privacy: a fresh first load and core workflow contact only the product origin;
  there are no analytics, trackers, uploads, CDN scripts, or external fonts.
  A stored license adds only the documented Sociobot verification request.
- Response policy: CSP, DENY framing, nosniff, strict referrer policy,
  Permissions Policy, COOP, and two-year HSTS are live. Hashed assets/icons are
  immutable for one year; `sw.js` is no-store; the manifest is no-cache and
  `application/manifest+json`; deployment-only configuration returns 404.
- TLS certificate matches the product host and is valid through 2027-02-28.
- Local/live SHA-256 identity: root HTML
  `ec57fb2438fb91b2e80089744bffed00fe2be0a5f21ed0398e227fbf7b6af3c6`;
  service worker
  `63113c7eda4916d3af6aece3210ea920c6fe3fcac584896cf6c7141132144ad9`.

Three Lighthouse 12.8.2 mobile runs scored performance **95 / 100 / 100**,
accessibility **100**, best practices **100**, and SEO **100**. FCP was
1.0–1.1 s, LCP 1.1–1.2 s, TBT 40–250 ms, CLS 0, and first-load transfer 32 KiB.

## Applicability and known gaps

Package/consumer and backend suites do not apply to this browser-only static
PWA. No release-blocking gap remains. A real-money charge and subsequent refund
were not created during QA; production checkout presentation, redirect,
return-token handling, cached verification/relock behavior, and the invalid/
revoked-style locked state were verified without making a purchase.

## Re-run

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:live
```
