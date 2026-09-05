# Verify offset sprite loop editor — verification 4

Verified 2026-09-05 UTC for `cycle-block-animator-verify-4`.

- Live URL: <https://cycle-block-animator.sociobot.in>
- Implementation reviewed: `e4bf89fc6f21096018bba09f1e36b444e52a6ec0`
- Documentation and test checkout: `8a4418c15def75ca620d5683257e39ae3ee350af`
- Environment: Linux, Node 22, npm 10, Playwright/Chromium 1.58.2, Lighthouse 12.8.2

## Verdict

**PASS.** There are **zero product findings** and **zero untested public claims**.

The documentation/test commit differs from the implementation candidate only in
test, claim-manifest, live-gate, and report files. Product source is unchanged
from `e4bf89f`.

## Job, audience, and first action

Fresh desktop (1440 × 900) and phone (390 × 664) contexts showed the required
content before scrolling:

- Job: “Build offset sprite loops from PNG frames.”
- Audience: “For 2D game animators who need repeated motion without copying source frames.”
- First action: “Try it with sample data.”
- Facts: artwork stays in the browser; it works offline after the first visit;
  free covers 60 frames and Studio costs $12 once.

Neither context had horizontal overflow or console/page errors. Screenshots are
saved as `/work/.evidence/qa-desktop-landing.png`,
`/work/.evidence/qa-phone-landing.png`,
`/work/.evidence/qa-desktop-demo.png`, and
`/work/.evidence/qa-phone-demo.png`.

## Demo and product workflow

In separate fresh desktop and phone contexts, the one-click sample loaded four
original firefly source frames, a 12-frame resolved loop, and a ready
312 × 416 px, 41 KiB export. The persistent label reads “Demo — sample data,
nothing is saved.” Reset restored the 12-frame sample. Start for real returned to
an empty real workspace in that clean context, so demo data did not become real
data.

The live browser accessibility check also imported frames, changed a recipe,
baked a sheet, and verified a ready export. Invalid image/backup recovery,
exact free boundaries, backup round-trip, natural order, offset resolution,
downloads, license fixtures, and demo isolation were covered by the clean
claim commands below.

## Clean checkout and claims

A detached clean worktree was created at documentation SHA `8a4418c`, then
`npm ci` installed 142 packages with zero reported vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 14/14 tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html`; 22 service-worker shell files |
| `npm run test:e2e` | PASS — 42/42 browser tests |
| `npm run test:live` | PASS — 22 live shell files match local `dist/`; route, metadata, checkout, license, MIME, and policy checks pass |

Every command declared in `.factory/claims.json` was run separately and passed:

`natural-frame-order`, `png-import-rules`, `repeat-without-copies`,
`pass-offset`, `preview-and-step`, `texture-limit`, `png-budget`,
`transparent-png`, `json-frame-map`, `local-artwork-processing`,
`browser-autosave`, `offline-reload`, `project-backup`, `free-frame-limit`,
`free-texture-limit`, `studio-export-limits`, `studio-price`,
`license-check-cache`, `no-trackers`, `source-memory-limit`, and
`demo-isolation`.

This is 21/21 claims with one tagged browser command per claim. The manifest
test also passed, and the landing page, README, Privacy, and Terms claim text
was cross-checked against that inventory. Untested-claim count: **0**.

## Live PWA, accessibility, privacy, and routes

- With an active live service-worker controller, the populated `/demo/` page
  reloaded offline with its four sample frames, ready export, and offline notice.
  This was repeated after first observing a controller-readiness race; the
  controlled repeat passed with no console error.
- The live Playwright/axe integration passed the root workflow, every public
  content route plus the 404 page, reduced motion, and the 390 px first screen:
  4/4 tests. No serious or critical axe violations were reported.
- Keyboard focus, preview keys, mobile layout, legal pages, route titles,
  metadata, canonical URLs, and the real 1200 × 630 social image passed in the
  clean and live checks.
- `/does-not-exist` deliberately returns HTTP 404 and renders the designed
  recovery page with editor and sample links. This is expected behavior, not a
  defect.
- All product links returned 200, except the intentional current-document 404
  skip-link URL and the documented checkout redirect. Checkout returned 303 to
  the hosted Dodo checkout. The privacy contact is an explicit `mailto:` link.
- The request/privacy claim test found no analytics, trackers, artwork uploads,
  third-party scripts, or CDN fonts. Artwork processing and demo operation stay
  in the browser.

Lighthouse against the live URL scored Performance 100, Accessibility 100,
Best Practices 100, and SEO 100. FCP was 0.9 s, LCP 1.1 s, TBT 60 ms, and CLS 0.
Raw evidence: `/work/.evidence/lighthouse-live-v4.json`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Service-worker install, offline root/legal reload, and update | Cleared: clean 42-test suite and live controlled offline demo reload pass. |
| Studio checkout returned 404 | Cleared: live gate and link check observe 303 to hosted checkout. |
| Primary picker focus missing | Cleared by the clean keyboard-focus regression. |
| Long timeline was not keyboard-scrollable | Cleared by the clean long-strip keyboard/axe regression. |
| 200% text overflow | Cleared by the clean reflow regression. |
| Pass offset exceeded its stated range | Cleared by the clean bound regression. |
| Static caching, MIME, CSP, framing, and response hardening | Cleared by the live release gate. |
| Backup restore failed under production CSP | Cleared by the production-CSP backup round-trip regression. |
| Ready export status became stale after edits | Cleared by the clean invalidation regression. |
| Mobile brand and legal targets were undersized | Cleared by the clean 44 px geometry regression. |
| Offline legal routes showed the editor | Cleared by the clean offline legal-route regression. |
| Missing demo sandbox and claim inventory | Cleared: live one-click demo works and 21/21 claim commands pass. |
| First screen was not plain and task-led | Cleared by the fresh phone and desktop evidence above. |
| Unknown routes returned the editor | Cleared: live HTTP 404 has a recovery page. |
| Canonical and social metadata missing | Cleared by the live metadata check. |
| Billing provider had no observed 429/Retry-After | Unchanged external dependency. This static product has no backend or tenant state. The provider is outside this work order and was not burst-tested again. Product-side one-day caching, coalescing, and 429 handling are covered by claim tests. This is not a public product claim or a finding against this implementation. |

## Scope

Cycle Blocks is a static, local-first PWA. Backend-only tenant isolation,
restart persistence, health checks, and a product-owned request allowance do not
apply. The shared billing provider is not a product backend and was not modified
or administered.
