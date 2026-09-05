# Cycle Blocks repair 4 handoff

## Strict review 2

Reviewed 2026-09-05 UTC for `cycle-block-animator-review-2`.

- Implementation candidate: `e4bf89fc6f21096018bba09f1e36b444e52a6ec0`
- Documentation/test checkout: `29ea14109c54f2d1aa3f104fd9083326e6cc3de0`
- Verdict: **PASS — zero findings and zero untested claims.**

From a detached clean worktree, `npm ci`, `npm test` (14/14), typecheck, lint,
build, `npm run test:e2e` (42/42), and `npm run test:live` passed. Each of the
21 declared claim commands passed separately. Fresh live desktop and phone
checks confirmed the job, audience, sample action, facts, stable one-click demo,
reset, and real-data isolation. Live offline reload, axe, keyboard focus, 200%
reflow, reduced motion, privacy trace, routes, legal pages, links, designed 404,
and Lighthouse passed. Lighthouse: Performance 99, Accessibility 100, Best
Practices 100, SEO 100; LCP 1.1 s, CLS 0.

The provider-side 429/`Retry-After` evidence remains an external dependency,
not a product finding: this static PWA has no backend, and the client recovery
path is covered by its claim tests. Complete evidence and earlier-finding
dispositions: `.factory/review-2.md`.

---

## Independent verification 4

Verified 2026-09-05 UTC for `cycle-block-animator-verify-4`.

- Implementation reviewed: `e4bf89fc6f21096018bba09f1e36b444e52a6ec0`
- Documentation/test checkout: `8a4418c15def75ca620d5683257e39ae3ee350af`
- Verdict: **PASS** — zero product findings and zero untested claims.

From a detached clean checkout at the documentation SHA, `npm ci`, `npm test`
(14/14), `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run test:e2e` (42/42), and `npm run test:live` all passed. Each of the 21
commands in `.factory/claims.json` also passed when run separately.

Fresh live desktop and 390 px phone checks found the job, audience, first
sample action, and three facts before scrolling. The one-click demo showed four
sample sources, 12 output frames, the persistent demo label, reset behavior,
and a 312 × 416 px / 41 KiB ready export. A controller-confirmed offline demo
reload retained all four samples. Live axe/reduced-motion/route checks passed,
as did the designed HTTP 404, metadata, legal routes, and checkout redirect.

Live Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 60 ms, CLS 0.

The known lack of provider-side 429/`Retry-After` evidence at the shared billing
service remains outside product scope. It is not a product finding: the static
PWA has no backend, and client caching, request coalescing, and 429 handling are
covered by the claim suite. See `.factory/verification-4.md` for complete
evidence and the disposition of every earlier finding.

---

Completed 2026-09-05 UTC for work order `cycle-block-animator-repair-4`.

- Live URL: <https://cycle-block-animator.sociobot.in>
- Demo URL: <https://cycle-block-animator.sociobot.in/demo/>
- Deployed implementation SHA: `e4bf89fc6f21096018bba09f1e36b444e52a6ec0`
- Verification and claim-test SHA: `fb9ffe5ee0112791e4797711a820afa1085257e0`
- Deployment ID: `077875ca-d95d-4d6b-b030-1abdb5b9b4cc`

The implementation and verification SHAs differ because a later commit expanded
browser tests. The handoff-only commit after it also leaves `dist/` unchanged.

## Result

The repository-owned findings are repaired and deployed. The editor still imports,
cycles, previews, backs up, and exports the user's PNG frames. The repair adds the
required one-click sandbox, claim evidence, plain first screen, designed 404, and
complete social and canonical metadata.

One provider-owned gap remains: the shared Sociobot license-verification endpoint
still has no supplied 429/`Retry-After` evidence. This static product cannot change
that service, and this work order expressly forbids modifying or restarting shared
Sociobot services. The product now deduplicates concurrent checks, caches each token
verdict for one day, and presents a useful message if the provider returns 429. A
recorded browser test proves those client controls. Provider enforcement remains a
named external dependency, not a hidden pass.

## Repairs

- Added `/demo/` with four original procedural firefly frames, a three-pass offset
  recipe, and a ready 12-frame export.
- Demo state exists only in memory. It does not read or write the real project
  database or license storage.
- Added the persistent demo label, **Reset demo**, and **Start for real** actions.
- Replaced slogan and print-shop wording with a job-first headline, named audience,
  sample action, and three facts visible on a 390 × 664 screen.
- Added the standard content order: first screen, editor, three steps, scope and
  privacy, pricing, and footer.
- Added `.factory/claims.json` with 21 claims and exactly one tagged outcome test per
  claim. `.factory/demo.md` documents sample data and isolation.
- Added a real `404.html` and an Azure Static Web Apps 404 response override. The
  broad workspace fallback was removed.
- Added canonical, Open Graph, Twitter card, SVG favicon, 180 px touch icon, and an
  original 1200 × 630 social image to every public content route.
- Added production-like local static serving so browser tests observe real 404
  status codes and response policies.
- Changed license checks to cache results per token for one day and coalesce
  concurrent calls. Rejected and revoked licenses stay locked; 429 responses get a
  clear retry message.
- Added exact 60/61-frame and 4096/4097-pixel boundary checks, corrupt-input
  recovery, invalid-backup recovery, route axe checks, reduced-motion checks, and
  live metadata checks.
- Added `.factory/copy-audit.md` and the required verb-first catalog description.

## Clean verification

The complete gate ran from a detached clean worktree at `fb9ffe5` after `npm ci`:

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 142 packages, 0 vulnerabilities |
| `npm test` | PASS — 14/14 tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html`, 22 precached files |
| `npm run test:e2e` | PASS — 42/42 Chromium tests |

All 21 commands listed in `.factory/claims.json` were then run individually from
that clean worktree. All 21 passed. The tests exercise the shipped `/demo/` entry,
downloaded files, pixel alpha, JSON contents, IndexedDB recovery, a new offline
browser context, exact free limits, a recorded license fixture, request logs, and
demo isolation.

Build sizes are 30.26 kB raw / 10.75 kB gzip for the app JavaScript and 12.58 kB
raw / 3.81 kB gzip for CSS. The full `dist/` is 655,458 bytes. No font files ship.

## Local browser and performance checks

- Factory URL checks passed for `/`, `/demo/`, `/privacy/`, and `/terms/`: correct
  titles, `lang=en`, one h1, one main landmark, image alternatives, labeled buttons,
  and no console errors.
- Playwright axe found zero serious or critical issues on the editor, populated
  demo, both legal pages, and the designed 404.
- Phone checks passed at 390 × 664 and 390 × 844 with no horizontal overflow. The
  job, audience, sample action, and all three facts appear before scrolling.
- Keyboard focus, long-timeline scrolling, preview keys, 200% text, touch targets,
  and reduced motion passed.
- Lighthouse 12.8.2 local: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.3 s, LCP 1.7 s, TBT 0 ms, CLS 0.

## Live verification

- Deployment completed successfully to the existing one-replica static product.
- `npm run test:live` passed: 22 shell files and `sw.js` match local `dist/` byte for
  byte; demo, 404, metadata, checkout, license response, MIME, and policies pass.
- The live browser suite passed 41/41 applicable tests. The local-only waiting-worker
  mutation test passed in the 42-test clean suite and was excluded against live.
- Factory URL checks passed on `/`, `/demo/`, `/privacy/`, and `/terms/` with no
  console errors.
- Fresh desktop and phone contexts identified the job, audience, first action, and
  three facts. Fresh demo contexts showed four sources, 12 output frames, the demo
  label, and a ready 312 × 416 PNG at 41 KiB.
- Live `/does-not-exist` returns HTTP 404 with the designed recovery page.
- Live Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 10 ms, CLS 0, 33 KiB first-load transfer.
- Evidence is under `/work/.evidence/`, including local/live verifier reports,
  phone and desktop screenshots, and Lighthouse JSON.

## Earlier finding disposition

| Finding | Disposition |
| --- | --- |
| Service-worker install, offline reload, and update | PASS locally and live |
| Checkout returned 404 | PASS; hosted checkout still returns 303 |
| Invisible file-picker focus | PASS |
| Long timeline not keyboard-scrollable | PASS |
| 200% text overflow | PASS |
| Offset exceeded its bound | PASS |
| Cache headers, CSP, framing, and manifest MIME | PASS live |
| Backup restore failed under production CSP | PASS |
| Stale ready status after edits | PASS |
| Small mobile link targets | PASS |
| Offline legal pages showed the editor | PASS |
| One-click isolated sample | PASS |
| Missing claim inventory and tests | PASS — 21/21 |
| Non-plain first screen | PASS |
| Unknown routes returned the editor | PASS — deliberate HTTP 404 |
| Missing canonical and social metadata | PASS |
| Shared billing API 429/Retry-After evidence | External dependency remains; product request frequency and 429 handling are covered |

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

Run all claim commands together with `npm run test:claims`, or run each command
exactly as listed in `.factory/claims.json`.
