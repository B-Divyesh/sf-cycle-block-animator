# Cycle Blocks handoff — repair 1

Completed 2026-08-28 from failed candidate `0d14646029e8cffac1d4765d57de37b01260e278`.

## What changed

- Finished the interrupted PWA delivery and deployed the static `dist/` artifact.
- Fixed the update-discovery failure mode: the stable `/sw.js` registration now
  uses `updateViaCache: "none"`, and the committed Static Web Apps configuration
  sends `Cache-Control: no-cache, no-store, must-revalidate` for that file.
  The existing waiting-worker toast and `SKIP_WAITING`/`clients.claim()` flow are
  preserved.
- Added browser regression coverage for incompatible PNG frame dimensions
  preserving an already-loaded recipe, first-load local-only privacy, PWA update
  cache policy, and browser-console errors. The core import/cycle/bake/axe,
  offline recovery, mobile layout, and keyboard cases remain covered.

## How to run and verify

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`; it creates
`dist/index.html`, the manifest, versioned service worker, offline fallback,
and Static Web Apps configuration. Deploy with:

```sh
/opt/fleet/lib/deploy-static.sh cycle-block-animator dist
```

## Evidence

Run in this repair environment on 2026-08-28:

- `npm test`: 8 deterministic timeline/sprite-planning tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; service worker precached 18 app-shell files.
  Initial application JavaScript is 25.82 kB raw / 9.29 kB gzip; CSS is
  10.23 kB raw / 3.32 kB gzip, both within the static-product budget.
- Lighthouse CLI was also attempted against the local production preview with
  the supplied Playwright Chromium binary. The CLI could not attach to that
  sandboxed binary (`Unable to connect to Chrome`), so no synthetic Lighthouse
  score is reported. The independent Playwright/axe and production-preview
  browser checks below completed successfully.
- `npm run test:e2e`: 5 Playwright tests passed. This includes import, offset
  cycles, bake/download enablement, serious/critical axe scan (0 violations),
  offline reload after `context.setOffline(true)`, keyboard playback/stepping,
  390 px mobile no-horizontal-overflow, bad-import recovery, privacy, and PWA
  update-cache checks.
- `/opt/fleet/lib/verify-url.sh` passed against local production preview for
  `/`, `/privacy/`, and `/terms/`: every page returned 200 with its expected
  title, `lang="en"`, exactly one h1, main landmark, no images missing `alt`,
  no unlabeled buttons, and no browser console errors.
- The source is privacy-local on first load: Playwright observed no requests to
  an external origin. The only later external integration is the documented
  Sociobot license verification when a buyer has stored a license.
- Production artifact deployment succeeded as Static Web App
  `sf-cycle-block-animator`, deployment id
  `722359bc-c0c9-4d2b-aabd-0cd961f1d613`, at
  `https://brave-meadow-03680280f.7.azurestaticapps.net`. Live verification
  there passed with a 200 response, title `Cycle Blocks — loop sprites without
  duplicate drawings`, `lang=en`, h1/main/alt/button checks, and zero console
  errors. Its `/sw.js` response has
  `Cache-Control: no-cache, no-store, must-revalidate`.

## Deployment note / next step

The requested branded CNAME,
`cycle-block-animator.sociobot.in -> brave-meadow-03680280f.7.azurestaticapps.net`,
is present in public DNS. At the last check Azure Static Web Apps reported the
custom-domain state as `Adding` (after DNS validation), so its managed TLS certificate had not yet
propagated and a strict HTTPS request to the branded hostname correctly failed
certificate validation. The uploaded artifact itself is live at the default
Static Web Apps hostname above. Re-run the deploy command or check the custom
domain after Azure reports `Ready`, then run:

```sh
VERIFY_NODE_MODULES=/work/repo/node_modules \
  /opt/fleet/lib/verify-url.sh https://cycle-block-animator.sociobot.in \
  /tmp/cycle-block-live-evidence
```

No product-scope gaps are known; custom-domain TLS issuance is external Azure
provisioning still in progress.
