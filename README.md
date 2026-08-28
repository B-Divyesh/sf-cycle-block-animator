# Cycle Blocks

Cycle Blocks is a local-first browser tool for 2D animators who need to turn a small set of numbered PNG drawings into a longer, offset game loop without duplicating source files. It previews a non-destructive cycle recipe and bakes a PNG sprite sheet plus generic JSON metadata under explicit texture-dimension and file-size budgets.

Live product: <https://cycle-block-animator.sociobot.in>

## What it does

- Imports multiple PNG frames and preserves natural filename order (`walk_2.png` before `walk_10.png`).
- Builds one or more source-range blocks with repeat counts and per-pass offsets.
- Plays or steps through the fully resolved loop before export.
- Fits the sprite sheet under a chosen 1024–8192 px texture limit and PNG KiB budget, scaling down when necessary.
- Exports a transparent PNG and engine-neutral JSON frame map.
- Autosaves frames and recipe to IndexedDB, works offline after the first load, and exports/restores a complete local project backup.

All image work happens on the device. There are no analytics, third-party scripts, CDN fonts, uploads, or bundled sample art.

## Free and Studio

The free tier exports up to 60 baked frames and a 2048 px texture. Studio is a $12 one-time license that raises those limits to 120 frames and 8192 px. Purchase and license verification use the hosted Sociobot billing API; no payment provider is embedded. Project backup, accessibility, and local editing are never gated.

## Develop

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

## Verify

```sh
npm test            # deterministic recipe and sheet-planning tests
npm run typecheck   # strict TypeScript
npm run build       # exact production command; outputs dist/index.html
npm run test:e2e    # Chromium import/export, axe, mobile, and offline tests
```

Playwright is pinned to 1.58.2. In the factory worker, browsers are read from `PLAYWRIGHT_BROWSERS_PATH`.

## Deploy

Deploy the contents of `dist/` as a static site. The generated `sw.js` fingerprints and precaches the complete app shell. Configure clean path handling for `/privacy/` and `/terms/`; both also exist as physical `index.html` directories in the build.

## Data and browser limits

The browser stores one autosaved project. “Download project” creates a `.cycleblocks.json` backup containing the recipe and original PNG bytes. Sprite baking is capped at a 64-megapixel canvas in addition to the selected texture limit to avoid common browser memory failures. Source frames must share dimensions and each source canvas must be 16 megapixels or smaller.

See [.factory/design.md](.factory/design.md) for the visual system and generated-art provenance, and [.factory/handoff.md](.factory/handoff.md) for verification results and known gaps.

## License

MIT. See [LICENSE](LICENSE).
