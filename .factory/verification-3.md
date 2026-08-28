# Independent product verification 3 — FAIL

Verified: 2026-08-28 UTC  
Candidate: `b9f4664df9a052a39cf59db31d6f4ec160be5f9b`  
Production URL: <https://cycle-block-animator.sociobot.in>  
Work order: `cycle-block-animator-verify-3`  
Environment: Linux, Node `v22.23.2`, npm `10.9.8`, Playwright/Chromium `1.58.2`, Lighthouse `13.4.1`

## Verdict

**FAIL. Do not promote this candidate.** The static PWA is otherwise healthy:
the live shell is byte-identical to the candidate build, the complete free workflow
works, and the previous deployment-only PWA/restore/checkout defects are repaired.
However, the live Sociobot license-verification API has no observed rate limiting,
which violates the explicit work-order acceptance condition for every server-side
endpoint.

## Release-blocking defect

### High — license verification endpoint does not rate limit abusive bursts

The public endpoint
`GET https://api.sociobot.in/api/v1/products/cycle-block-animator/verify?license=…`
was exercised with invalid, unique tokens and the production Origin header.

- First burst: 60 requests, concurrency 20: **60 × HTTP 200**.
- Second burst: 200 requests, concurrency 50: **200 × HTTP 200**.
- No response was HTTP 429 and no response contained `Retry-After`.

Thus the threshold observed is **not reached after 260 requests** (including a
200-request concurrent burst); it is not possible to record the required 429 / Retry-
After behavior. The normal invalid-token contract still works: `200`, JSON
`{valid:false, reason:"invalid"}`, `Cache-Control: no-store`, and CORS limited to
the product origin. This is an API-side release blocker, not a product-code change
made in this verification.

## Clean local quality gates

The checkout was clean and exactly at the requested SHA before installation.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 142 packages installed, 143 audited, 0 vulnerabilities |
| `npm test` | PASS; 14/14 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; zero findings |
| `npm run build` | PASS; exact production build, 17 files precached |
| `npm run test:e2e` | PASS; 14/14 local Chromium tests |
| `npm run test:live` | PASS; 17 shell URLs match, checkout/license/routes/MIME/policies pass |

The local suite explicitly covers PWA worker update/apply, offline root and legal
reload, production-CSP backup restore, invalid canvas recovery, 390 px targets,
keyboard focus, 200% text reflow, axe serious/critical findings, and stale-export
invalidation.

## Fresh end-to-end browser evidence

Against the deployed URL, a new Chromium context imported `walk_10.png`,
`walk_2.png`, and `walk_1.png`; the UI correctly ordered them 1, 2, 10. A three-
frame block with 10 passes and offset 1 baked a valid PNG (signature
`89504e470d0a1a0a`) and JSON with 30 frames, 12 FPS, and 2,500 ms duration. The
JSON source sequence matched the offset recipe. A JPEG input reported “Only PNG
files are supported” while retaining all three existing frames. Exact free-tier
boundary testing baked 60 frames successfully and rejected 61 with actionable
guidance.

Desktop and 390 × 844 mobile had no horizontal overflow. Keyboard focus reached the
primary file input and made its visible label show a `4px solid` focus outline. Axe
on populated desktop and mobile found zero serious or critical violations. With
reduced motion the tested transition duration was `0.00001s`. There were no page or
console errors. A fresh first-load/core-workflow request trace contained no external
requests, analytics, CDN fonts, uploads, or trackers. The PWA had an active
controller; after `context.setOffline(true)`, a reload displayed “Offline — edits
still save”.

Returned invalid-license behavior also passed: `?license=qa-return-invalid` stored
the token locally, removed it from the URL, made one verification request, showed
the inactive-license notice, and made no second request on reload. Checkout returned
`303` to the hosted `checkout.dodopayments.com` URL. Sign-in is not applicable.

## Deployment identity, privacy, policies, and budgets

`dist/index.html`, `sw.js`, `manifest.webmanifest`, `app-DDv_J5V-.js`, CSS, Privacy,
and Terms each match the live byte stream (root SHA-256
`ec57fb2438fb91b2e80089744bffed00fe2be0a5f21ed0398e227fbf7b6af3c6`; worker
`63113c7eda4916d3af6aece3210ea920c6fe3fcac584896cf6c7141132144ad9`). All 17
generated worker-shell URLs match by the repository live gate.

Live headers include restrictive self-only CSP (with only the documented Sociobot
API in `connect-src`), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff,
strict referrer policy, Permissions Policy, COOP, and two-year HSTS. Hashed assets
are immutable for one year; `sw.js` is no-store; manifest MIME is
`application/manifest+json` with no-cache.

The initial app JS is 26,594 B raw / 9,550 B gzip and CSS is 10,529 B raw / 3,390 B
gzip; no font files are shipped. The responsive illustration is 15,406 B at mobile
and 144,070 B at desktop. All stated static budgets pass. A fresh mobile Lighthouse
13.4.1 run scored Performance 100, Accessibility 100, Best Practices 100, and SEO
100 (FCP 1.1 s, LCP 1.1 s, TBT 30 ms, CLS 0).

## Scope and next step

This is a browser-only static PWA, so package-consumer, backend concurrency, health,
and persistence-server checks do not apply. No product code was changed. Before
release, add an effective rate limit to the billing verification endpoint and return
`429` with a meaningful `Retry-After`; then repeat the burst test and this release
verification.
