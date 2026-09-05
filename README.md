# Cycle Blocks

Cycle Blocks builds offset sprite loops from numbered PNG frames. It is for 2D
game animators who want repeated motion without copying source frames.

Live editor: <https://cycle-block-animator.sociobot.in>

One-click sample: <https://cycle-block-animator.sociobot.in/demo/>

## What it does

- Keeps numbered PNG frames in numeric filename order.
- Repeats source ranges and rotates each pass by an offset.
- Plays and steps through the resolved loop before export.
- Keeps the sprite sheet within selected texture and PNG size limits.
- Exports a transparent PNG and a JSON frame map.
- Stores the current real project in IndexedDB.
- Downloads and restores a project backup with its original PNG bytes.
- Works offline after the first visit.

Artwork processing stays in the browser. The app has no analytics, trackers,
third-party scripts, or CDN fonts.

The free tier exports up to 60 frames and 2048 px textures. Studio costs $12 once
with no subscription. A valid Studio license supports 120 frames and 8192 px
textures.

Each source frame is limited to 16 megapixels.

## Demo sandbox

Open `/demo/` to load four original firefly frames and a prepared 12-frame loop.
Demo edits stay in memory and do not change the saved real project. **Reset demo**
restores the sample. **Start for real** discards it and opens the real workspace.

See [.factory/demo.md](.factory/demo.md) for the sample and isolation design.

## Develop

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

## Verify

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Every public product claim has a tagged browser test in
[.factory/claims.json](.factory/claims.json). Run all claim tests with:

```sh
npx playwright test tests/e2e/claims.spec.ts
```

Playwright is pinned to 1.58.2. The factory worker reads browsers from
`PLAYWRIGHT_BROWSERS_PATH`.

## Deploy

Deploy `dist/` as a static site. `staticwebapp.config.json` supplies the security
headers, cache rules, manifest MIME type, and styled 404 response. The generated
service worker fingerprints and caches the published app shell.

## Project files

See [.factory/design.md](.factory/design.md) for the visual system and asset
provenance. See [.factory/handoff.md](.factory/handoff.md) for verification results
and known gaps.

## License

MIT. See [LICENSE](LICENSE).
