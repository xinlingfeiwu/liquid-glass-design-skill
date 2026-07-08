# Practical Workflows

Use this reference when turning the skill into actual work. Pick one workflow, then keep the checks from the other workflows in mind.

## Workflow A: Build A New Liquid Glass UI

**Task type:** `showcase` or greenfield `product-integration`.

1. Define the product scene in one sentence: editor, dashboard, media surface, command deck, map, camera, terminal, or other believable context.
2. Choose a composition recipe from `design-recipes.md` before writing CSS:
   - one focal object or content surface;
   - one primary command surface such as a dock, toolbar, segmented control, or floating action cluster;
   - one secondary information group, usually grouped as a rail or stack instead of scattered cards.
3. Create a backdrop with depth and local high-frequency detail near glass edges. Keep the rest of the scene quiet.
4. Place glass only where it clarifies interaction. Avoid turning decorative background layers into extra UI.
5. Implement per-surface filters and profiles. Small pills use `thin`, docks and text panels use `soft`, showcase cards use carefully tuned `prominent`.
6. Verify the first screenshot against `showcase-quality.md` before adding more controls.

## Workflow B: Upgrade An Existing UI

**Task type:** `product-integration`.

1. Preserve the app's real task and information hierarchy. Do not replace the product with a generic demo background.
2. Take a screenshot and mark collision zones: overlapping panels, cramped gaps, clipped rims, text over busy imagery, and controls that are not anchored to a layout system.
3. Select the closest recipe from `design-recipes.md`, then fix layout before optics:
   - group related small cards into one rail or panel;
   - center global docks relative to the stage, not relative to nearby content;
   - reserve explicit clear space between docks, cards, and floating panels;
   - lock aspect ratios for dials, avatars, icons, covers, and previews.
4. Then tune the material: tint, rim, saturation/contrast/brightness, lens strength, dispersion, and pointer glare.
5. Compare before/after screenshots at the same viewport. If hierarchy got noisier, revert the extra glass before tuning filters again.

## Workflow C: Review Weak Liquid Glass Output

**Task type:** `review/QA`.

Use this pass when an implementation looks cheap, blurry, chaotic, or unlike real liquid glass.

- **Composition**: Is there one clear focal point, or are cards competing everywhere?
- **Optics**: Does the rim bend nearby detail, or is the surface just transparent blur?
- **Clarity**: Are text and icons sharp, or did the filter distort/rasterize content?
- **Geometry**: Are circles still circular, bars centered, edges complete, and surfaces separated?
- **Material System**: Do rim, tint, glare, shadow, and dispersion feel like one material family?
- **Fallback**: Does the UI stay legible with SVG filters disabled?
- **Proof**: Is there a rendered demo/screenshot from the current code, not an old cached preview?

Reject the result if the answer to composition, optics, clarity, or geometry is no. Fix those before adding new visual effects.

## Workflow D: Adopt The Templates

**Task type:** `component-template`.

1. Copy the vanilla or React template only as a starting point. Replace the scene and labels with the target product context.
2. Keep the public contracts stable:
   - CSS: `.lg-surface`, `.lg-panel`, `.lg-button`, `.lg-clear`, `.lg-tinted`;
   - JS: `createLiquidGlassDisplacementMap(options)` and `syncLiquidGlassMap(...)`;
   - React: `<LiquidGlass variant radius profile strength magnify dispersion blur tint supersample interactive ref>`.
3. Keep the filter root hidden and out of layout. In React, component-owned SVG filter nodes must not become flex/grid children.
4. Retune surface profiles after resizing. Reusing one map/strength across buttons, cards, and docks is a common reason the effect feels weak or jagged.
5. Generate a fresh preview with a cache-busting filename after visual changes.

## Workflow E: Visual QA Loop

**Task type:** final verification for `product-integration`, `showcase`, `component-template`, or `review/QA`.

Run this loop before claiming the UI is production-ready:

1. Open the runnable demo or app in Chromium/Electron.
2. Capture desktop and mobile screenshots.
3. Check measured geometry in the browser console or Playwright:

```js
const a = document.querySelector(".media-card").getBoundingClientRect();
const b = document.querySelector(".transport-bar").getBoundingClientRect();
const stage = document.querySelector(".visual-stage").getBoundingClientRect();
const gap = b.top - a.bottom;
const centerDelta = Math.abs((b.left + b.width / 2) - (stage.left + stage.width / 2));
console.table({ gap, centerDelta });
```

4. Treat negative gaps, clipped edges, or `centerDelta > 1` on intentionally centered docks as defects.
5. Or run the bundled helper when Playwright is available:

```bash
node liquid-glass-design/scripts/check-visual-geometry.mjs --url http://127.0.0.1:4173 --screenshot-dir ./shots
```

6. Disable SVG filter support or test Safari/Firefox fallback.
7. Test reduced motion and reduced transparency.
8. Update the README preview only after the local screenshot matches the current implementation.
