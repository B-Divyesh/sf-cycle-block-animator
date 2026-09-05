# Cycle Blocks review 1 — FAIL

Reviewed 2026-09-05 UTC for `cycle-block-animator-review-1`.

- Live URL: <https://cycle-block-animator.sociobot.in>
- Implementation candidate reviewed: `1b4d7718d12dcdb28a9f32a55f1c6ea1b55bdea7`
- Documentation/report commit checked out: `2ba9aaf43e6313e67a23d33eab0afdfc2fbe352f`
- The commits after the implementation candidate are report-only. `npm run build` followed by `npm run test:live` proved all 17 service-worker shell files and `sw.js` on the live site match this checkout.

## Verdict

**FAIL. Do not promote.** There are six findings, including three high-severity findings, and 18 public claims have no required claim test. A PASS requires zero findings and zero untested claims.

## Job, audience, and first action

Before scrolling a fresh desktop browser (1440 × 1000) and a fresh phone browser (390 × 664), the intended job was identifiable from the product and brief: make a reusable, offset PNG frame loop and export a budget-safe sprite sheet plus JSON. The audience is 2D game animators with numbered PNG drawings. The first visible action was **Choose PNG frames**.

The live first screen did not plainly state that job or audience in its headline. It said “Repeat drawings. Not the busywork.” The required one-click **Try it with sample data** action was absent. Neither `/demo?demo=1` nor the landing page showed sample data, a `Demo — sample data, nothing is saved` label, **Reset demo**, or **Start for real**.

Initial-screen screenshots are retained at `/work/.evidence/review-1-desktop-initial.png` and `/work/.evidence/review-1-phone-initial.png`.

## Findings

### High — no one-click sample sandbox

The product has no sample entry, sample project, demo banner, reset action, or isolated `demo:` storage namespace. `/demo?demo=1` responds 200 but is the normal empty workspace. Therefore the required realistic populated output, persistent sample label, reset behavior, and proof that demo work cannot change real data cannot be exercised. `.factory/demo.md` is also absent.

This blocks the required first-use path and makes claim verification depend on manual file injection rather than the shipped demo entry point.

### High — required claims inventory and claim tests are absent

`.factory/claims.json` does not exist. No declared command is tagged `@claim:<id>`, and there is no one-command-per-claim sandbox evidence. I counted 18 distinct visitor-reliable claims in the live product, README, and legal copy that consequently remain untested under the claims contract:

1. numbered imports retain natural filename order;
2. cycle blocks repeat source ranges non-destructively;
3. offsets rotate each pass;
4. the resolved loop can be previewed and stepped;
5. the baker observes the selected texture limit;
6. the baker observes the selected PNG KiB budget and scales when needed;
7. export produces a transparent PNG;
8. export produces engine-neutral JSON metadata;
9. artwork processing stays on the device;
10. autosave persists the project in IndexedDB;
11. the app works offline after the first visit;
12. a project backup contains and restores recipe plus PNG bytes;
13. the free tier supports 60 baked frames;
14. the free tier supports a 2048 px texture;
15. Studio raises limits to 120 frames and 8192 px;
16. Studio costs $12 once and has no subscription;
17. there are no analytics, uploads, third-party scripts, or CDN fonts; and
18. source/canvas memory limits are enforced.

Some behavior is covered by general unit and Playwright tests, but that is not claim evidence: visitors cannot find a matching claim ID, command, demo entry point, and observable assertion. `untested_claim_count` is therefore **18**.

### High — prior billing verification rate-limit blocker is still unresolved

The immediately preceding independent review, `.factory/verification-3.md`, recorded a release-blocking result for the external Sociobot billing verification endpoint: 260 invalid-token requests (including a 200-request concurrent burst) all returned 200, with no `429` or `Retry-After`. No product implementation change followed that review; the current commit is documentation-only. The regular live gate still proves only the normal invalid-token contract and checkout redirect, not rate limiting.

This product is a static PWA, so tenant isolation, backend restart persistence, health checks, and its own API rate-limit test do not apply. I did not issue a new burst to the shared billing service because it is outside this product's permitted service scope. The prior high finding cannot be considered cleared without new, in-scope provider evidence of `429` plus `Retry-After`.

### Medium — the first screen fails the plain-words onboarding contract

The h1 is a slogan rather than the animator's job, the audience is only implied by the eyebrow, and the main action requires the visitor to supply files. The first screen has neither the required sample action nor the three plain privacy/offline/price facts in the prescribed form. “A small loop press” and “The print bench is offline” are metaphor/lore wording prohibited by the plain-words contract.

### Medium — unknown routes return the workspace with HTTP 200

`GET /does-not-exist` returned HTTP 200 and rendered the normal workspace title and h1. This is not a deliberate, styled 404 page with a way back. The product has no `404.html`, response override, or 404 entry in the sitemap. A deliberate HTTP 404 would be acceptable; a successful homepage response for an unknown address is not.

### Medium — required public metadata is incomplete

The landing document supplies title, description, language, manifest, and SVG favicon, but has no canonical link, Open Graph fields, Twitter card, 1200 × 630 social image, or 180 px Apple touch icon. The legal pages likewise lack the required route-level canonical/social metadata. These are explicit site-structure requirements.

## What passed

### Clean checkout and declared commands

From the clean checkout, `npm ci` installed 142 packages with 0 vulnerabilities. Every declared command passed:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 14 Vitest tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — `dist/index.html` at root; 17 precached files |
| `npm run test:e2e` | PASS — 14 Chromium tests |
| `npm run test:live` | PASS — live artifact identity, checkout redirect, invalid-license contract, routes, MIME, and policies |

The initial app JS is 26.59 kB raw / 9.55 kB gzip and CSS is 10.53 kB raw / 3.39 kB gzip, within the static budgets.

### Live functional, recovery, privacy, and accessibility checks

- In a new desktop context, manual import of `walk_10.png`, `walk_2.png`, and `walk_1.png` reported three loaded frames in natural order: 1, 2, 10. Ten passes baked a 30-frame sheet. Downloaded JSON reported 30 frames, 12 FPS, 2,500 ms, a 10 × 12 px sheet, and `walk.png`.
- A JPEG input reported “Only PNG files are supported” and retained the three valid frames. With one source frame, 60 passes baked successfully and 61 was rejected with “Reduce it to 60 or unlock Studio for 120.”
- Fresh request tracing during load and core workflow found no external requests, uploads, analytics, trackers, or CDN fonts.
- A fresh live worker activated. Offline root reload showed the offline status, and direct offline `/privacy/` and `/terms/` reloads retained their correct titles and h1s. The local e2e suite also exercises the waiting-worker update flow.
- Playwright axe found zero serious or critical violations on live root, Privacy, Terms, and the populated workspace. At 390 px, there was no horizontal overflow; tested brand/legal targets were at least 44 px high; keyboard focus on the primary file picker showed a 4 px blue outline; and reduced motion reduced transition duration to `0.00001s`.
- Privacy and Terms have the correct route titles, one h1, and a main landmark. No page or console errors were observed in the live browser checks.

## Earlier finding disposition

| Earlier finding | Current disposition and evidence |
| --- | --- |
| Worker installation/offline/update failure | Cleared. Fresh live worker was controlled and root/legal routes reloaded offline; local update regression passed. |
| Studio checkout 404 | Cleared. `npm run test:live` observed the documented hosted-checkout 303. |
| Primary picker focus missing | Cleared. Live keyboard focus visibly outlines its label at 4 px. |
| Long timeline keyboard/axe issue | Cleared by the current local e2e regression (14/14 suite passes). |
| 200% text overflow | Cleared by the current local e2e regression and live 390 px check. |
| Offset exceeded its stated bound | Cleared by the current local e2e regression. |
| Asset caching, security headers, manifest MIME | Cleared. Live app JS is immutable for one year; manifest is `application/manifest+json`; live policy gate passes. |
| Backup restore blocked by CSP | Cleared by the production-CSP round-trip e2e regression and unchanged live artifact identity. |
| Stale Ready export state | Cleared by the current local e2e regression. |
| Mobile brand/legal targets below 44 px | Cleared by live geometry check. |
| Offline legal routes rendered workspace | Cleared by fresh live offline navigation. |
| Billing verify endpoint lacks 429/Retry-After | **Unresolved**; see high finding above. |

## Scope and next steps

No product source was modified during this review. Add a real `/demo` sample sandbox and documentation, inventory every public claim in `.factory/claims.json` with its own demo-based command, replace the slogan-led first screen with the plain job/audience/sample action/facts, implement a real 404 response and page, add required route metadata/assets, and obtain new billing-provider evidence for rate limiting. Then rerun every command and the live review.
