# Cycle Blocks — visual thesis

## Direction: the risograph print bench

Cycle Blocks should feel like a compact production tool laid out on an animator's ink-stained print bench, not a generic dashboard. The tactile collage treatment makes repeated source drawings and their reassembled rhythm immediately legible: paper is the working plane, black keylines are crop marks, and imperfect spot-colour registration distinguishes editable inputs from baked output. Decoration is concentrated in the empty state; once artwork is loaded, the frames remain the visual focus.

## Palette

The single light treatment is intentional: it models an off-white proofing sheet and keeps imported transparent PNGs honest. Dark mode would materially change how transparent artwork is judged.

- `paper #F4EBD8`: warm uncoated stock, page background.
- `sheet #FFF9EC`: clean proof surface and input fields.
- `ink #1C1A18`: near-black key plate; primary copy and borders (14.7:1 on paper).
- `ink-muted #625D53`: secondary copy (5.8:1 on paper).
- `riso-blue #1558D6`: source/edit plate and focus ring (5.1:1 on paper).
- `riso-red #D53A36`: output/action plate; white is used for short bold action labels (4.7:1), never body copy.
- `riso-yellow #F4C542`: timing markers and selected frames; paired with ink.
- `success #146B43`, `warning #8A5100`, `danger #A52B2B`: semantic state plus icon/text, never colour alone.

## Typography and spacing

No font files or runtime requests are needed. Headlines and stamped labels use the self-hosted-by-platform slab stack `Rockwell, "Roboto Slab", "Courier New", serif`; utility copy uses `Inter, ui-sans-serif, system-ui, sans-serif`. The mismatch evokes editorial printing while retaining compact UI clarity. Type steps are 14, 16, 18, 24, 36, and 52px with tabular figures for frame counts and dimensions. Spacing follows an 8px base with 4px detail increments; controls are at least 44px high.

## Composition and interaction grammar

- An angled two-colour frame-loop illustration teaches the empty state. Its paper scraps become real frame thumbnails after import.
- Structural panels use square-ish corners, 2px ink rules, and offset hard shadows like misregistered colour plates. Cards appear only for discrete sources, block recipes, and exports.
- The primary action is always red with an ink border; editable/selected state is blue; playback timing is yellow.
- Frame blocks are sentence-like chips: source range, repeat count, offset, resulting frame count. Arrow keys move the selected source frame; Space toggles preview playback.
- Mobile drops the persistent inspector layout and stacks the same authoring order: import, recipe, preview, export.

## Motion policy

UI transitions last 160–220ms and change only opacity/transform. Preview playback is user-started and has a visible pause control; changing cycle parameters cross-fades to the newly addressed frame. Under `prefers-reduced-motion`, UI movement and cross-fades are removed, but explicitly requested frame playback remains functional because it is the core tool; the animated empty-state registration marks become static.

## Asset plan and provenance

The hero/empty-state image is an original generated raster, shown only before source art is imported. Prompt sheet: **subject** a looping strip of blank animation cels curling through crop marks; **world** small independent game animator's print bench; **materials** torn uncoated paper, dry risograph ink, halftone dots, registration offsets; **light/lens** flat editorial overhead, no photographic depth; **palette words** warm paper, cobalt blue, vermilion red, mustard yellow, charcoal; **negative list** no people, no hands, no text, no letters, no numbers, no logos, no watermark, no recognizable characters, no gradients, no glossy 3D.

- Generated with the factory Azure image deployment (`factory-image`) on 2026-08-28.
- Original prompt and generation metadata live beside the source in `assets/src/loop-print.json`.
- The selected image is reviewed for text artifacts, brands, unintended symbols, and visual seams, then exported as responsive WebP assets under 300 KB. Generated imagery is disclosed in the footer.
- Interface icons (upload, play, pause, export, trash) are original inline SVG paths or typographic symbols and are not separately licensed.
