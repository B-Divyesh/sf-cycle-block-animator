# Build offset sprite loops from PNG frames — review 2

Reviewed 2026-09-05 UTC for `cycle-block-animator-review-2`.

- Live URL: <https://cycle-block-animator.sociobot.in>
- Implementation candidate: `e4bf89fc6f21096018bba09f1e36b444e52a6ec0`
- Documentation and test checkout: `29ea14109c54f2d1aa3f104fd9083326e6cc3de0`
- Environment: Node 22.23.2, npm 10.9.8, Playwright/Chromium 1.58.2, Lighthouse 12.8.2

## Verdict

**PASS — zero findings and zero untested claims.**

`29ea141` differs from the implementation candidate only in claim/test/live-gate
and report files. It contains no product-source change. The live shell release
gate confirms that the deployed `dist/` shell matches the clean build.

## Job, audience, and first action

Fresh 1440 × 900 desktop and 390 × 664 phone contexts showed these items before
scrolling:

- Job: “Build offset sprite loops from PNG frames.”
- Audience: “For 2D game animators who need repeated motion without copying source frames.”
- First action: “Try it with sample data.”
- Facts: artwork stays in the browser; it works offline after the first visit;
  free covers 60 frames and Studio costs $12 once.

The phone had no horizontal overflow. Visual inspection found the risograph
print-bench system consistent on desktop and phone, with no generic template
surface or broken layout. Evidence screenshots are
`/work/.evidence/review-2-live-desktop-demo.png` and
`/work/.evidence/review-2-live-phone-demo.png`.

## Demo and real-data isolation

In fresh desktop and phone contexts, the one-click sample reached its stable
ready state with four original firefly source frames, 12 resolved frames, the
persistent “Demo — sample data, nothing is saved” label, and a ready
312 × 416 px, 41 KiB export. Reset restored the same four-frame / 12-frame
sample. Leaving demo from a clean phone context opened an empty real workspace.

For isolation, a fresh desktop context saved `real_keep_1.png` in the real
workspace, entered demo, reset it, then left demo. The saved real source frame
remained. Demo reset did not alter real data.

## Clean checkout and claims

A detached clean worktree at `29ea141` completed `npm ci` with 142 packages and
zero reported vulnerabilities. The first test attempt occurred before its
documented prerequisites had been installed in that worktree and is not a test
result; after installation, every gate passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 14/14 |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html`; 22 shell files precached |
| `npm run test:e2e` | PASS — 42/42 |
| `npm run test:live` | PASS — deployed shell matches; routes, checkout, license response, MIME, and policies pass |

All 21 commands declared in `.factory/claims.json` were invoked separately and
passed: `natural-frame-order`, `png-import-rules`, `repeat-without-copies`,
`pass-offset`, `preview-and-step`, `texture-limit`, `png-budget`,
`transparent-png`, `json-frame-map`, `local-artwork-processing`,
`browser-autosave`, `offline-reload`, `project-backup`, `free-frame-limit`,
`free-texture-limit`, `studio-export-limits`, `studio-price`,
`license-check-cache`, `no-trackers`, `source-memory-limit`, and
`demo-isolation`. Public landing, README, Privacy, and Terms wording was
cross-checked with this inventory. Untested claims: **0**.

## Live behavior, accessibility, privacy, and routes

- The required `verify-url.sh` passed for `/`, `/demo/`, `/privacy/`, and
  `/terms/`: each has a title, `lang=en`, one h1, main landmark, image text
  alternatives, labeled buttons, and no console/page errors. Raw output and
  screenshots are in `/work/.evidence/review-2-url-*`.
- Live Playwright axe checks on `/`, `/demo/`, `/privacy/`, `/terms/`, and an
  unknown route reported zero serious or critical violations. Each had one h1
  and one main landmark. The unknown route deliberately returned HTTP 404 with
  the designed recovery page, so it is expected behavior.
- A fresh, controlled live service-worker context reloaded populated demo data
  while offline: four sources, 12 resolved frames, ready export, and the
  offline notice. The clean 42-test suite also covers worker update handling
  and offline legal-route navigation.
- Live keyboard testing reached the primary picker with its 4 px visible focus
  outline. At 200% text on a 390 px viewport there was no horizontal overflow.
  Under reduced motion the tested transition duration was 0.00001 seconds.
- A request trace for the live demo and bake workflow observed no external
  requests, trackers, uploads, scripts, or CDN fonts. All product links were
  healthy: internal links returned 200, the mail link was explicit, and the
  documented hosted checkout returned 303. No checkout session value is
  recorded here.
- Route-specific titles, legal pages, metadata, social image, manifest MIME,
  CSP/frame protections, and styled 404 passed the live release gate.

Lighthouse on the live root scored Performance 99, Accessibility 100, Best
Practices 100, and SEO 100 (FCP 1.0 s, LCP 1.1 s, TBT 120 ms, CLS 0). Raw output:
`/work/.evidence/review-2-lighthouse.json`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Service worker install, offline root/legal reload, and update | Cleared by the clean 42-test suite and controlled live offline demo reload. |
| Studio checkout returned 404 | Cleared: live release gate and link check observe the documented 303 hosted checkout response. |
| Picker focus, timeline keyboard scrolling, 200% reflow, and undersized mobile targets | Cleared by clean keyboard, long-strip, reflow, and geometry regressions; live focus and reflow retested. |
| Offset bound, stale ready exports, invalid image/backup recovery, free limits, and source memory boundary | Cleared by the complete claim suite and normal, invalid, boundary, and recovery regressions. |
| Caching, MIME, CSP/framing, backup under production CSP, and offline legal routes | Cleared by clean regressions and the live release gate. |
| Missing demo sandbox, missing claim inventory, first screen not task-led, and unknown route rendering the editor | Cleared by live desktop/phone demo evidence, 21/21 claims, and the designed HTTP 404. |
| Canonical/social metadata and mobile legal targets | Cleared by the live metadata/link checks and clean target-geometry regression. |
| Provider-side billing 429 / `Retry-After` observation | Unchanged external dependency, outside this static PWA product scope. The product has no backend or tenant state; client caching, coalescing, and 429 recovery are covered by the claim suite. It is not a product finding. |

## Applicability

This is a static, local-first PWA. Product-backend tenant isolation, server
restart persistence, health endpoints, and product-owned request allowances do
not apply. No product code was changed for this review.
