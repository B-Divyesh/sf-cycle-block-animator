# Cycle Blocks verification handoff — FAIL

Independent QA completed 2026-08-28 for candidate
`8224a10283f31b35447fd093105e6a0e1531901e` at
<https://cycle-block-animator.sociobot.in>.

## Result

**FAIL — do not promote.** Production matches the candidate byte for byte and the
online import/cycle/preview/budgeted PNG+JSON export workflow works. Release-blocking
live and accessibility defects remain:

1. The live service worker precaches unpublished `/staticwebapp.config.json` (404),
   transitions `installing -> redundant`, and leaves zero registrations. Offline
   reload and update discovery therefore cannot work on the deployed PWA.
2. The advertised Studio checkout endpoint returns 404.
3. The hidden primary PNG input receives keyboard focus with no visible indicator.
4. A long resolved-frame strip has a serious axe keyboard-scroll finding; 200% text
   at 390 px overflows by 25 px; block offset accepts values beyond its shown maximum.

Hashed assets also have only a 30-second cache lifetime, and browser hardening lacks
CSP/clickjacking/Permissions Policy headers.

## Verification summary

```sh
npm ci             # pass; 0 vulnerabilities
npm test           # pass; 8/8
npm run typecheck  # pass
npm run build      # pass
npm run test:e2e   # pass; 5/5 (local preview does not reproduce live SW failure)
```

Live checks covered actual PNG/JSON downloads and pixel order, natural filename
sorting, offset cycles, 60/61-frame limits, a noisy 64 KiB constrained bake,
project backup/restore, invalid input recovery, privacy/outbound requests, legal
routes, keyboard, reduced motion, axe, 390 px mobile, 200% text, response headers,
caching, service-worker lifecycle/offline, and production artifact hashes.

Lighthouse mobile runs: performance 88/97/98 (median 97), accessibility 100, best
practices 100, SEO 100; median LCP about 1.08 s, TBT 197 ms, CLS 0. Initial app JS is
25.82 kB raw and CSS is 10.23 kB raw.

Full evidence and severity details: [verification.md](verification.md).

## Next steps

- Exclude `staticwebapp.config.json` from precaching and add a production-equivalent
  service-worker install/update/offline test.
- Enable/register the Sociobot checkout product and verify the hosted redirect.
- Add visible focus styling to `.file-trigger:focus-within`, make the result strip
  keyboard-scrollable, fix 200% reflow, and enforce or clarify offset bounds.
- Apply immutable caching to hashed assets and add CSP/frame/permissions policies.
- Redeploy, then repeat the live PWA activation, offline reload, update toast,
  checkout, keyboard, resize, and axe checks before promotion.
