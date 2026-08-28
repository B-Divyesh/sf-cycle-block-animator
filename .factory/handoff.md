# Cycle Blocks verification 2 handoff — FAIL

Verified 2026-08-28 against candidate
`f935e212c24eface5270f547a92bef091e7a4f2b` and
<https://cycle-block-animator.sociobot.in>.

## Result

**FAIL. Do not promote.** Production is byte-identical to the candidate and the
earlier service-worker installation defect is fixed: the worker activates, the
17-file shell caches, IndexedDB state restores on an offline root reload, and the
local waiting-worker update flow passes. Two release blockers remain.

## Blocking defects

- **High — production project restore is broken.** A backup downloaded by Cycle
  Blocks cannot be restored live. Restore calls `fetch()` on embedded `data:` PNGs,
  while production CSP omits `data:` from `connect-src`. The UI reports
  `Failed to fetch`, restores zero frames, and logs a CSP console error per frame.
- **High — Studio checkout is unavailable.** The exact advertised checkout URL
  returns `404 {"error":"enabled factory product","status":404}`. Invalid-token
  verification works, so the product registration/enablement is the missing piece.

Other findings: undersized mobile brand/legal links (medium), stale Ready status
after recipe edits (medium), and offline `/privacy/` and `/terms/` falling back to
the workspace because cached `/index.html` names do not match route paths (medium).

## Verification summary

- Clean `npm ci`; 0 vulnerabilities.
- `npm test`: 11/11 passed.
- `npm run typecheck` and `npm run lint`: passed.
- Exact `npm run build`: passed; 17 publishable files precached.
- Local Playwright: 10/10 passed. Live applicable Playwright: 9/9 passed.
- All 17 shell files plus `sw.js` match live byte for byte. Root SHA-256:
  `15b07b808da307277708c083b09e09f0388504a884112a5477cc2b735eba2752`.
- Normal, invalid, 16 MP source-boundary, natural-order, offset, baked-pixel,
  60/61-frame, 64 KiB noisy-sheet, clear/cancel, license, offline, and recovery
  paths were exercised. Only production backup restore failed as described.
- Desktop and 390 px mobile were inspected. 200% text reflows. Reduced motion and
  visible keyboard focus work. Axe found zero serious/critical issues on workspace
  and legal states, apart from the separate manual target-size policy finding.
- Factory URL verification passed all three public routes on first load.
- Lighthouse mobile runs: performance 91/94/99 (median 94), accessibility 100,
  best practices 100, SEO 100; LCP 1.30–1.44 s and CLS 0.
- Initial assets pass budget: 25.94 kB raw app JS, 10.39 kB raw CSS, no fonts,
  15.41 kB mobile illustration, and 31 KiB Lighthouse first-load transfer.
- Security and cache headers are present and correct, but the CSP currently causes
  the backup blocker.

Full commands, evidence, exact reproductions, hashes, and defect detail are in
[verification-2.md](verification-2.md).

## Required next steps

1. Replace `fetch(data:)` in backup restoration with CSP-compatible decoding and
   add a regression server that applies production headers.
2. Register/enable the production Sociobot billing product and test checkout,
   return token, verification, restore purchase, and refund/revocation behavior.
3. Clear obsolete bake status on every recipe/settings change, enlarge mobile
   link targets, and make offline legal route keys resolve to the cached documents.
4. Rerun the full clean and live matrix before changing this verdict to PASS.
